export const campaignStatuses = ["Draft", "Active", "Archived"] as const;
export const blastStatuses = ["Draft", "Scheduled", "Sent"] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];
export type BlastStatus = (typeof blastStatuses)[number];

export type Campaign = {
  id: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
};

export type Blast = {
  id: string;
  campaign_id: string;
  title: string;
  subject: string;
  preheader: string | null;
  html_content: string;
  status: BlastStatus;
  audience_filter: string | null;
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
};

export function getOpenRate(blast: Blast) {
  if (!blast.recipient_count) {
    return 0;
  }

  return Math.round((blast.open_count / blast.recipient_count) * 1000) / 10;
}

export function getClickRate(blast: Blast) {
  if (!blast.recipient_count) {
    return 0;
  }

  return Math.round((blast.click_count / blast.recipient_count) * 1000) / 10;
}
