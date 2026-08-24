import "server-only";

import { getCurrentClientId } from "@/lib/client-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function logContactActivity({
  body,
  clientId,
  contactId,
  metadata,
  title,
  type,
}: {
  body?: string | null;
  clientId?: string;
  contactId: string;
  metadata?: Record<string, unknown>;
  title: string;
  type: string;
}) {
  const supabase = createServerSupabaseClient();
  const resolvedClientId = clientId ?? getCurrentClientId();
  const { error } = await supabase.from("contact_activities").insert({
    activity_type: type,
    body: body ?? null,
    client_id: resolvedClientId,
    contact_id: contactId,
    metadata: {
      ...(metadata ?? {}),
      client_id: resolvedClientId,
    },
    title,
  });

  if (error) {
    throw new Error(error.message);
  }
}
