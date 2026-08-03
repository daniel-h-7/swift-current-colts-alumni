import "server-only";

import { defaultClientFeatures } from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CreateClientInput = {
  annualMembershipAmountCents?: number;
  clientId: string;
  customDomain?: string | null;
  joinBody?: string;
  joinHeadline?: string;
  membershipYearLabel?: string;
  name: string;
  planKey?: string;
  siteVariant?: string;
  status?: string;
  subdomain?: string | null;
};

function isMissingPlatformShape(message: string) {
  return (
    message.includes("schema cache") ||
    message.includes("Could not find") ||
    message.includes("column") ||
    message.includes("client_features") ||
    message.includes("client_integrations")
  );
}

export function normalizeClientId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createTeamAlumClient(input: CreateClientInput) {
  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();
  const siteVariant = input.siteVariant?.trim() || input.clientId;
  const planKey = input.planKey?.trim() || "starter";
  const status = input.status?.trim() || "trial";
  const joinHeadline = input.joinHeadline?.trim() || "Help build the legacy.";
  const joinBody =
    input.joinBody?.trim() ||
    "Your gift today helps ensure student-athletes have the necessary tools to succeed on and off the football field.";
  const membershipYearLabel =
    input.membershipYearLabel?.trim() ||
    "Annual Football Alumni and Booster Club";
  const annualMembershipAmountCents =
    input.annualMembershipAmountCents ?? 10000;
  const baseClient = {
    id: input.clientId,
    name: input.name,
    primary_domain: input.customDomain,
    site_variant: siteVariant,
    updated_at: now,
  };

  const { error: expandedClientError } = await supabase.from("clients").insert({
    ...baseClient,
    custom_domain: input.customDomain,
    plan_key: planKey,
    status,
    subdomain: input.subdomain,
    support_notes: null,
  });

  if (expandedClientError) {
    if (!isMissingPlatformShape(expandedClientError.message)) {
      throw new Error(expandedClientError.message);
    }

    const { error: fallbackClientError } = await supabase
      .from("clients")
      .insert(baseClient);

    if (fallbackClientError) {
      throw new Error(fallbackClientError.message);
    }
  }

  const { error: settingsError } = await supabase.from("crm_settings").upsert(
    {
      annual_membership_amount_cents: annualMembershipAmountCents,
      client_id: input.clientId,
      id: "default",
      join_body: joinBody,
      join_headline: joinHeadline,
      join_is_open: true,
      membership_year_label: membershipYearLabel,
      updated_at: now,
    },
    {
      onConflict: "client_id,id",
    },
  );

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const featureRows = defaultClientFeatures.map((feature) => ({
    client_id: input.clientId,
    feature_key: feature.feature_key,
    is_enabled: feature.is_enabled,
    updated_at: now,
  }));
  const { error: featureError } = await supabase
    .from("client_features")
    .upsert(featureRows, {
      onConflict: "client_id,feature_key",
    });

  if (featureError && !isMissingPlatformShape(featureError.message)) {
    throw new Error(featureError.message);
  }

  const { error: integrationError } = await supabase
    .from("client_integrations")
    .upsert(
      [
        { client_id: input.clientId, integration_key: "stripe_connect", updated_at: now },
        { client_id: input.clientId, integration_key: "resend", updated_at: now },
        { client_id: input.clientId, integration_key: "custom_domain", updated_at: now },
      ],
      {
        onConflict: "client_id,integration_key",
      },
    );

  if (integrationError && !isMissingPlatformShape(integrationError.message)) {
    throw new Error(integrationError.message);
  }
}
