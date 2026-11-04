import { completeStripeOAuth } from "@/lib/stripe-oauth-callback";

// Keep previously registered callbacks working for in-flight and legacy connections.
export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  return completeStripeOAuth(request, (await params).clientId);
}
