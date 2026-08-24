import { NextResponse } from "next/server";
import {
  getClientIntegration,
  upsertClientIntegration,
} from "@/lib/client-integrations";
import {
  getStripeAccountStatus,
  retrieveConnectedAccount,
} from "@/lib/stripe-connect";
import { canAccessStudioClient, getStudioSession } from "@/lib/studio-auth";

type RouteParams = {
  clientId: string;
};

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { clientId } = await params;
  const paymentsPath = `/studio/${encodeURIComponent(clientId)}/payments`;

  if (!(await getStudioSession())) {
    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent("Log in to finish Stripe setup.")}`,
    );
  }

  if (!(await canAccessStudioClient(clientId))) {
    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`,
    );
  }

  try {
    const integration = await getClientIntegration(clientId, "stripe_connect");
    const accountId = integration?.external_account_id;

    if (!accountId) {
      return redirectTo(
        request,
        `${paymentsPath}?error=${encodeURIComponent("Stripe account setup was not found.")}`,
      );
    }

    const account = await retrieveConnectedAccount(accountId);
    const status = getStripeAccountStatus(account);

    await upsertClientIntegration({
      clientId,
      externalAccountId: account.id,
      integrationKey: "stripe_connect",
      metadata: {
        charges_enabled: account.charges_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
        disabled_reason: account.requirements?.disabled_reason ?? null,
        payouts_enabled: account.payouts_enabled ?? false,
      },
      status,
    });

    return redirectTo(request, `${paymentsPath}?stripe_returned=1`);
  } catch (error) {
    return redirectTo(
      request,
      `${paymentsPath}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Unable to finish Stripe setup.",
      )}`,
    );
  }
}
