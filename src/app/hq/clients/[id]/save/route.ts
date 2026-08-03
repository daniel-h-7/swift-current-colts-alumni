import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { defaultClientFeatures } from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteParams = {
  id: string;
};

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function cleanNullable(value: FormDataEntryValue | null) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function isMissingPlatformColumn(message: string) {
  return (
    message.includes("schema cache") ||
    message.includes("Could not find") ||
    message.includes("column") ||
    message.includes("client_features")
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { id } = await params;
  const clientPath = `/hq/clients/${encodeURIComponent(id)}`;

  try {
    if (!(await isHqAuthenticated())) {
      return redirectTo(request, "/hq/login");
    }

    const formData = await request.formData();
    const amount = String(formData.get("annual_membership_amount") ?? "").trim();
    const parsedAmount = amount ? Number.parseFloat(amount) : 0;

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return redirectTo(
        request,
        `${clientPath}?error=Enter%20a%20valid%20membership%20amount.`,
      );
    }

    const name = String(formData.get("name") ?? "").trim();
    const siteVariant = String(formData.get("site_variant") ?? "").trim();
    const membershipYearLabel = String(
      formData.get("membership_year_label") ?? "",
    ).trim();
    const joinHeadline = String(formData.get("join_headline") ?? "").trim();
    const joinBody = String(formData.get("join_body") ?? "").trim();
    const emailFromAddress = String(formData.get("email_from_address") ?? "")
      .trim()
      .toLowerCase();
    const emailFromName = String(formData.get("email_from_name") ?? "").trim();

    if (!name || !siteVariant || !membershipYearLabel || !joinHeadline || !joinBody) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent("Fill in all required fields.")}`,
      );
    }

    if (!emailFromAddress || !emailFromName) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent("Fill in the required email fields.")}`,
      );
    }

    const supabase = createServerSupabaseClient();
    const updatedAt = new Date().toISOString();

    const { error: clientError } = await supabase
      .from("clients")
      .update({
        name,
        primary_domain: cleanNullable(formData.get("primary_domain")),
        site_variant: siteVariant,
        updated_at: updatedAt,
      })
      .eq("id", id);

    if (clientError) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent(clientError.message)}`,
      );
    }

    const { error: platformClientError } = await supabase
      .from("clients")
      .update({
        custom_domain: cleanNullable(formData.get("custom_domain")),
        plan_key: String(formData.get("plan_key") ?? "starter").trim(),
        status: String(formData.get("status") ?? "active").trim(),
        subdomain: cleanNullable(formData.get("subdomain")),
        support_notes: cleanNullable(formData.get("support_notes")),
        updated_at: updatedAt,
      })
      .eq("id", id);

    if (
      platformClientError &&
      !isMissingPlatformColumn(platformClientError.message)
    ) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent(platformClientError.message)}`,
      );
    }

    const { error: settingsError } = await supabase.from("crm_settings").upsert(
      {
        annual_membership_amount_cents: Math.round(parsedAmount * 100),
        client_id: id,
        email_from_address: emailFromAddress,
        email_from_name: emailFromName,
        email_reply_to: String(formData.get("email_reply_to") ?? "")
          .trim()
          .toLowerCase(),
        email_sending_domain: String(formData.get("email_sending_domain") ?? "")
          .trim()
          .toLowerCase(),
        id: "default",
        join_body: joinBody,
        join_headline: joinHeadline,
        join_is_open: formData.get("join_is_open") === "on",
        membership_year_label: membershipYearLabel,
        renewal_deadline: cleanNullable(formData.get("renewal_deadline")),
        updated_at: updatedAt,
      },
      {
        onConflict: "client_id,id",
      },
    );

    if (settingsError) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent(settingsError.message)}`,
      );
    }

    const featureRows = defaultClientFeatures.map((feature) => ({
      client_id: id,
      feature_key: feature.feature_key,
      is_enabled: formData.get(`feature:${feature.feature_key}`) === "on",
      updated_at: updatedAt,
    }));
    const { error: featuresError } = await supabase
      .from("client_features")
      .upsert(featureRows, {
        onConflict: "client_id,feature_key",
      });

    if (featuresError && !isMissingPlatformColumn(featuresError.message)) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent(featuresError.message)}`,
      );
    }

    revalidatePath("/hq");
    revalidatePath(clientPath);
    revalidatePath("/");
    revalidatePath("/join");
    revalidatePath("/admin/settings");

    return redirectTo(request, `${clientPath}?saved=1`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save client settings.";

    return redirectTo(
      request,
      `${clientPath}?error=${encodeURIComponent(message)}`,
    );
  }
}
