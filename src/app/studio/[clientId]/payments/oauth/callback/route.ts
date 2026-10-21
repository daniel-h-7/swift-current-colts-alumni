import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getStudioClientOwner } from "@/lib/studio-auth";
import { finishStripeOAuth } from "@/lib/stripe-oauth";
import { studioOrigin, studioLoginPath } from "@/lib/studio-navigation";

export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const origin = studioOrigin(request.url);
  const path = `/studio/${encodeURIComponent(clientId)}/payments`;
  const owner = await getStudioClientOwner(clientId);
  if (!owner) return NextResponse.redirect(new URL(studioLoginPath(path,"Sign in to the organization owner account and start Stripe authorization again."),origin),303);
  try {
    const query = new URL(request.url).searchParams;
    if (query.has("error")) throw new Error("Stripe authorization was canceled. Your saved connection was kept.");
    if (!query.get("code")) throw new Error("Stripe did not return an authorization code.");
    await finishStripeOAuth(clientId,owner.authUserId,origin,query.get("state") ?? "",query.get("code")!);
    revalidatePath(path);revalidatePath(`/studio/${clientId}`);revalidatePath(`/hq/clients/${clientId}`);
    return NextResponse.redirect(new URL(`${path}?stripe_returned=1`,origin),303);
  } catch(error) { return NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to authorize Stripe.")}`,origin),303); }
}
