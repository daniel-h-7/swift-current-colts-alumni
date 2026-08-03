import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { defaultClientFeatures } from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function cleanNullable(value: FormDataEntryValue | null) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

function cleanId(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isMissingPlatformColumn(message: string) {
  return (
    message.includes("schema cache") ||
    message.includes("Could not find") ||
    message.includes("column") ||
    message.includes("client_features") ||
    message.includes("client_integrations")
  );
}

export async function POST(request: Request) {
  try {
    if (!(await isHqAuthenticated())) {
      return redirectTo(request, "/hq/login");
    }

    const formData = await request.formData();
    const id = cleanId(formData.get("id"));
    const name = String(formData.get("name") ?? "").trim();
    const siteVariant = String(formData.get("site_variant") ?? "").trim();
    const amount = String(formData.get("annual_membership_amount") ?? "").trim();
    const parsedAmount = amount ? Number.parseFloat(amount) : 0;
    const membershipYearLabel = String(
      formData.get("membership_year_label") ?? "",
    ).trim();
    const joinHeadline = String(formData.get("join_headline") ?? "").trim();
    const joinBody = String(formData.get("join_body") ?? "").trim();

    if (!id || !name || !siteVariant) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent("Fill in the client identity fields.")}`,
      );
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return redirectTo(
        request,
        "/hq/clients/new?error=Enter%20a%20valid%20membership%20amount.",
      );
    }

    if (!membershipYearLabel || !joinHeadline || !joinBody) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent("Fill in the membership defaults.")}`,
      );
    }

    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();
    const baseClient = {
      id,
      name,
      primary_domain: cleanNullable(formData.get("custom_domain")),
      site_variant: siteVariant,
      updated_at: now,
    };

    const { error: clientError } = await supabase.from("clients").insert({
      ...baseClient,
      custom_domain: cleanNullable(formData.get("custom_domain")),
      plan_key: String(formData.get("plan_key") ?? "starter").trim(),
      status: String(formData.get("status") ?? "trial").trim(),
      subdomain: cleanNullable(formData.get("subdomain")),
      support_notes: null,
    });

    if (clientError) {
      if (!isMissingPlatformColumn(clientError.message)) {
        return redirectTo(
          request,
          `/hq/clients/new?error=${encodeURIComponent(clientError.message)}`,
        );
      }

      const { error: fallbackClientError } = await supabase
        .from("clients")
        .insert(baseClient);

      if (fallbackClientError) {
        return redirectTo(
          request,
          `/hq/clients/new?error=${encodeURIComponent(fallbackClientError.message)}`,
        );
      }
    }

    const { error: settingsError } = await supabase.from("crm_settings").upsert(
      {
        annual_membership_amount_cents: Math.round(parsedAmount * 100),
        client_id: id,
        id: "default",
        join_body: joinBody,
        join_headline: joinHeadline,
        join_is_open: formData.get("join_is_open") === "on",
        membership_year_label: membershipYearLabel,
        renewal_deadline: cleanNullable(formData.get("renewal_deadline")),
        updated_at: now,
      },
      {
        onConflict: "client_id,id",
      },
    );

    if (settingsError) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent(settingsError.message)}`,
      );
    }

    const featureRows = defaultClientFeatures.map((feature) => ({
      client_id: id,
      feature_key: feature.feature_key,
      is_enabled: formData.get(`feature:${feature.feature_key}`) === "on",
      updated_at: now,
    }));
    const { error: featureError } = await supabase
      .from("client_features")
      .upsert(featureRows, {
        onConflict: "client_id,feature_key",
      });

    if (featureError && !isMissingPlatformColumn(featureError.message)) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent(featureError.message)}`,
      );
    }

    const { error: integrationError } = await supabase
      .from("client_integrations")
      .upsert(
        [
          { client_id: id, integration_key: "stripe_connect", updated_at: now },
          { client_id: id, integration_key: "resend", updated_at: now },
          { client_id: id, integration_key: "custom_domain", updated_at: now },
        ],
        {
          onConflict: "client_id,integration_key",
        },
      );

    if (
      integrationError &&
      !isMissingPlatformColumn(integrationError.message)
    ) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent(integrationError.message)}`,
      );
    }

    revalidatePath("/hq");
    return redirectTo(request, `/hq/clients/${encodeURIComponent(id)}?saved=1`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create client.";

    return redirectTo(
      request,
      `/hq/clients/new?error=${encodeURIComponent(message)}`,
    );
  }
}
