import { NextResponse } from "next/server";
import { getStudioClientOwner } from "@/lib/studio-auth";
import { beginStripeOAuth } from "@/lib/stripe-oauth";
import { studioLoginPath, studioOrigin } from "@/lib/studio-navigation";

export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const path = `/studio/${encodeURIComponent(clientId)}/payments`;
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Submit from Studio." }, { status: 403 });
  const origin = studioOrigin(request.url);
  const owner = await getStudioClientOwner(clientId);
  if (!owner) return NextResponse.redirect(new URL(studioLoginPath(path, "The organization owner must authorize its Stripe account."),origin),303);
  try { return NextResponse.redirect(await beginStripeOAuth(clientId,owner.authUserId,origin),303); }
  catch(error) { return NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to authorize Stripe.")}`,origin),303); }
}
