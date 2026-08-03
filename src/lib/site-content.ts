import "server-only";

import { getCurrentClientId } from "@/lib/client-context";
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

export type SiteImpactStat = {
  label: string;
  value: string;
};

export type SiteFundraisingCampaign = {
  buttonLabel: string;
  buttonUrl: string;
  description: string;
  eyebrow: string;
  goalLabel: string;
  progressPercent: number;
  raisedLabel: string;
  title: string;
};

export type SiteContent = {
  events: SiteEvent[];
  fundraisingCampaigns: SiteFundraisingCampaign[];
  impactStats: SiteImpactStat[];
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
  fundraisingCampaigns: [],
  impactStats: [],
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
  fundraisingCampaigns: [
    {
      buttonLabel: "Support the Project",
      buttonUrl: "/join",
      description:
        "Showcase a live fundraising goal, connect every gift to the CRM, and give supporters a clear reason to act.",
      eyebrow: "Campaign Example",
      goalLabel: "Raised of $125,000",
      progressPercent: 63,
      raisedLabel: "$78,450",
      title: "New Team Rooms",
    },
  ],
  impactStats: [
    { label: "Student Athletes", value: "146" },
    { label: "Honour Roll Students", value: "111" },
    { label: "Provincial Championships", value: "16" },
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

const ramsDefaultSiteContent: SiteContent = {
  events: [
    {
      date: "September 12, 2026",
      linkLabel: "",
      linkUrl: "",
      notes: "Bring alumni, families, and boosters together for the first Rams home feature night.",
      title: "Rams Alumni Night",
    },
    {
      date: "October 3, 2026",
      linkLabel: "",
      linkUrl: "",
      notes: "A community game-day event built around sponsors, families, and future Rams.",
      title: "Mountain Homecoming",
    },
    {
      date: "November 21, 2026",
      linkLabel: "",
      linkUrl: "",
      notes: "Celebrate the people supporting Rams Football on and off the field.",
      title: "Rams Legacy Banquet",
    },
  ],
  fundraisingCampaigns: [
    {
      buttonLabel: "Support the Project",
      buttonUrl: "/join",
      description:
        "Help build a stronger home base for Rams athletes with updated team room space, storage, and player development resources.",
      eyebrow: "Current Campaign",
      goalLabel: "Raised of $100,000",
      progressPercent: 41,
      raisedLabel: "$41,200",
      title: "New Team Rooms",
    },
  ],
  impactStats: [
    { label: "Student Athletes", value: "132" },
    { label: "Honour Roll Students", value: "96" },
    { label: "League Championships", value: "12" },
  ],
  sponsors: [
    { imageUrl: "", linkUrl: "https://www.eaglehomes.ca/", name: "Eagle Homes" },
    { imageUrl: "", linkUrl: "https://exacttax.com/", name: "Exact Tax Kimberley" },
    { imageUrl: "", linkUrl: "https://www.cranbrookflooring.com/", name: "Cranbrook Flooring" },
  ],
  spotlights: [
    {
      classYear: "Class of '16",
      descriptor: "Alumni captain and Rams supporter",
      imageClass: "object-center",
      imageUrl: "/images/team-gridiron-elway.svg",
      name: "Cole Mercer",
    },
    {
      classYear: "Class of '08",
      descriptor: "Program mentor and annual fund champion",
      imageClass: "object-center",
      imageUrl: "/images/team-gridiron-manning.svg",
      name: "Evan Ridge",
    },
  ],
};

const bfBadgersDefaultSiteContent: SiteContent = {
  events: [
    {
      date: "August 28, 2026",
      linkLabel: "Details",
      linkUrl: "",
      notes: "Bring alumni, families, and sponsors together for a football Friday in Bonners Ferry.",
      title: "Badger Kickoff Night",
    },
    {
      date: "September 25, 2026",
      linkLabel: "Details",
      linkUrl: "",
      notes: "A homecoming-style gathering built around football, school pride, and alumni connection.",
      title: "Badger Alumni Homecoming",
    },
    {
      date: "November 13, 2026",
      linkLabel: "Details",
      linkUrl: "",
      notes: "Celebrate players, volunteers, sponsors, and the people helping the program move forward.",
      title: "BF Football Legacy Night",
    },
    {
      date: "January 22, 2027",
      linkLabel: "Details",
      linkUrl: "",
      notes: "An offseason supporter event for campaign updates, future goals, and community momentum.",
      title: "Badger Booster Social",
    },
  ],
  fundraisingCampaigns: [
    {
      buttonLabel: "Support the Project",
      buttonUrl: "/join",
      description:
        "Help create a stronger football experience with updated player development resources, equipment support, and game-day needs.",
      eyebrow: "Current Campaign",
      goalLabel: "Raised of $85,000",
      progressPercent: 54,
      raisedLabel: "$45,900",
      title: "Badger Football Fund",
    },
  ],
  impactStats: [
    { label: "Student Athletes", value: "118" },
    { label: "Alumni Network", value: "420+" },
    { label: "Community Partners", value: "28" },
  ],
  sponsors: [
    { imageUrl: "", linkUrl: "", name: "Boundary County Partners" },
    { imageUrl: "", linkUrl: "", name: "Badger Booster Club" },
    { imageUrl: "", linkUrl: "", name: "Main Street Auto" },
    { imageUrl: "", linkUrl: "", name: "Mountain West Bank" },
    { imageUrl: "", linkUrl: "", name: "North Idaho Rehab" },
    { imageUrl: "", linkUrl: "", name: "Game Day Grill" },
    { imageUrl: "", linkUrl: "", name: "Panhandle Builders" },
    { imageUrl: "", linkUrl: "", name: "Blue Line Electric" },
  ],
  spotlights: [
    {
      classYear: "Class of '15",
      descriptor: "Alumni captain and Badger football supporter",
      imageClass: "object-center",
      imageUrl: "/images/team-gridiron-elway.svg",
      name: "Tyler Morgan",
    },
    {
      classYear: "Class of '07",
      descriptor: "Program mentor and annual fund champion",
      imageClass: "object-center",
      imageUrl: "/images/team-gridiron-manning.svg",
      name: "Caleb Brooks",
    },
  ],
};

export function getDefaultSiteContent() {
  const brand = getSiteBrand();

  if (brand.variant === "demo") {
    return demoDefaultSiteContent;
  }

  if (brand.variant === "rmrfootball") {
    return ramsDefaultSiteContent;
  }

  if (brand.variant === "bfbadgers") {
    return bfBadgersDefaultSiteContent;
  }

  return coltsDefaultSiteContent;
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

function normalizeImpactStat(value: unknown): SiteImpactStat | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<SiteImpactStat>;
  const label = cleanText(item.label);
  const statValue = cleanText(item.value);

  if (!label && !statValue) {
    return null;
  }

  return {
    label,
    value: statValue,
  };
}

function normalizeFundraisingCampaign(value: unknown): SiteFundraisingCampaign | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<SiteFundraisingCampaign>;
  const title = cleanText(item.title);

  if (!title) {
    return null;
  }

  const progressPercent =
    typeof item.progressPercent === "number"
      ? item.progressPercent
      : Number(item.progressPercent ?? 0);

  return {
    buttonLabel: cleanText(item.buttonLabel) || "Support the Project",
    buttonUrl: cleanText(item.buttonUrl) || "/join",
    description: cleanText(item.description),
    eyebrow: cleanText(item.eyebrow) || "Campaign Example",
    goalLabel: cleanText(item.goalLabel),
    progressPercent: Math.min(100, Math.max(0, Number.isFinite(progressPercent) ? progressPercent : 0)),
    raisedLabel: cleanText(item.raisedLabel),
    title,
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
  const impactStats = Array.isArray(content.impactStats)
    ? content.impactStats.map(normalizeImpactStat).filter(Boolean)
    : [];
  const fundraisingCampaigns = Array.isArray(content.fundraisingCampaigns)
    ? content.fundraisingCampaigns.map(normalizeFundraisingCampaign).filter(Boolean)
    : [];

  return {
    events: events.length ? (events as SiteEvent[]) : defaultSiteContent.events,
    fundraisingCampaigns: fundraisingCampaigns.length
      ? (fundraisingCampaigns as SiteFundraisingCampaign[])
      : defaultSiteContent.fundraisingCampaigns,
    impactStats: impactStats.length
      ? (impactStats as SiteImpactStat[])
      : defaultSiteContent.impactStats,
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
      .eq("client_id", getCurrentClientId())
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
