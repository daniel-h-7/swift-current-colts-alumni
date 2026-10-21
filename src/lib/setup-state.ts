import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function updateSetupState(clientId: string, patch: Record<string, unknown>) {
  const { error } = await createServerSupabaseClient().rpc("teamalum_update_setup_state", { p_client_id: clientId, p_patch: patch });
  if (error) throw new Error("Unable to save setup progress. Apply the setup reliability migration before continuing.");
}
