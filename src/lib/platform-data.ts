import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  ClientFeature,
  ClientFeatureKey,
  defaultClientFeatures,
} from "@/lib/platform-shared";
export {
  defaultClientFeatures,
  getFeatureDescription,
  getFeatureLabel,
  getFeatureManagementLabel,
  isClientToggleableFeature,
} from "@/lib/platform-shared";
export type { ClientFeature, ClientFeatureKey } from "@/lib/platform-shared";

export type PlatformClient = {
  custom_domain?: string | null;
  id: string;
  launch_approved_at?: string | null;
  launch_review_requested_at?: string | null;
  name: string;
  plan_key?: string | null;
  primary_domain?: string | null;
  published_at?: string | null;
  site_variant: string;
  status?: string | null;
  subdomain?: string | null;
};

export type ClientIntegrationKey =
  | "stripe_connect"
  | "resend"
  | "custom_domain";

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

export const defaultClientIntegrations: ClientIntegration[] = [
  { integration_key: "stripe_connect", status: "not_connected" },
  { integration_key: "resend", status: "not_connected" },
  { integration_key: "custom_domain", status: "not_connected" },
];

export async function getPlatformClient(clientId: string) {
  try {
    const supabase = createServerSupabaseClient();
    let clientData: PlatformClient | null = null;
    let queryError: { message: string } | null = null;

    const expandedResult = await supabase
      .from("clients")
      .select(
        "id, name, site_variant, primary_domain, status, plan_key, subdomain, custom_domain, published_at, launch_approved_at, launch_review_requested_at",
      )
      .eq("id", clientId)
      .maybeSingle();

    clientData = expandedResult.data as PlatformClient | null;
    queryError = expandedResult.error;

    if (queryError && queryError.message.includes("schema cache")) {
      const fallback = await supabase
        .from("clients")
        .select("id, name, site_variant, primary_domain")
        .eq("id", clientId)
        .maybeSingle();

      clientData = fallback.data as PlatformClient | null;
      queryError = fallback.error;
    }

    if (queryError || !clientData) {
      return null;
    }

    return clientData;
  } catch {
    return null;
  }
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
