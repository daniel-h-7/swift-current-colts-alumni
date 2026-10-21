import { getMembershipSettingsForClient } from "@/lib/membership-settings";
import { legendsCopyFromForm } from "@/lib/legends-copy";
import { studioLoginPath } from "@/lib/studio-navigation";
import { updateSetupState } from "@/lib/setup-state";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createStarterSiteContent,
  getSiteContentForClient,
  saveSiteContentForClient,
  SiteContent,
  SiteEvent,
  SiteFundraisingCampaign,
  SiteSponsor,
  SiteSpotlight,
} from "@/lib/site-content";
import { createServerSupabaseClient, getServerEnvValue } from "@/lib/supabase/server";
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

function imagePosition(formData: FormData, key: string, fallback: string) {
  const value = text(formData, key);

  if (/^\d{1,3}%\s+\d{1,3}%$/.test(value)) {
    return value;
  }

  return fallback;
}

function extensionForFile(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/svg+xml") {
    return "svg";
  }

  return null;
}

function fileFromCroppedImage(formData: FormData, key: string, fileName: string) {
  const value = text(formData, key);
  const match = value.match(/^data:(image\/png);base64,([a-zA-Z0-9+/=]+)$/);

  if (!match) {
    return null;
  }

  const bytes = Buffer.from(match[2], "base64");

  return new File([bytes], fileName, { type: match[1] });
}

async function uploadImageFile({
  clientId,
  file,
  kind,
}: {
  clientId: string;
  file: File | null;
  kind: string;
}) {
  if (!file || file.size <= 0) {
    return "";
  }

  const extension = extensionForFile(file);

  if (!extension) {
    throw new Error("Upload PNG, JPG, WEBP, or SVG images only.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Images must be 5MB or smaller.");
  }

  if (!getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel Environment Variables, then redeploy before uploading images.",
    );
  }

  const supabase = createServerSupabaseClient();
  const bucket = getServerEnvValue("TEAMALUM_SITE_ASSETS_BUCKET") ?? "site-assets";
  const path = `${clientId}/${kind}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(
      `Unable to upload ${kind.replaceAll("-", " ")}. Make sure the ${bucket} Supabase Storage bucket exists and is public.`,
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

function percent(formData: FormData, key: string, fallback: number) {
  const value = Number(text(formData, key));

  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, value));
}

function moneyAmount(formData: FormData, key: string) {
  const value = text(formData, key).replace(/[$,\s]/g, "");
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return amount;
}

function formatMoneyLabel(amount: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "USD",
  }).format(amount);
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

async function sponsorWithUpload(
  formData: FormData,
  clientId: string,
  index: number,
) {
  const item = sponsor(formData, index);

  if (!item) {
    return null;
  }

  const uploadedImageUrl = await uploadImageFile({
    clientId,
    file: formData.get(`sponsor_${index}_image_file`) as File | null,
    kind: `sponsor-${index}`,
  });

  return {
    ...item,
    imageUrl: uploadedImageUrl || item.imageUrl,
  };
}

function event(formData: FormData, index: number): SiteEvent | null {
  const title = text(formData, `event_${index}_title`);

  if (!title) {
    return null;
  }

  return {
    date: text(formData, `event_${index}_date`),
    imageUrl: text(formData, `event_${index}_image_url`),
    linkLabel: text(formData, `event_${index}_link_label`) || "Details",
    linkUrl: text(formData, `event_${index}_link_url`),
    notes: text(formData, `event_${index}_notes`),
    title,
  };
}

async function eventWithUpload(
  formData: FormData,
  clientId: string,
  index: number,
) {
  const item = event(formData, index);

  if (!item) {
    return null;
  }

  const croppedEventImageFile = fileFromCroppedImage(
    formData,
    `event_${index}_image_file_cropped_data_url`,
    `cropped-event-${index}.png`,
  );
  const uploadedImageUrl = await uploadImageFile({
    clientId,
    file:
      croppedEventImageFile ||
      (formData.get(`event_${index}_image_file`) as File | null),
    kind: `event-${index}`,
  });

  return {
    ...item,
    imageUrl: uploadedImageUrl || item.imageUrl,
  };
}

function spotlight(formData: FormData, index: number): SiteSpotlight | null {
  const name = text(formData, `spotlight_${index}_name`);

  if (!name) {
    return null;
  }

  return {
    classYear: text(formData, `spotlight_${index}_class_year`),
    descriptor: text(formData, `spotlight_${index}_descriptor`),
    imageClass: "object-center",
    imageUrl:
      text(formData, `spotlight_${index}_image_url`) ||
      "/images/team-gridiron-shield.svg",
    name,
  };
}

async function spotlightWithUpload(
  formData: FormData,
  clientId: string,
  index: number,
) {
  const item = spotlight(formData, index);

  if (!item) {
    return null;
  }

  const croppedSpotlightFile = fileFromCroppedImage(
    formData,
    `spotlight_${index}_image_file_cropped_data_url`,
    `cropped-spotlight-${index}.png`,
  );
  const uploadedImageUrl = await uploadImageFile({
    clientId,
    file:
      croppedSpotlightFile ||
      (formData.get(`spotlight_${index}_image_file`) as File | null),
    kind: `spotlight-${index}`,
  });

  return {
    ...item,
    imageUrl: uploadedImageUrl || item.imageUrl,
  };
}

function campaign(formData: FormData): SiteFundraisingCampaign[] {
  const title = text(formData, "campaign_title");

  if (!title) {
    return [];
  }

  const raisedAmount = moneyAmount(formData, "campaign_raised_amount");
  const goalAmount = moneyAmount(formData, "campaign_goal_amount");
  const progressPercent =
    goalAmount > 0
      ? Math.min(100, Math.max(0, Math.round((raisedAmount / goalAmount) * 100)))
      : percent(formData, "campaign_progress_percent", 0);

  return [
    {
      buttonLabel: text(formData, "campaign_button_label") || "Support the Program",
      buttonUrl: text(formData, "campaign_button_url") || "/join",
      description: text(formData, "campaign_description"),
      eyebrow: text(formData, "campaign_eyebrow") || "Current Campaign",
      goalLabel:
        goalAmount > 0
          ? `Raised of ${formatMoneyLabel(goalAmount)}`
          : text(formData, "campaign_goal_label"),
      progressPercent,
      raisedLabel:
        raisedAmount > 0
          ? formatMoneyLabel(raisedAmount)
          : text(formData, "campaign_raised_label"),
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
        studioLoginPath(`/studio/${encodeURIComponent(clientId)}/content`, "Log in to edit your site."),
      );
    }

    const formData = await request.formData();
    const starter = createStarterSiteContent(text(formData, "site_title"));
    const siteTitle = text(formData, "site_title") || starter.brand.siteTitle;
    const heroTitle = text(formData, "hero_title") || starter.brand.heroTitle;
    const heroBody = text(formData, "hero_body") || starter.brand.heroBody;
    const croppedLogoFile = fileFromCroppedImage(
      formData,
      "logo_file_cropped_data_url",
      "cropped-logo.png",
    );
    const [
      uploadedLogoUrl,
      uploadedHeroImageUrl,
      sponsor1,
      sponsor2,
      sponsor3,
      event1,
      event2,
      spotlight1,
      spotlight2,
      spotlight3,
      spotlight4,
    ] =
      await Promise.all([
        uploadImageFile({
          clientId,
          file: croppedLogoFile || (formData.get("logo_file") as File | null),
          kind: "logo",
        }),
        uploadImageFile({
          clientId,
          file: formData.get("hero_image_file") as File | null,
          kind: "hero",
        }),
        sponsorWithUpload(formData, clientId, 1),
        sponsorWithUpload(formData, clientId, 2),
        sponsorWithUpload(formData, clientId, 3),
        eventWithUpload(formData, clientId, 1),
        eventWithUpload(formData, clientId, 2),
        spotlightWithUpload(formData, clientId, 1),
        spotlightWithUpload(formData, clientId, 2),
        spotlightWithUpload(formData, clientId, 3),
        spotlightWithUpload(formData, clientId, 4),
      ]);
    const [previousContent, previousMembership] = await Promise.all([getSiteContentForClient(clientId), getMembershipSettingsForClient(clientId)]);
    const content: SiteContent = {
      legends: legendsCopyFromForm(formData, siteTitle, previousContent.legends, clientId),
      brand: {
        accentColor: color(formData, "accent_color", starter.brand.accentColor),
        heroBody,
        heroImagePosition: imagePosition(
          formData,
          "hero_image_position",
          starter.brand.heroImagePosition,
        ),
        heroImageUrl:
          uploadedHeroImageUrl ||
          text(formData, "hero_image_url") ||
          starter.brand.heroImageUrl,
        heroKicker: text(formData, "hero_kicker") || starter.brand.heroKicker,
        heroTitle,
        logoUrl: uploadedLogoUrl || text(formData, "logo_url"),
        primaryColor: color(formData, "primary_color", starter.brand.primaryColor),
        secondaryColor: color(
          formData,
          "secondary_color",
          starter.brand.secondaryColor,
        ),
        siteTitle,
      },
      events: [...([event1, event2].filter(Boolean) as SiteEvent[]), ...previousContent.events.slice(2)],
      fundraisingCampaigns: [...campaign(formData), ...previousContent.fundraisingCampaigns.slice(1)],
      impactStats: previousContent.impactStats,
      sponsors: [...([sponsor1, sponsor2, sponsor3].filter(Boolean) as SiteSponsor[]), ...previousContent.sponsors.slice(3)],
      spotlights: [...([spotlight1, spotlight2, spotlight3, spotlight4].filter(Boolean) as SiteSpotlight[]), ...previousContent.spotlights.slice(4)],
    };

    await saveSiteContentForClient(clientId, content, {
      joinBody: text(formData, "membership_join_body") || previousMembership.join_body,
      joinHeadline: text(formData, "membership_join_headline") || previousMembership.join_headline,
      membershipYearLabel: previousMembership.membership_year_label,
    });

    await updateSetupState(clientId, { content_saved_at: new Date().toISOString(), content_reviewed_at: null, visual_reviewed_at: null, preview_reviewed_at: null });
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
