import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ClientFeatureKey =
  | "memberships"
  | "sponsors"
  | "events"
  | "spotlights"
  | "fundraising_campaigns"
  | "broadcasts"
  | "custom_domain"
  | "stripe_connect";

export type ClientIntegrationKey =
  | "stripe_connect"
  | "resend"
  | "custom_domain";

export type ClientFeature = {
  feature_key: ClientFeatureKey;
  is_enabled: boolean;
  updated_at?: string;
};

export type ClientIntegration = {
  external_account_id?: string | null;
  integration_key: ClientIntegrationKey;
  status:
    | "not_connected"
    | "pending"
    | "connected"
    | "needs_attention"
    | "disabled";
  updated_at?: string;
};

export const defaultClientFeatures: ClientFeature[] = [
  { feature_key: "memberships", is_enabled: true },
  { feature_key: "sponsors", is_enabled: true },
  { feature_key: "events", is_enabled: true },
  { feature_key: "spotlights", is_enabled: true },
  { feature_key: "fundraising_campaigns", is_enabled: false },
  { feature_key: "broadcasts", is_enabled: false },
  { feature_key: "custom_domain", is_enabled: false },
  { feature_key: "stripe_connect", is_enabled: false },
];

export const defaultClientIntegrations: ClientIntegration[] = [
  { integration_key: "stripe_connect", status: "not_connected" },
  { integration_key: "resend", status: "not_connected" },
  { integration_key: "custom_domain", status: "not_connected" },
];

const featureLabels: Record<ClientFeatureKey, string> = {
  broadcasts: "Broadcasts",
  custom_domain: "Custom Domain",
  events: "Events",
  fundraising_campaigns: "Fundraising Campaigns",
  memberships: "Memberships",
  sponsors: "Sponsors",
  spotlights: "Spotlights",
  stripe_connect: "Stripe Connect",
};

const featureDescriptions: Record<ClientFeatureKey, string> = {
  broadcasts: "Email campaigns and audience segments from the CRM.",
  custom_domain: "Publishing to the client's own domain.",
  events: "Upcoming dates, event links, and homepage calendar highlights.",
  fundraising_campaigns:
    "Campaign pages, target totals, progress, and calls to action.",
  memberships: "Membership signup, renewal status, checkout, and supporter records.",
  sponsors: "Sponsor logos, links, and partner placement on the public site.",
  spotlights: "Alumni profiles, photos, class years, and spotlight copy.",
  stripe_connect: "Client-owned payment onboarding through Stripe Connect.",
};

export function getFeatureLabel(featureKey: ClientFeatureKey) {
  return featureLabels[featureKey];
}

export function getFeatureDescription(featureKey: ClientFeatureKey) {
  return featureDescriptions[featureKey];
}

function mergeFeatures(features: ClientFeature[]) {
  const byKey = new Map<ClientFeatureKey, ClientFeature>(
    defaultClientFeatures.map((feature) => [feature.feature_key, feature]),
  );

  features.forEach((feature) => {
    byKey.set(feature.feature_key, feature);
  });

  return Array.from(byKey.values());
}

function mergeIntegrations(integrations: ClientIntegration[]) {
  const byKey = new Map<ClientIntegrationKey, ClientIntegration>(
    defaultClientIntegrations.map((integration) => [
      integration.integration_key,
      integration,
    ]),
  );

  integrations.forEach((integration) => {
    byKey.set(integration.integration_key, integration);
  });

  return Array.from(byKey.values());
}

export async function getClientFeatures(clientId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("client_features")
      .select("feature_key, is_enabled, updated_at")
      .eq("client_id", clientId)
      .order("feature_key", { ascending: true });

    if (error || !data?.length) {
      return defaultClientFeatures;
    }

    return mergeFeatures(data as ClientFeature[]);
  } catch {
    return defaultClientFeatures;
  }
}

export async function getClientIntegrations(clientId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("client_integrations")
      .select("integration_key, status, external_account_id, updated_at")
      .eq("client_id", clientId)
      .order("integration_key", { ascending: true });

    if (error || !data?.length) {
      return defaultClientIntegrations;
    }

    return mergeIntegrations(data as ClientIntegration[]);
  } catch {
    return defaultClientIntegrations;
  }
}

export function getIntegrationStatus(
  integrations: ClientIntegration[],
  integrationKey: ClientIntegrationKey,
) {
  return (
    integrations.find(
      (integration) => integration.integration_key === integrationKey,
    )?.status ?? "not_connected"
  );
}
