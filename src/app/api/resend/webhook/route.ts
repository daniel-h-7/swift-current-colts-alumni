import { Webhook } from "svix";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const supportedEvents = new Set([
  "email.sent", "email.delivered", "email.opened", "email.clicked",
  "email.bounced", "email.complained", "email.failed", "email.delivery_delayed", "email.suppressed",
]);
type ResendEvent = {
  type?: string;
  created_at?: string;
  data?: { email_id?: string; tags?: Record<string, string> };
};
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Email tracking is not configured." }, { status: 503 });
  let event: ResendEvent;
  try {
    // Verify the original body and timestamp before trusting any event data.
    const body = await request.text();
    new Webhook(secret).verify(body, {
      "svix-id": request.headers.get("svix-id") || "",
      "svix-timestamp": request.headers.get("svix-timestamp") || "",
      "svix-signature": request.headers.get("svix-signature") || "",
    });
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  if (!event || !supportedEvents.has(event.type || "")) return Response.json({ ignored: true });
  const emailId = event.data?.email_id;
  if (typeof emailId !== "string" || !emailId || emailId.length > 200 ||
      typeof event.created_at !== "string" || !Number.isFinite(Date.parse(event.created_at))) {
    return Response.json({ error: "Invalid email event." }, { status: 400 });
  }
  try {
    const tags = event.data?.tags;
    const { data, error } = await createServerSupabaseClient().rpc("record_resend_campaign_event", {
      p_provider_id: emailId,
      p_event_id: request.headers.get("svix-id"),
      p_event_type: event.type,
      p_created_at: event.created_at,
      p_client_id: typeof tags?.teamalum_client_id === "string" ? tags.teamalum_client_id : null,
      p_blast_id: typeof tags?.teamalum_blast_id === "string" ? tags.teamalum_blast_id : null,
    });
    if (error) throw error;
    return Response.json({ received: true, result: data });
  } catch {
    return Response.json({ error: "Unable to record email update." }, { status: 503 });
  }
}
