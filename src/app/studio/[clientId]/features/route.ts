import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  defaultClientFeatures,
  isClientToggleableFeature,
} from "@/lib/platform-data";
import {
  defaultSiteSections,
  saveSiteSections,
  SiteSectionKey,
} from "@/lib/site-sections";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canAccessStudioClient } from "@/lib/studio-auth";

type RouteParams = {
  clientId: string;
};

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function isMissingFeatureTable(message: string) {
  return (
    message.includes("schema cache") ||
    message.includes("Could not find") ||
    message.includes("client_features")
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { clientId } = await params;

  try {
    if (!(await canAccessStudioClient(clientId))) {
      return redirectTo(
        request,
        "/studio/login?error=Log%20in%20to%20manage%20your%20site.",
      );
    }

    const formData = await request.formData();
    const intent = String(formData.get("intent") ?? "save");
    const supabase = createServerSupabaseClient();
    const now = new Date().toISOString();
    const featureRows = defaultClientFeatures.map((feature) => ({
      client_id: clientId,
      feature_key: feature.feature_key,
      is_enabled: isClientToggleableFeature(feature.feature_key)
        ? formData.get(`feature:${feature.feature_key}`) === "on"
        : feature.is_enabled,
      updated_at: now,
    }));

    const { error: featureError } = await supabase
      .from("client_features")
      .upsert(featureRows, {
        onConflict: "client_id,feature_key",
      });

    if (featureError && !isMissingFeatureTable(featureError.message)) {
      return redirectTo(
        request,
        `/studio/${encodeURIComponent(clientId)}?error=${encodeURIComponent(featureError.message)}`,
      );
    }

    const submittedOrder = formData
      .getAll("section_order")
      .map((value) => String(value)) as SiteSectionKey[];
    const hasSectionOrder = formData.get("has_section_order") === "1";
    const orderedKeys = submittedOrder.length || hasSectionOrder
      ? submittedOrder
      : defaultSiteSections.map((section) => section.section_key);
    const orderedKeySet = new Set(orderedKeys);
    const disabledKeys = defaultSiteSections
      .map((section) => section.section_key)
      .filter((sectionKey) => !orderedKeySet.has(sectionKey));
    const sections = [...orderedKeys, ...disabledKeys].map((sectionKey, index) => ({
      is_enabled: orderedKeySet.has(sectionKey),
      section_key: sectionKey,
      sort_order: (index + 1) * 10,
    }));

    await saveSiteSections(clientId, sections);

    revalidatePath(`/studio/${clientId}`);
    revalidatePath(`/preview/${clientId}`);

    if (intent === "continue") {
      return redirectTo(
        request,
        `/studio/${encodeURIComponent(clientId)}/content?saved=features`,
      );
    }

    return redirectTo(request, `/studio/${encodeURIComponent(clientId)}?saved=features`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save feature settings.";

    return redirectTo(
      request,
      `/studio/${encodeURIComponent(clientId)}?error=${encodeURIComponent(message)}`,
    );
  }
}
