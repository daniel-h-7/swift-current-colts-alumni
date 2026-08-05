import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createStarterSiteContent,
  saveSiteContentForClient,
  SiteContent,
  SiteEvent,
  SiteFundraisingCampaign,
  SiteSponsor,
  SiteSpotlight,
} from "@/lib/site-content";
import { canAccessStudioClient } from "@/lib/studio-auth";

type RouteParams = {
  clientId: string;
};

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function color(formData: FormData, key: string, fallback: string) {
  const value = text(formData, key);

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(value)) {
    return value;
  }

  return fallback;
}

function percent(formData: FormData, key: string, fallback: number) {
  const value = Number(text(formData, key));

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, value));
}

function sponsor(formData: FormData, index: number): SiteSponsor | null {
  const name = text(formData, `sponsor_${index}_name`);

  if (!name) {
    return null;
  }

  return {
    imageUrl: text(formData, `sponsor_${index}_image_url`),
    linkUrl: text(formData, `sponsor_${index}_link_url`),
    name,
  };
}

function event(formData: FormData, index: number): SiteEvent | null {
  const title = text(formData, `event_${index}_title`);

  if (!title) {
    return null;
  }

  return {
    date: text(formData, `event_${index}_date`),
    linkLabel: text(formData, `event_${index}_link_label`) || "Details",
    linkUrl: text(formData, `event_${index}_link_url`),
    notes: text(formData, `event_${index}_notes`),
    title,
  };
}

function spotlight(formData: FormData): SiteSpotlight[] {
  const name = text(formData, "spotlight_name");

  if (!name) {
    return [];
  }

  return [
    {
      classYear: text(formData, "spotlight_class_year"),
      descriptor: text(formData, "spotlight_descriptor"),
      imageClass: "object-center",
      imageUrl:
        text(formData, "spotlight_image_url") || "/images/team-gridiron-shield.svg",
      name,
    },
  ];
}

function campaign(formData: FormData): SiteFundraisingCampaign[] {
  const title = text(formData, "campaign_title");

  if (!title) {
    return [];
  }

  return [
    {
      buttonLabel: text(formData, "campaign_button_label") || "Support the Program",
      buttonUrl: text(formData, "campaign_button_url") || "/join",
      description: text(formData, "campaign_description"),
      eyebrow: text(formData, "campaign_eyebrow") || "Current Campaign",
      goalLabel: text(formData, "campaign_goal_label"),
      progressPercent: percent(formData, "campaign_progress_percent", 0),
      raisedLabel: text(formData, "campaign_raised_label"),
      title,
    },
  ];
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
        "/studio/login?error=Log%20in%20to%20edit%20your%20site.",
      );
    }

    const formData = await request.formData();
    const starter = createStarterSiteContent(text(formData, "site_title"));
    const siteTitle = text(formData, "site_title") || starter.brand.siteTitle;
    const heroTitle = text(formData, "hero_title") || starter.brand.heroTitle;
    const heroBody = text(formData, "hero_body") || starter.brand.heroBody;
    const content: SiteContent = {
      brand: {
        accentColor: color(formData, "accent_color", starter.brand.accentColor),
        heroBody,
        heroImageUrl: text(formData, "hero_image_url") || starter.brand.heroImageUrl,
        heroKicker: text(formData, "hero_kicker") || starter.brand.heroKicker,
        heroTitle,
        logoUrl: text(formData, "logo_url"),
        primaryColor: color(formData, "primary_color", starter.brand.primaryColor),
        secondaryColor: color(
          formData,
          "secondary_color",
          starter.brand.secondaryColor,
        ),
        siteTitle,
      },
      events: [event(formData, 1), event(formData, 2)].filter(
        Boolean,
      ) as SiteEvent[],
      fundraisingCampaigns: campaign(formData),
      impactStats: [],
      sponsors: [sponsor(formData, 1), sponsor(formData, 2), sponsor(formData, 3)].filter(
        Boolean,
      ) as SiteSponsor[],
      spotlights: spotlight(formData),
    };

    await saveSiteContentForClient(clientId, content, {
      joinBody: heroBody,
      joinHeadline: heroTitle,
      membershipYearLabel: `${siteTitle} Alumni and Booster Club`,
    });

    revalidatePath(`/studio/${clientId}`);
    revalidatePath(`/studio/${clientId}/content`);
    revalidatePath(`/preview/${clientId}`);

    return redirectTo(
      request,
      `/studio/${encodeURIComponent(clientId)}/content?saved=content`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save site content.";

    return redirectTo(
      request,
      `/studio/${encodeURIComponent(clientId)}/content?error=${encodeURIComponent(message)}`,
    );
  }
}
