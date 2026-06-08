import "server-only";

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
  const { error } = await supabase.from("contact_activities").insert({
    activity_type: type,
    body: body ?? null,
    contact_id: contactId,
    metadata: metadata ?? {},
    title,
  });

  if (error) {
    throw new Error(error.message);
  }
}
