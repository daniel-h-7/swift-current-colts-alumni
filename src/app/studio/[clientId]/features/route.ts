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
    const formData = await request.formData();
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
    const orderedKeys = submittedOrder.length
      ? submittedOrder
      : defaultSiteSections.map((section) => section.section_key);
    const sections = orderedKeys.map((sectionKey, index) => ({
      is_enabled: formData.get(`section:${sectionKey}`) === "on",
      section_key: sectionKey,
      sort_order: (index + 1) * 10,
    }));

    await saveSiteSections(clientId, sections);

    revalidatePath(`/studio/${clientId}`);
    revalidatePath(`/preview/${clientId}`);

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
