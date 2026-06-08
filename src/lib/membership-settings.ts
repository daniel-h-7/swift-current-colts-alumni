import "server-only";

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

export const defaultMembershipSettings: MembershipSettings = {
  id: "default",
  annual_membership_amount_cents: 10000,
  membership_year_label: "2026 Colts Football Alumni & Booster Club",
  renewal_deadline: null,
  join_is_open: true,
  join_headline: "Join the Colts network.",
  join_body:
    "One clean contact record helps the club reach alumni, families, boosters, and community supporters when it matters.",
};

export async function getMembershipSettings() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("crm_settings")
      .select("*")
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
