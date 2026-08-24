import "server-only";

import { getCurrentClientId } from "@/lib/client-context";
import { getPlatformClient } from "@/lib/platform-data";

export async function getCurrentClientLaunchState() {
  const clientId = getCurrentClientId();
  const client = await getPlatformClient(clientId);

  return {
    client,
    clientId,
    isApproved: Boolean(client?.launch_approved_at),
  };
}
