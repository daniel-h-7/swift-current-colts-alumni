import { NextResponse } from "next/server";
import { getStudioClientIdsForUser, getStudioSession } from "@/lib/studio-auth";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { canManageTeamOperations } from "@/lib/team-admin";
import { teamAdminPath } from "@/lib/team-admin-routing";
import { safeLegacyAdminPath, legacyAdminResource } from "@/lib/legacy-admin-routing";
import { studioLoginPath } from "@/lib/studio-navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = safeLegacyAdminPath(url.searchParams.get("path"));
  const target = (value: string) => NextResponse.redirect(new URL(value, url.origin), 303);
  const session = await getStudioSession();
  const hq = await isHqAuthenticated();
  if (!session && !hq) {
    const next = `/studio/admin/recover?${new URLSearchParams({ path, ...(url.searchParams.get("team") ? {team: url.searchParams.get("team")!} : {}) })}`;
    return target(studioLoginPath(next));
  }

  // Resolve ownership from the database, never from a team ID submitted by a form.
  const resource = legacyAdminResource(path);
  if (resource) {
    const { data, error } = await createServerSupabaseClient().from(resource.table)
      .select("client_id").eq("id", resource.id).maybeSingle();
    if (!error && data?.client_id && await canManageTeamOperations(data.client_id)) {
      return target(teamAdminPath(path, data.client_id));
    }
    return target(hq ? "/hq" : "/studio");
  }

  // A same-origin referring workspace is a navigation hint, not authorization.
  const hint = url.searchParams.get("team");
  if (hint && /^[a-zA-Z0-9_-]+$/.test(hint) && await canManageTeamOperations(hint)) {
    return target(teamAdminPath(path, hint));
  }
  if (session) {
    const ids = await getStudioClientIdsForUser(session.authUserId);
    if (ids.length === 1 && await canManageTeamOperations(ids[0])) return target(teamAdminPath(path, ids[0]));
  }
  return target(hq ? "/hq" : "/studio");
}
