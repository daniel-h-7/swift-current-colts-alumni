import { adminPath } from "@/lib/team-admin";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getWorkspaceClientId } from "@/lib/team-admin";
import { getSiteContent, normalizeSiteContent } from "@/lib/site-content";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(await adminPath(path), request.url), 303);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return redirectTo(request, "/admin/login");
  }

  const formData = await request.formData();
  const rawContent = String(formData.get("site_content") ?? "{}");
  const parsedContent = JSON.parse(rawContent) as unknown;
  const previousContent = await getSiteContent();
  const incoming = parsedContent && typeof parsedContent === "object" && !Array.isArray(parsedContent) ? parsedContent : {};
  const siteContent = normalizeSiteContent({...previousContent, ...incoming}, undefined, previousContent);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("crm_settings").upsert({
    client_id: (await getWorkspaceClientId()),
    id: "default",
    site_content: siteContent,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "client_id,id",
  });

  if (error) {
    throw error;
  }

  revalidatePath(await adminPath("/"));
  revalidatePath(await adminPath("/preview"), "layout");
  revalidatePath(await adminPath("/site"), "layout");
  revalidatePath(await adminPath("/join"));
  revalidatePath(await adminPath("/admin/settings/site-content"));

  return redirectTo(request, "/admin/settings/site-content?saved=1");
}
