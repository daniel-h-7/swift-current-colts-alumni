import { completeStripeOAuth } from "@/lib/stripe-oauth-callback";

export async function GET(request: Request) {
  return completeStripeOAuth(request);
}
