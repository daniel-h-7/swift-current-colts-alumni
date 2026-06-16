import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  if (!(await isAdminAuthenticated())) {
    if (wantsJson) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return redirectTo(request, "/admin/login");
  }

  const formData = await request.formData();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("crm_settings").upsert({
    email_from_address: String(formData.get("email_from_address") ?? "")
      .trim()
      .toLowerCase(),
    email_from_name: String(formData.get("email_from_name") ?? "").trim(),
    email_reply_to: String(formData.get("email_reply_to") ?? "")
      .trim()
      .toLowerCase(),
    email_sending_domain: String(formData.get("email_sending_domain") ?? "")
      .trim()
      .toLowerCase(),
    id: "default",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/campaigns");

  if (wantsJson) {
    return NextResponse.json({ ok: true });
  }

  return redirectTo(request, "/admin/settings/?email_saved=1");
}
