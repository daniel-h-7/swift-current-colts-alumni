import "server-only";

import { getCurrentClientId } from "@/lib/client-context";
import { getSiteBrand } from "@/lib/site-brand";
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
  const brand = getSiteBrand();

  return {
    id: "default",
    annual_membership_amount_cents: 10000,
    membership_year_label:
      brand.variant === "rmrfootball"
        ? "Rocky Mountain Rams Football Alumni & Boosters"
        : brand.variant === "bfbadgers"
          ? "BF Badgers Football Alumni & Boosters"
          : `2026 ${brand.programName} Alumni & Booster Club`,
    renewal_deadline: null,
    join_is_open: true,
    join_headline: "Help build the legacy.",
    join_body: brand.joinSubtext,
  };
}

export async function getMembershipSettings() {
  const defaultMembershipSettings = getDefaultMembershipSettings();

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("crm_settings")
      .select("*")
      .eq("client_id", getCurrentClientId())
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
