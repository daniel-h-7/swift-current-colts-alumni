import type { SiteContent, SiteEvent } from "@/lib/site-content";
import type { SiteSection, SiteSectionKey } from "@/lib/site-sections-shared";

export function legendsIdentity(name: string) {
  const words =
    name
      .replace(
        /\b(football|basketball|baseball|hockey|soccer|volleyball|athletics|alumni|and|boosters?|club|&|the)\b/gi,
        " ",
      )
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  const initials = (words.length ? words : ["Team"])
    .slice(0, 3)
    .map((word) => Array.from(word)[0])
    .join("")
    .toUpperCase();
  return {
    initials,
    watermark: initials.slice(-1),
    photoWord: words[0]?.toUpperCase() || "TOGETHER",
  };
}

export function safeLegendsLink(value: string) {
  const link = value.trim();
  if (!link || /[\\\u0000-\u001f]/.test(link)) return null;
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// Stored dates are free text. Only hide events with an unambiguous, complete
// English calendar date or ISO date; keep seasonal/undated announcements.
export function legendsEventDate(event: SiteEvent) {
  const value = event.date.trim();
  if (!/^(?:\d{4}-\d{2}-\d{2}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})$/.test(value))
    return null;
  const timestamp = Date.parse(
    /^\d{4}-/.test(value) ? `${value}T12:00:00Z` : `${value} 12:00:00 GMT`,
  );
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

export function legendsPresentation(
  content: SiteContent,
  features: { feature_key: string; is_enabled: boolean }[],
  sections: SiteSection[],
  now = new Date(),
) {
  const enabled = (key: SiteSectionKey) =>
    sections.find((s) => s.section_key === key)?.is_enabled !== false &&
    (key === "fundraising_campaigns"
      ? features.find((f) => f.feature_key === key)?.is_enabled === true
      : features.find((f) => f.feature_key === key)?.is_enabled !== false);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const sponsors = content.sponsors.filter(
    (s) =>
      s.name.trim() &&
      !(
        ["Founding Sponsor", "Community Partner"].includes(s.name) &&
        !s.imageUrl &&
        !s.linkUrl
      ),
  );
  const spotlights = content.spotlights.filter(
    (s) =>
      s.name.trim() &&
      !(
        s.name === "Alumni Spotlight" &&
        s.descriptor === "Program supporter and community champion" &&
        s.imageUrl === "/images/team-gridiron-shield.svg"
      ),
  );
  const campaigns = content.fundraisingCampaigns.filter(
    (c) =>
      c.title.trim() &&
      !(
        c.title === "Program Support Fund" &&
        c.description ===
          "Give supporters a clear campaign to rally around and track progress as momentum grows." &&
        c.raisedLabel === "$6,250" &&
        c.goalLabel === "Raised of $25,000" &&
        c.progressPercent === 25
      ),
  );
  const events = content.events.filter((e) => {
    if (!e.title.trim()) return false;
    if (
      e.title === "Alumni Homecoming" &&
      e.date === "September 18, 2026" &&
      e.notes ===
        "Bring alumni, families, and supporters together for a game-day gathering." &&
      !e.linkUrl &&
      !e.imageUrl
    )
      return false;
    const date = legendsEventDate(e);
    return !date || date.getTime() >= today;
  });
  return {
    memberships: enabled("memberships"),
    sponsors: enabled("sponsors") ? sponsors : [],
    spotlights: enabled("spotlights") ? spotlights : [],
    campaigns: enabled("fundraising_campaigns") ? campaigns : [],
    events: enabled("events") ? events : [],
  };
}

export function legendsColors(primary: string, accent: string) {
  const valid = (color: string, fallback: string) => {
    if (/^#[a-f\d]{6}$/i.test(color)) return color;
    const rgb = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.exec(
      color,
    );
    if (!rgb || rgb.slice(1).some((v) => Number(v) > 255)) return fallback;
    return (
      "#" +
      rgb
        .slice(1)
        .map((v) => Number(v).toString(16).padStart(2, "0"))
        .join("")
    );
  };
  const brand = valid(primary, "#785d25");
  const luminance = (hex: string) => {
    const channels = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const lightText = luminance(brand) < 0.179;
  return {
    brand,
    accent: valid(accent, "#c5a45b"),
    onBrand: lightText ? "#ffffff" : "#171917",
    ink: luminance(brand) < 0.183 ? brand : "#363b35",
  };
}
