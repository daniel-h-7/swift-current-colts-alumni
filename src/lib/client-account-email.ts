import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createServerSupabaseClient>;

export async function updateClientAccountEmail({
  clientId,
  clientUserId,
  email,
  expectedEmail,
  supabase = createServerSupabaseClient(),
}: {
  clientId: string;
  clientUserId: string;
  email: string;
  expectedEmail: string;
  supabase?: Supabase;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
    throw new Error("Enter a valid account email address.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("client_users")
    .select("id, auth_user_id, email")
    .eq("id", clientUserId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (membershipError) throw new Error("Unable to load this client account. Please try again.");
  if (!membership?.auth_user_id) throw new Error("This account is not linked to the selected client.");
  if (membership.email !== expectedEmail) throw new Error("This email changed since the page was opened. Reload before editing it.");

  const { data: authData, error: authReadError } = await supabase.auth.admin.getUserById(membership.auth_user_id);
  if (authReadError || !authData.user?.email) throw new Error("Unable to find the Studio login linked to this account.");
  const previousEmail = authData.user.email;

  // A login can belong to several clients. Updating only the selected row would
  // leave other HQ listings out of sync with the actual authentication email.
  const { data: mappings, error: mappingsError } = await supabase
    .from("client_users").select("client_id").eq("auth_user_id", membership.auth_user_id);
  if (mappingsError || !mappings?.length) throw new Error("Unable to check the sites linked to this login.");
  const { data: conflicts, error: conflictError } = await supabase
    .from("client_users").select("id").in("client_id", mappings.map(row => row.client_id))
    .eq("email", normalizedEmail).neq("auth_user_id", membership.auth_user_id).limit(1);
  if (conflictError) throw new Error("Unable to check whether this email is already assigned.");
  if (conflicts?.length) throw new Error("That email is already assigned to another account on a linked site.");

  if (previousEmail !== normalizedEmail) {
    const { error } = await supabase.auth.admin.updateUserById(membership.auth_user_id, { email: normalizedEmail, email_confirm: true });
    if (error) throw new Error("Unable to update the login email. It may already be used by another account.");
  }

  const { data: updated, error: updateError } = await supabase.from("client_users")
    .update({ email: normalizedEmail, updated_at: new Date().toISOString() })
    .eq("auth_user_id", membership.auth_user_id).select("id");
  if (updateError || !updated?.length) {
    if (previousEmail !== normalizedEmail) {
      const { error: rollbackError } = await supabase.auth.admin.updateUserById(membership.auth_user_id, { email: previousEmail, email_confirm: Boolean(authData.user.email_confirmed_at) });
      if (rollbackError) throw new Error("The login email changed, but HQ's account list could not be updated. Contact support to reconcile this account before retrying.");
    }
    throw new Error("HQ could not save the account email. The login email has been kept at its previous value. Please try again.");
  }
  return { email: normalizedEmail };
}
