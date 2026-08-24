import { NextResponse } from "next/server";
import {
  getClientIntegration,
  upsertClientIntegration,
} from "@/lib/client-integrations";
import { getPlatformClient } from "@/lib/platform-data";
import {
  createStandardConnectedAccount,
  createStripeAccountOnboardingLink,
} from "@/lib/stripe-connect";
import { canAccessStudioClient, getStudioSession } from "@/lib/studio-auth";

type RouteParams = {
  clientId: string;
};

function getOrigin(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

async function createOnboardingRedirect(
  request: Request,
  clientId: string,
) {
  const session = await getStudioSession();
  const paymentsPath = `/studio/${encodeURIComponent(clientId)}/payments`;

  if (!session) {
    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent("Log in to connect Stripe.")}`,
    );
  }

  if (!(await canAccessStudioClient(clientId))) {
    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`,
    );
  }

  const client = await getPlatformClient(clientId);

  if (!client) {
    return redirectTo(
      request,
      `${paymentsPath}?error=${encodeURIComponent("Client site not found.")}`,
    );
  }

  try {
    const existingIntegration = await getClientIntegration(
      clientId,
      "stripe_connect",
    );
    let accountId = existingIntegration?.external_account_id ?? null;

    if (!accountId) {
      const account = await createStandardConnectedAccount({
        clientId,
        email: session.email,
        name: client.name,
        websiteUrl: client.custom_domain
          ? `https://${client.custom_domain}`
          : client.primary_domain
            ? `https://${client.primary_domain}`
            : null,
      });

      accountId = account.id;
    }

    await upsertClientIntegration({
      clientId,
      externalAccountId: accountId,
      integrationKey: "stripe_connect",
      metadata: {
        source: "studio_onboarding",
      },
      status: "pending",
    });

    const origin = getOrigin(request);
    const accountLink = await createStripeAccountOnboardingLink({
      accountId,
      refreshUrl: `${origin}/studio/${encodeURIComponent(clientId)}/payments/connect`,
      returnUrl: `${origin}/studio/${encodeURIComponent(clientId)}/payments/return`,
    });

    return NextResponse.redirect(accountLink.url, 303);
  } catch (error) {
    return redirectTo(
      request,
      `${paymentsPath}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Unable to start Stripe onboarding.",
      )}`,
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { clientId } = await params;

  return createOnboardingRedirect(request, clientId);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { clientId } = await params;

  return createOnboardingRedirect(request, clientId);
}
