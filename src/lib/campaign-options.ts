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

export type BlastEvent = {
  id: string;
  blast_id: string;
  event_type: string;
  email: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type BlastAudienceFilter = {
  email_opt_in?: boolean;
  graduation_year?: string;
  membership_status?: string;
  paid_status?: string;
  relationship_type?: string;
  sms_opt_in?: boolean;
  sport?: string;
  status?: string;
  tag?: string;
};

export function getDefaultAudienceFilter(): BlastAudienceFilter {
  return {
    email_opt_in: true,
  };
}

export function parseAudienceFilter(value: string | null | undefined) {
  if (!value) {
    return getDefaultAudienceFilter();
  }

  if (value === "email_opt_in") {
    return { email_opt_in: true };
  }

  if (value === "active_members") {
    return { email_opt_in: true, membership_status: "Active Member" };
  }

  if (value === "pending_payment") {
    return { email_opt_in: true, membership_status: "Pending Payment" };
  }

  try {
    return {
      ...getDefaultAudienceFilter(),
      ...(JSON.parse(value) as BlastAudienceFilter),
    };
  } catch {
    return getDefaultAudienceFilter();
  }
}

export function serializeAudienceFilter(formData: FormData) {
  const emailOptIn = String(formData.get("audience_email_opt_in") ?? "");
  const smsOptIn = String(formData.get("audience_sms_opt_in") ?? "");
  const filter: BlastAudienceFilter = {};

  if (emailOptIn) {
    filter.email_opt_in = emailOptIn === "true";
  }

  if (smsOptIn) {
    filter.sms_opt_in = smsOptIn === "true";
  }

  const stringFilterKeys: Array<
    Exclude<keyof BlastAudienceFilter, "email_opt_in" | "sms_opt_in">
  > = [
    "graduation_year",
    "relationship_type",
    "sport",
    "status",
    "membership_status",
    "paid_status",
    "tag",
  ];

  stringFilterKeys.forEach((key) => {
    const value = String(formData.get(`audience_${key}`) ?? "").trim();

    if (value) {
      filter[key] = value;
    }
  });

  return JSON.stringify(filter);
}

export function summarizeAudienceFilter(value: string | null | undefined) {
  const filter = parseAudienceFilter(value);
  const parts = [];

  if (filter.email_opt_in !== undefined) {
    parts.push(filter.email_opt_in ? "Email opt-ins" : "Email opt-outs");
  }

  if (filter.sms_opt_in !== undefined) {
    parts.push(filter.sms_opt_in ? "SMS opt-ins" : "SMS opt-outs");
  }

  if (filter.graduation_year) {
    parts.push(`Class ${filter.graduation_year}`);
  }

  if (filter.relationship_type) {
    parts.push(filter.relationship_type);
  }

  if (filter.sport) {
    parts.push(filter.sport);
  }

  if (filter.status) {
    parts.push(`Status: ${filter.status}`);
  }

  if (filter.membership_status) {
    parts.push(`Membership: ${filter.membership_status}`);
  }

  if (filter.paid_status) {
    parts.push(`Paid: ${filter.paid_status}`);
  }

  if (filter.tag) {
    parts.push(`Tag: ${filter.tag}`);
  }

  return parts.length ? parts.join(", ") : "All CRM contacts";
}

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
