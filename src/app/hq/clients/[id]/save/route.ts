import { approveClientLaunch } from "@/lib/launch-review";
import { updateSetupState } from "@/lib/setup-state";
import { clientHostname, validateClientSubdomain } from "@/lib/client-address";
import { getClientFeatures, getClientIntegrations, getPlatformClient, isClientToggleableFeature } from "@/lib/platform-data";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isHqAuthenticated } from "@/lib/hq-auth";
import {
  ClientIntegrationKey,
  defaultClientFeatures,
  defaultClientIntegrations,
} from "@/lib/platform-data";
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

function getIntegrationStatusValue(
  formData: FormData,
  integrationKey: ClientIntegrationKey,
) {
  const value = String(
    formData.get(`integration:${integrationKey}:status`) ?? "not_connected",
  ).trim();
  const allowedStatuses = new Set([
    "not_connected",
    "pending",
    "connected",
    "needs_attention",
    "disabled",
  ]);

  return allowedStatuses.has(value) ? value : "not_connected";
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
    const intent = String(formData.get("intent") ?? "save");
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
    const subdomain = cleanNullable(formData.get("subdomain")) ?? id;
    const addressError = validateClientSubdomain(subdomain);
    if (addressError) throw new Error(addressError);
    const [previousClient, previousFeatures, previousIntegrations, previousSettingsResult] = await Promise.all([
      getPlatformClient(id), getClientFeatures(id), getClientIntegrations(id),
      supabase.from("crm_settings").select("annual_membership_amount_cents, membership_year_label, join_headline, join_body, join_is_open").eq("client_id",id).eq("id","default").maybeSingle(),
    ]);
    if (!previousClient || previousSettingsResult.error) throw new Error("Unable to check the current settings before saving.");
    const previousSettings = previousSettingsResult.data;
    const domainChanged = (previousClient.subdomain || id) !== subdomain;
    const detailsChanged = previousClient.name !== name || previousClient.site_variant !== siteVariant || domainChanged ||
      previousSettings?.annual_membership_amount_cents !== Math.round(parsedAmount * 100) || previousSettings?.membership_year_label !== membershipYearLabel ||
      previousSettings?.join_headline !== joinHeadline || previousSettings?.join_body !== joinBody || previousSettings?.join_is_open !== (formData.get("join_is_open") === "on");
    const primaryDomain = clientHostname({ id, subdomain }, process.env.TEAMALUM_ROOT_DOMAIN ?? "teamalum.com");

    const { error: clientError } = await supabase
      .from("clients")
      .update({
        name,
        primary_domain: primaryDomain,
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

    const platformClientUpdates: Record<string, string | null> = {

      plan_key: String(formData.get("plan_key") ?? "starter").trim(),
      status: String(formData.get("status") ?? "active").trim(),
      subdomain,
      support_notes: cleanNullable(formData.get("support_notes")),
      updated_at: updatedAt,
    };

    if (intent === "unapprove_launch") {
      platformClientUpdates.launch_approved_at = null;
    }

    const { error: platformClientError } = await supabase
      .from("clients")
      .update(platformClientUpdates)
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
      is_enabled: isClientToggleableFeature(feature.feature_key) ? formData.get(`feature:${feature.feature_key}`) === "on" : previousFeatures.find(f=>f.feature_key===feature.feature_key)?.is_enabled ?? feature.is_enabled,
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

    const integrationRows = defaultClientIntegrations.filter(integration => integration.integration_key !== "stripe_connect" && (formData.has(`integration:${integration.integration_key}:status`) || formData.has(`integration:${integration.integration_key}:external_account_id`))).map((integration) => ({
      client_id: id,
      external_account_id: formData.has(`integration:${integration.integration_key}:external_account_id`) ? cleanNullable(formData.get(`integration:${integration.integration_key}:external_account_id`)) : previousIntegrations.find(i=>i.integration_key===integration.integration_key)?.external_account_id ?? null,
      integration_key: integration.integration_key,
      status: getIntegrationStatusValue(formData, integration.integration_key),
      updated_at: updatedAt,
    }));
    const { error: integrationsError } = await supabase
      .from("client_integrations")
      .upsert(integrationRows, {
        onConflict: "client_id,integration_key",
      });

    if (
      integrationsError &&
      !isMissingPlatformColumn(integrationsError.message)
    ) {
      return redirectTo(
        request,
        `${clientPath}?error=${encodeURIComponent(integrationsError.message)}`,
      );
    }

    const featuresChanged = featureRows.some(row=>previousFeatures.find(f=>f.feature_key===row.feature_key)?.is_enabled!==row.is_enabled);
    if (detailsChanged || featuresChanged) await updateSetupState(id, { preview_reviewed_at: null, ...(domainChanged ? { domain_verified_at: null, domain_verified_hostname: null } : {}), ...(featuresChanged ? { features_reviewed_at: null } : {}) });
    if (intent === "approve_launch") await approveClientLaunch(id, formData.get("override_launch") === "on" ? String(formData.get("override_reason") ?? "") : undefined);
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
