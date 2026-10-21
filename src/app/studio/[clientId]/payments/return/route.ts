import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { refreshClientStripeConnection } from "@/lib/stripe-connection";
import { canAccessStudioClient, hasStudioOrHqSession } from "@/lib/studio-auth";
import { studioLoginPath } from "@/lib/studio-navigation";

async function check(request: Request, clientId: string) {
  const path = `/studio/${encodeURIComponent(clientId)}/payments`;
  if (!(await hasStudioOrHqSession()) || !(await canAccessStudioClient(clientId))) return NextResponse.redirect(new URL(studioLoginPath(path, "Log in to check this organization's payment setup."), request.url), 303);
  if (request.method === "POST" && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Submit from Studio." }, { status: 403 });
  try {
    await refreshClientStripeConnection(clientId);
    revalidatePath(path); revalidatePath(`/studio/${clientId}`); revalidatePath(`/hq/clients/${clientId}`);
    return NextResponse.redirect(new URL(`${path}?stripe_returned=1`, request.url), 303);
  } catch (error) { return NextResponse.redirect(new URL(`${path}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to check Stripe.")}`, request.url), 303); }
}
export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) { return check(request, (await params).clientId); }
export async function POST(request: Request, { params }: { params: Promise<{ clientId: string }> }) { return check(request, (await params).clientId); }
