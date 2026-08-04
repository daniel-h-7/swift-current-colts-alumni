export type SiteSectionKey =
  | "memberships"
  | "sponsors"
  | "events"
  | "spotlights"
  | "fundraising_campaigns";

export type SiteSection = {
  is_enabled: boolean;
  section_key: SiteSectionKey;
  sort_order: number;
};

export const defaultSiteSections: SiteSection[] = [
  { is_enabled: true, section_key: "sponsors", sort_order: 10 },
  { is_enabled: true, section_key: "fundraising_campaigns", sort_order: 20 },
  { is_enabled: true, section_key: "spotlights", sort_order: 30 },
  { is_enabled: true, section_key: "events", sort_order: 40 },
  { is_enabled: true, section_key: "memberships", sort_order: 50 },
];

const sectionLabels: Record<SiteSectionKey, string> = {
  events: "Events",
  fundraising_campaigns: "Campaign Goals",
  memberships: "Membership",
  sponsors: "Sponsors",
  spotlights: "Alumni Spotlights",
};

export function getSectionLabel(sectionKey: SiteSectionKey) {
  return sectionLabels[sectionKey];
}
