import "server-only";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getStudioClientOwner } from "@/lib/studio-auth";
import { finishStripeOAuth, resolveStripeOAuthClientId } from "@/lib/stripe-oauth";
import { studioOrigin, studioLoginPath } from "@/lib/studio-navigation";

export async function completeStripeOAuth(request: Request, legacyClientId?: string) {
  const origin = studioOrigin(request.url);
  let path = "/studio";
  try {
    const query = new URL(request.url).searchParams;
    const state = query.get("state") ?? "";
    const clientId = await resolveStripeOAuthClientId(state, origin);
    if (legacyClientId && legacyClientId !== clientId) {
      throw new Error("Stripe authorization does not match this organization. Start again from Payments.");
    }
    path = `/studio/${encodeURIComponent(clientId)}/payments`;
    const owner = await getStudioClientOwner(clientId);
    if (!owner) {
      return NextResponse.redirect(new URL(studioLoginPath(path, "Sign in to the organization owner account and start Stripe authorization again."), origin), 303);
    }
    if (query.has("error")) throw new Error("Stripe authorization was canceled. Your saved connection was kept.");
    const code = query.get("code");
    if (!code) throw new Error("Stripe did not return an authorization code.");
    // Rechecks the exact owner, team, origin, mode, browser and expiry, then consumes once.
    await finishStripeOAuth(clientId, owner.authUserId, origin, state, code);
    revalidatePath(path);
    revalidatePath(`/studio/${clientId}`);
    revalidatePath(`/hq/clients/${clientId}`);
    return NextResponse.redirect(new URL(`${path}?stripe_returned=1`, origin), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to authorize Stripe.";
    const target = path === "/studio" ? studioLoginPath(path, message) : `${path}?error=${encodeURIComponent(message)}`;
    return NextResponse.redirect(new URL(target, origin), 303);
  }
}
