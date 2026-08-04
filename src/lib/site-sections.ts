import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  defaultSiteSections,
  SiteSection,
  SiteSectionKey,
} from "@/lib/site-sections-shared";
export {
  defaultSiteSections,
  getSectionLabel,
} from "@/lib/site-sections-shared";
export type { SiteSection, SiteSectionKey } from "@/lib/site-sections-shared";

function isMissingSiteSections(message: string) {
  return (
    message.includes("schema cache") ||
    message.includes("Could not find") ||
    message.includes("site_sections")
  );
}

function mergeSiteSections(sections: SiteSection[]) {
  const byKey = new Map<SiteSectionKey, SiteSection>(
    defaultSiteSections.map((section) => [section.section_key, section]),
  );

  sections.forEach((section) => {
    byKey.set(section.section_key, section);
  });

  return Array.from(byKey.values()).sort(
    (left, right) => left.sort_order - right.sort_order,
  );
}

export async function getSiteSections(clientId: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("site_sections")
      .select("section_key, is_enabled, sort_order")
      .eq("client_id", clientId)
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return defaultSiteSections;
    }

    return mergeSiteSections(data as SiteSection[]);
  } catch {
    return defaultSiteSections;
  }
}

export async function saveSiteSections(
  clientId: string,
  sections: SiteSection[],
) {
  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();
  const rows = sections.map((section) => ({
    client_id: clientId,
    is_enabled: section.is_enabled,
    section_key: section.section_key,
    sort_order: section.sort_order,
    updated_at: now,
  }));
  const { error } = await supabase.from("site_sections").upsert(rows, {
    onConflict: "client_id,section_key",
  });

  if (error && !isMissingSiteSections(error.message)) {
    throw new Error(error.message);
  }
}
