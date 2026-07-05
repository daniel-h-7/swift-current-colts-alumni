import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeSiteContent } from "@/lib/site-content";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return redirectTo(request, "/admin/login");
  }

  const formData = await request.formData();
  const rawContent = String(formData.get("site_content") ?? "{}");
  const parsedContent = JSON.parse(rawContent) as unknown;
  const siteContent = normalizeSiteContent(parsedContent);
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("crm_settings").upsert({
    id: "default",
    site_content: siteContent,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/settings/site-content");

  return redirectTo(request, "/admin/settings/site-content?saved=1");
}
