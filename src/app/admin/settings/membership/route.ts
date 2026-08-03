import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return redirectTo(request, "/admin/login");
    }

    const formData = await request.formData();
    const amount = String(formData.get("annual_membership_amount") ?? "").trim();
    const parsedAmount = amount ? Number.parseFloat(amount) : 0;

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return redirectTo(
        request,
        "/admin/settings/?error=Enter%20a%20valid%20membership%20amount.",
      );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("crm_settings").upsert({
      annual_membership_amount_cents: Math.round(parsedAmount * 100),
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
      return redirectTo(
        request,
        `/admin/settings/?error=${encodeURIComponent(error.message)}`,
      );
    }

    revalidatePath("/join");
    revalidatePath("/admin/settings");

    return redirectTo(request, "/admin/settings/?saved=1");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save settings.";

    return redirectTo(
      request,
      `/admin/settings/?error=${encodeURIComponent(message)}`,
    );
  }
}
