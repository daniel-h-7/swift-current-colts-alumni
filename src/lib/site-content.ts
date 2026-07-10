import "server-only";

import { getSiteBrand } from "@/lib/site-brand";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SiteSpotlight = {
  classYear: string;
  descriptor: string;
  imageClass: string;
  imageUrl: string;
  name: string;
};

export type SiteEvent = {
  date: string;
  linkLabel: string;
  linkUrl: string;
  notes: string;
  title: string;
};

export type SiteSponsor = {
  imageUrl: string;
  linkUrl: string;
  name: string;
};

export type SiteContent = {
  events: SiteEvent[];
  sponsors: SiteSponsor[];
  spotlights: SiteSpotlight[];
};

const coltsDefaultSiteContent: SiteContent = {
  events: [
    {
      date: "June 21, 2026",
      linkLabel: "",
      linkUrl: "",
      notes: "",
      title: "Alumni Golf Classic",
    },
    {
      date: "September 18, 2026",
      linkLabel: "",
      linkUrl: "",
      notes: "",
      title: "Friday Night Homecoming",
    },
    {
      date: "November 7, 2026",
      linkLabel: "",
      linkUrl: "",
      notes: "",
      title: "Hall of Fame Banquet",
    },
  ],
  sponsors: [
    { imageUrl: "", linkUrl: "", name: "Pioneer Co-op" },
    { imageUrl: "", linkUrl: "", name: "Innovation Credit Union" },
    { imageUrl: "", linkUrl: "", name: "Great Plains College" },
    { imageUrl: "", linkUrl: "", name: "Swift Current Broncos" },
    { imageUrl: "", linkUrl: "", name: "S3 Group" },
    { imageUrl: "", linkUrl: "", name: "Southwest Terminal" },
    { imageUrl: "", linkUrl: "", name: "Standard Motors" },
    { imageUrl: "", linkUrl: "", name: "RBC Swift Current" },
  ],
  spotlights: [
    {
      classYear: "Class of '21",
      descriptor: "University of Saskatchewan Huskies",
      imageClass: "object-[center_28%]",
      imageUrl: "/images/rhett-vavra.webp",
      name: "Rhett Vavra",
    },
    {
      classYear: "",
      descriptor: "University of Alberta Golden Bears",
      imageClass: "origin-[23%_23%] object-[23%_23%] scale-[2.75]",
      imageUrl: "/images/gerry-inglis.webp",
      name: "Gerry Inglis",
    },
  ],
};

const demoDefaultSiteContent: SiteContent = {
  events: [
    {
      date: "August 28, 2026",
      linkLabel: "Preview",
      linkUrl: "",
      notes: "Kick off the season with alumni, sponsors, and supporters under the lights.",
      title: "Yeti Kickoff Night",
    },
    {
      date: "September 19, 2026",
      linkLabel: "Preview",
      linkUrl: "",
      notes: "A demo event built for ticket links, registration pages, or external event details.",
      title: "Legends Homecoming",
    },
    {
      date: "November 14, 2026",
      linkLabel: "Preview",
      linkUrl: "",
      notes: "Recognize legacy players, volunteers, sponsors, and the people behind the program.",
      title: "Northwest Legacy Banquet",
    },
    {
      date: "January 16, 2027",
      linkLabel: "Preview",
      linkUrl: "",
      notes: "A clean offseason touchpoint for fundraising, alumni updates, and campaign follow-up.",
      title: "Booster Club Social",
    },
  ],
  sponsors: [
    { imageUrl: "", linkUrl: "", name: "Summit Bank" },
    { imageUrl: "", linkUrl: "", name: "North Ridge Auto" },
    { imageUrl: "", linkUrl: "", name: "Peak Performance Rehab" },
    { imageUrl: "", linkUrl: "", name: "Cascade Equipment" },
    { imageUrl: "", linkUrl: "", name: "Frostline Energy" },
    { imageUrl: "", linkUrl: "", name: "Evergreen Dental" },
    { imageUrl: "", linkUrl: "", name: "Booster Club" },
    { imageUrl: "", linkUrl: "", name: "Hometown Insurance" },
  ],
  spotlights: [
    {
      classYear: "Class of '14",
      descriptor: "Alumni captain and campaign ambassador",
      imageClass: "object-center",
      imageUrl: "/images/team-gridiron-elway.svg",
      name: "Mason Vale",
    },
    {
      classYear: "Class of '03",
      descriptor: "Program supporter and annual fund champion",
      imageClass: "object-center",
      imageUrl: "/images/team-gridiron-manning.svg",
      name: "Parker Snow",
    },
  ],
};

export function getDefaultSiteContent() {
  return getSiteBrand().isDemo ? demoDefaultSiteContent : coltsDefaultSiteContent;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSpotlight(value: unknown): SiteSpotlight | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<SiteSpotlight>;
  const name = cleanText(item.name);

  if (!name) {
    return null;
  }

  return {
    classYear: cleanText(item.classYear),
    descriptor: cleanText(item.descriptor),
    imageClass: cleanText(item.imageClass) || "object-center",
    imageUrl: cleanText(item.imageUrl) || "/images/stadium.jpg",
    name,
  };
}

function normalizeEvent(value: unknown): SiteEvent | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<SiteEvent>;
  const title = cleanText(item.title);

  if (!title) {
    return null;
  }

  return {
    date: cleanText(item.date),
    linkLabel: cleanText(item.linkLabel),
    linkUrl: cleanText(item.linkUrl),
    notes: cleanText(item.notes),
    title,
  };
}

function normalizeSponsor(value: unknown): SiteSponsor | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<SiteSponsor>;

  return {
    imageUrl: cleanText(item.imageUrl),
    linkUrl: cleanText(item.linkUrl),
    name: cleanText(item.name),
  };
}

export function normalizeSiteContent(value: unknown): SiteContent {
  const defaultSiteContent = getDefaultSiteContent();

  if (!value || typeof value !== "object") {
    return defaultSiteContent;
  }

  const content = value as Partial<SiteContent>;
  const spotlights = Array.isArray(content.spotlights)
    ? content.spotlights.map(normalizeSpotlight).filter(Boolean)
    : [];
  const events = Array.isArray(content.events)
    ? content.events.map(normalizeEvent).filter(Boolean)
    : [];
  const sponsors = Array.isArray(content.sponsors)
    ? content.sponsors.map(normalizeSponsor).filter(Boolean)
    : [];

  return {
    events: events.length ? (events as SiteEvent[]) : defaultSiteContent.events,
    sponsors: sponsors.length
      ? (sponsors as SiteSponsor[])
      : defaultSiteContent.sponsors,
    spotlights: spotlights.length
      ? (spotlights as SiteSpotlight[])
      : defaultSiteContent.spotlights,
  };
}

export async function getSiteContent() {
  const brand = getSiteBrand();
  const defaultSiteContent = getDefaultSiteContent();

  if (
    brand.isDemo &&
    process.env.DEMO_USE_DATABASE_SITE_CONTENT?.toLowerCase() !== "true"
  ) {
    return defaultSiteContent;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("crm_settings")
      .select("site_content")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return defaultSiteContent;
    }

    return normalizeSiteContent(data.site_content);
  } catch {
    return defaultSiteContent;
  }
}
