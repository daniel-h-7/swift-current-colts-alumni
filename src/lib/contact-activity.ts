import "server-only";

import { getCurrentClientId } from "@/lib/client-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function logContactActivity({
  body,
  contactId,
  metadata,
  title,
  type,
}: {
  body?: string | null;
  contactId: string;
  metadata?: Record<string, unknown>;
  title: string;
  type: string;
}) {
  const supabase = createServerSupabaseClient();
  const clientId = getCurrentClientId();
  const { error } = await supabase.from("contact_activities").insert({
    activity_type: type,
    body: body ?? null,
    client_id: clientId,
    contact_id: contactId,
    metadata: {
      ...(metadata ?? {}),
      client_id: clientId,
    },
    title,
  });

  if (error) {
    throw new Error(error.message);
  }
}
