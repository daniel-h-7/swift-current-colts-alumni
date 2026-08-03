import "server-only";

import { getSiteBrand } from "@/lib/site-brand";
import { getServerEnvValue } from "@/lib/supabase/server";

export type ClientId = "colts" | "demo" | "rmrfootball" | "bfbadgers";

const allowedClientIds = new Set<ClientId>([
  "colts",
  "demo",
  "rmrfootball",
  "bfbadgers",
]);

export function getCurrentClientId(): ClientId {
  const configuredClientId = getServerEnvValue("TEAMALUM_CLIENT_ID")
    ?.trim()
    .toLowerCase();

  if (configuredClientId && allowedClientIds.has(configuredClientId as ClientId)) {
    return configuredClientId as ClientId;
  }

  const brand = getSiteBrand();

  return brand.variant === "colts" ? "colts" : brand.variant;
}

export function withCurrentClient<T extends Record<string, unknown>>(value: T) {
  return {
    ...value,
    client_id: getCurrentClientId(),
  };
}

export function getCurrentClientFilter() {
  return {
    client_id: getCurrentClientId(),
  };
}

export function isCurrentClientId(value: string | null | undefined) {
  return value === getCurrentClientId();
}
