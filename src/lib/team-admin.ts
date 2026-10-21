import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { getCurrentClientId } from "@/lib/client-context";
import { getStudioSession } from "@/lib/studio-auth";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteBrand } from "@/lib/site-brand";
import { studioLoginPath } from "@/lib/studio-navigation";
import { teamAdminHeader, teamAdminPath } from "@/lib/team-admin-routing";

export async function getTeamAdminClientId() {
  return (await headers()).get(teamAdminHeader);
}
export const canManageTeamOperations = cache(
  async function canManageTeamOperations(clientId: string) {
    if (await isHqAuthenticated()) return true;
    const session = await getStudioSession();
    if (!session) return false;
    const { data, error } = await createServerSupabaseClient()
      .from("client_users")
      .select("role")
      .eq("client_id", clientId)
      .eq("auth_user_id", session.authUserId)
      .maybeSingle();
    return !error && !!data && ["owner", "admin"].includes(data.role);
  },
);
export async function getWorkspaceClientId() {
  const clientId = await getTeamAdminClientId();
  if (!clientId) return getCurrentClientId();
  if (!(await canManageTeamOperations(clientId)))
    throw new Error(
      "This account cannot manage this team's contacts or campaigns.",
    );
  return clientId;
}
export async function adminPath(path: string) {
  const clientId = await getTeamAdminClientId();
  if (clientId && path === "/admin/login")
    return studioLoginPath(`/studio/${encodeURIComponent(clientId)}/hub`);
  return teamAdminPath(path, clientId);
}
export async function getAdminBrand() {
  const clientId = await getTeamAdminClientId();
  if (!clientId) return getSiteBrand();
  const client = await getPlatformClient(await getWorkspaceClientId());
  if (!client) throw new Error("Organization not found.");
  return {
    ...getSiteBrand(client.site_variant),
    crmName: `${client.name} CRM`,
    programName: client.name,
  };
}
