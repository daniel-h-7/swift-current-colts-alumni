import { NextResponse } from "next/server";
import { getClientIntegration } from "@/lib/client-integrations";
import { getPlatformClient } from "@/lib/platform-data";
import { createStripeAccountOnboardingLink } from "@/lib/stripe-connect";
import { createOrResumeStripeAccount } from "@/lib/stripe-onboarding";
import { getStudioClientOwner } from "@/lib/studio-auth";
import { studioLoginPath, studioOrigin } from "@/lib/studio-navigation";

async function onboard(request: Request, clientId: string) {
  const path = `/studio/${encodeURIComponent(clientId)}/payments`;
  const origin = studioOrigin(request.url);
  const fail = (error: string) => NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(error)}`, origin), 303);
  const owner = await getStudioClientOwner(clientId);
  if (!owner) return NextResponse.redirect(new URL(studioLoginPath(path, "Stripe setup requires this organization's Studio owner login."), origin), 303);
  if (request.method === "POST" && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Submit from Studio." }, { status: 403 });
  try {
    const client = await getPlatformClient(clientId);
    if (!client) return fail("Organization not found.");
    const existing = await getClientIntegration(clientId, "stripe_connect");
    let accountId = existing?.external_account_id;
    if (!accountId) {
      const intent = request.method === "POST" ? String((await request.formData()).get("intent")) : "continue";
      if (intent !== "new") return fail("Choose Create a new Stripe account or Connect an existing account first.");
      accountId = await createOrResumeStripeAccount(client, owner);
    }
    const link = await createStripeAccountOnboardingLink({ accountId, refreshUrl: `${origin}${path}/connect`, returnUrl: `${origin}${path}/return` });
    return NextResponse.redirect(link.url, 303);
  } catch (error) { return fail(error instanceof Error ? error.message : "Unable to continue Stripe setup."); }
}
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) { return onboard(request, (await params).clientId); }
export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) { return onboard(request, (await params).clientId); }
