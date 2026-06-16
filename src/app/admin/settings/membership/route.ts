import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return redirectTo(request, "/admin/login");
  }

  const formData = await request.formData();
  const amount = String(formData.get("annual_membership_amount") ?? "").trim();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("crm_settings").upsert({
    annual_membership_amount_cents: amount
      ? Math.round(Number.parseFloat(amount) * 100)
      : 0,
    id: "default",
    join_body: String(formData.get("join_body") ?? "").trim(),
    join_headline: String(formData.get("join_headline") ?? "").trim(),
    join_is_open: formData.get("join_is_open") === "on",
    membership_year_label: String(
      formData.get("membership_year_label") ?? "",
    ).trim(),
    renewal_deadline:
      String(formData.get("renewal_deadline") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  revalidatePath("/join");
  revalidatePath("/admin/settings");

  return redirectTo(request, "/admin/settings/?saved=1");
}
