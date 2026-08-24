import "server-only";

import {
  ClientIntegrationKey,
  getClientIntegrations,
} from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ClientIntegrationStatus =
  | "not_connected"
  | "pending"
  | "connected"
  | "needs_attention"
  | "disabled";

export async function getClientIntegration(
  clientId: string,
  integrationKey: ClientIntegrationKey,
) {
  const integrations = await getClientIntegrations(clientId);

  return integrations.find(
    (integration) => integration.integration_key === integrationKey,
  );
}

export async function upsertClientIntegration({
  clientId,
  externalAccountId,
  integrationKey,
  metadata = {},
  status,
}: {
  clientId: string;
  externalAccountId?: string | null;
  integrationKey: ClientIntegrationKey;
  metadata?: Record<string, unknown>;
  status: ClientIntegrationStatus;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("client_integrations").upsert(
    {
      client_id: clientId,
      external_account_id: externalAccountId ?? null,
      integration_key: integrationKey,
      metadata,
      status,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "client_id,integration_key",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}
