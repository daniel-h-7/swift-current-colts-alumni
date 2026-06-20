import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function copyTitle(title: string) {
  return `${title} Copy`;
}

export async function duplicateCampaignWithBlasts(campaignId: string) {
  const supabase = createServerSupabaseClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("description, title")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const now = new Date().toISOString();
  const { data: newCampaign, error: newCampaignError } = await supabase
    .from("campaigns")
    .insert({
      description: campaign.description,
      status: "Draft",
      title: copyTitle(campaign.title),
      updated_at: now,
    })
    .select("id")
    .single();

  if (newCampaignError) {
    throw new Error(newCampaignError.message);
  }

  const { data: blasts, error: blastsError } = await supabase
    .from("campaign_blasts")
    .select("audience_filter, html_content, preheader, subject, title")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (blastsError) {
    throw new Error(blastsError.message);
  }

  if (blasts?.length) {
    const { error: insertBlastsError } = await supabase
      .from("campaign_blasts")
      .insert(
        blasts.map((blast) => ({
          audience_filter: blast.audience_filter,
          campaign_id: newCampaign.id,
          click_count: 0,
          html_content: blast.html_content,
          open_count: 0,
          preheader: blast.preheader,
          recipient_count: 0,
          sent_at: null,
          status: "Draft",
          subject: blast.subject,
          title: copyTitle(blast.title),
          updated_at: now,
        })),
      );

    if (insertBlastsError) {
      throw new Error(insertBlastsError.message);
    }
  }

  return newCampaign.id as string;
}

export async function duplicateBlast(blastId: string) {
  const supabase = createServerSupabaseClient();
  const { data: blast, error: blastError } = await supabase
    .from("campaign_blasts")
    .select(
      "audience_filter, campaign_id, html_content, preheader, subject, title",
    )
    .eq("id", blastId)
    .maybeSingle();

  if (blastError) {
    throw new Error(blastError.message);
  }

  if (!blast) {
    throw new Error("Blast not found.");
  }

  const now = new Date().toISOString();
  const { data: newBlast, error: newBlastError } = await supabase
    .from("campaign_blasts")
    .insert({
      audience_filter: blast.audience_filter,
      campaign_id: blast.campaign_id,
      click_count: 0,
      html_content: blast.html_content,
      open_count: 0,
      preheader: blast.preheader,
      recipient_count: 0,
      sent_at: null,
      status: "Draft",
      subject: blast.subject,
      title: copyTitle(blast.title),
      updated_at: now,
    })
    .select("campaign_id, id")
    .single();

  if (newBlastError) {
    throw new Error(newBlastError.message);
  }

  return {
    campaignId: newBlast.campaign_id as string,
    blastId: newBlast.id as string,
  };
}
