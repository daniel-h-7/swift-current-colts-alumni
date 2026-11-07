import "server-only";

import { getWorkspaceClientId } from "@/lib/team-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MembershipSettings = {
  id: "default";
  annual_membership_amount_cents: number;
  membership_year_label: string;
  renewal_deadline: string | null;
  join_is_open: boolean;
  join_headline: string;
  join_body: string;
  updated_at?: string;
};

export function getDefaultMembershipSettings(): MembershipSettings {
  return {
    id: "default",
    annual_membership_amount_cents: 10000,
    membership_year_label: "Your Team Alumni & Boosters",
    renewal_deadline: null,
    join_is_open: true,
    join_headline: "Help build the legacy.",
    join_body: "Your support helps create opportunities for our student-athletes on and off the field.",
  };
}

export async function getMembershipSettings() {
  return getMembershipSettingsForClient(await getWorkspaceClientId());
}

export async function getMembershipSettingsForClient(clientId: string) {
  const defaultMembershipSettings = getDefaultMembershipSettings();

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("crm_settings")
      .select("*")
      .eq("client_id", clientId)
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return defaultMembershipSettings;
    }

    return {
      ...defaultMembershipSettings,
      ...data,
    } as MembershipSettings;
  } catch {
    return defaultMembershipSettings;
  }
}

export function formatMembershipAmount(settings: MembershipSettings) {
  return new Intl.NumberFormat("en-CA", {
    currency: "CAD",
    style: "currency",
  }).format(settings.annual_membership_amount_cents / 100);
}
