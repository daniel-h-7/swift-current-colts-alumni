import "server-only";

import { logContactActivity } from "@/lib/contact-activity";
import { Contact } from "@/lib/contact-options";
import { formatOptionalDate } from "@/lib/contact-format";
import { formatFromEmail, getEmailSettings } from "@/lib/email-settings";
import { sendCampaignTestEmail } from "@/lib/email-provider";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createUnsubscribeUrl } from "@/lib/unsubscribe";

const campaignTitle = "Membership Renewal Reminders";
const blastTitle = "Annual Membership Renewal Reminder";
const defaultSubject = "Your Colts Football membership renews soon";
const defaultPreheader =
  "Your annual Colts Football support is scheduled to renew in about one month.";
const defaultHtml = `
<h2 style="margin:0 0 14px;font-size:26px;line-height:1.2;font-weight:900;color:#0f172a;">Your annual membership renews soon</h2>
<p style="margin:0 0 16px;">Thank you for continuing to support Swift Current Colts Football.</p>
<p style="margin:0 0 16px;">Your annual membership is scheduled to renew in about one month using the payment method on file with Stripe.</p>
<p style="margin:0;">Your support helps provide our student-athletes with the tools they need to succeed on and off the football field.</p>
`.trim();

type RenewalReminderContact = Pick<
  Contact,
  | "email"
  | "email_opt_in"
  | "first_name"
  | "id"
  | "last_name"
  | "membership_status"
  | "paid_through"
>;

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getTargetRenewalDate(daysBefore: number) {
  return toDateString(addDays(new Date(), daysBefore));
}

async function getOrCreateCampaign() {
  const supabase = createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("title", campaignTitle)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      description:
        "Automatic reminder sent one month before annual Stripe membership renewal.",
      status: "Active",
      title: campaignTitle,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

async function getOrCreateBlast(campaignId: string) {
  const supabase = createServerSupabaseClient();
  const { data: existing, error: existingError } = await supabase
    .from("campaign_blasts")
    .select("id, subject, preheader, html_content")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return existing as {
      html_content: string;
      id: string;
      preheader: string | null;
      subject: string;
    };
  }

  const { data, error } = await supabase
    .from("campaign_blasts")
    .insert({
      audience_filter: JSON.stringify({
        email_opt_in: true,
        membership_status: "Active Member",
      }),
      campaign_id: campaignId,
      html_content: defaultHtml,
      preheader: defaultPreheader,
      status: "Draft",
      subject: defaultSubject,
      title: blastTitle,
    })
    .select("id, subject, preheader, html_content")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    html_content: string;
    id: string;
    preheader: string | null;
    subject: string;
  };
}

export async function ensureRenewalReminderCampaign() {
  const campaignId = await getOrCreateCampaign();
  const blast = await getOrCreateBlast(campaignId);

  return {
    blastId: blast.id,
    campaignId,
  };
}

async function getContactsForRenewalDate(renewalDate: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, email_opt_in, membership_status, paid_through",
    )
    .eq("membership_status", "Active Member")
    .eq("email_opt_in", true)
    .eq("paid_through", renewalDate);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RenewalReminderContact[];
}

async function hasAlreadySent({
  blastId,
  contactId,
  renewalDate,
}: {
  blastId: string;
  contactId: string;
  renewalDate: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_blast_events")
    .select("id")
    .eq("blast_id", blastId)
    .eq("event_type", "renewal_reminder_email_sent")
    .contains("metadata", {
      contact_id: contactId,
      renewal_date: renewalDate,
    })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
}

async function recordBlastEvent({
  blastId,
  email,
  eventType,
  metadata,
}: {
  blastId: string;
  email?: string | null;
  eventType: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("campaign_blast_events").insert({
    blast_id: blastId,
    email: email ?? null,
    event_type: eventType,
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function runRenewalReminderAutomation({
  daysBefore = 30,
}: {
  daysBefore?: number;
} = {}) {
  const renewalDate = getTargetRenewalDate(daysBefore);
  const { campaignId, blastId } = await ensureRenewalReminderCampaign();
  const [blast, contacts] = await Promise.all([
    getOrCreateBlast(campaignId),
    getContactsForRenewalDate(renewalDate),
  ]);
  const emailSettings = await getEmailSettings();
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const contact of contacts) {
    if (
      await hasAlreadySent({
        blastId,
        contactId: contact.id,
        renewalDate,
      })
    ) {
      skippedCount += 1;
      continue;
    }

    try {
      const result = await sendCampaignTestEmail({
        from: formatFromEmail(emailSettings),
        html: `${blast.html_content}<p style="margin:18px 0 0;color:#374151;"><strong>Renewal date:</strong> ${formatOptionalDate(contact.paid_through)}</p>`,
        preheader: blast.preheader,
        replyTo: emailSettings.email_reply_to,
        subject: blast.subject,
        to: contact.email,
        unsubscribeUrl: createUnsubscribeUrl(contact.id),
      });

      await recordBlastEvent({
        blastId,
        email: contact.email,
        eventType: "renewal_reminder_email_sent",
        metadata: {
          contact_id: contact.id,
          mode: result.mode,
          provider: result.provider,
          provider_id: result.providerId,
          renewal_date: renewalDate,
          source: "cron",
        },
      });

      await logContactActivity({
        body: `Renewal reminder sent for ${formatOptionalDate(renewalDate)}.`,
        contactId: contact.id,
        metadata: {
          blast_id: blastId,
          campaign_id: campaignId,
          renewal_date: renewalDate,
          source: "cron",
        },
        title: "Renewal reminder sent",
        type: "renewal_reminder_email_sent",
      }).catch(() => undefined);

      sentCount += 1;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to send renewal reminder email.";

      await recordBlastEvent({
        blastId,
        email: contact.email,
        eventType: "renewal_reminder_email_failed",
        metadata: {
          contact_id: contact.id,
          message,
          renewal_date: renewalDate,
          source: "cron",
        },
      }).catch(() => undefined);

      await logContactActivity({
        body: message,
        contactId: contact.id,
        metadata: {
          blast_id: blastId,
          campaign_id: campaignId,
          renewal_date: renewalDate,
          source: "cron",
        },
        title: "Renewal reminder failed",
        type: "renewal_reminder_email_failed",
      }).catch(() => undefined);

      failedCount += 1;
    }
  }

  return {
    failedCount,
    renewalDate,
    sentCount,
    skippedCount,
    totalEligible: contacts.length,
  };
}
