import "server-only";

import { logContactActivity } from "@/lib/contact-activity";
import { getCurrentClientId } from "@/lib/client-context";
import { Contact } from "@/lib/contact-options";
import { formatFromEmail, getEmailSettings } from "@/lib/email-settings";
import { sendCampaignTestEmail } from "@/lib/email-provider";
import { getSiteBrand } from "@/lib/site-brand";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createUnsubscribeUrl } from "@/lib/unsubscribe";

const campaignTitle = "New Signups";
const blastTitle = "Thank You for Your Support";

function getDefaultBlastCopy() {
  const brand = getSiteBrand();

  return {
    html: `
<h2 style="margin:0 0 14px;font-size:26px;line-height:1.2;font-weight:900;color:#0f172a;">Thank you for your support!</h2>
<p style="margin:0 0 16px;">Thank you for supporting ${brand.programName}.</p>
<p style="margin:0 0 16px;">${brand.joinSubtext}</p>
<p style="margin:0;">${brand.successProgramLine}</p>
`.trim(),
    preheader: `Your support helps ${brand.programName} student-athletes on and off the field.`,
    subject: `Thank you for supporting ${brand.programName}`,
  };
}

type AutomationContext = {
  contactId: string;
  source: "admin" | "mock" | "stripe";
};

async function getContact(contactId: string) {
  const supabase = createServerSupabaseClient();
  const clientId = getCurrentClientId();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, phone, email_opt_in, sms_opt_in, graduation_year, relationship_type, sport, notes, created_at",
    )
    .eq("client_id", clientId)
    .eq("id", contactId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Pick<
    Contact,
    | "created_at"
    | "email"
    | "email_opt_in"
    | "first_name"
    | "graduation_year"
    | "id"
    | "last_name"
    | "notes"
    | "phone"
    | "relationship_type"
    | "sms_opt_in"
    | "sport"
  > | null;
}

async function getOrCreateCampaign() {
  const supabase = createServerSupabaseClient();
  const clientId = getCurrentClientId();
  const { data: existing, error: existingError } = await supabase
    .from("campaigns")
    .select("id")
    .eq("client_id", clientId)
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
      client_id: clientId,
      description:
        "Automatic thank-you message sent when a new supporter completes signup.",
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
  const defaultCopy = getDefaultBlastCopy();
  const supabase = createServerSupabaseClient();
  const clientId = getCurrentClientId();
  const { data: existing, error: existingError } = await supabase
    .from("campaign_blasts")
    .select("id, subject, preheader, html_content")
    .eq("client_id", clientId)
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
      audience_filter: JSON.stringify({ email_opt_in: true }),
      campaign_id: campaignId,
      client_id: clientId,
      html_content: defaultCopy.html,
      preheader: defaultCopy.preheader,
      status: "Draft",
      subject: defaultCopy.subject,
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

export async function ensureNewSignupAutomationCampaign() {
  const campaignId = await getOrCreateCampaign();
  const blast = await getOrCreateBlast(campaignId);

  return {
    blastId: blast.id,
    campaignId,
  };
}

async function hasAlreadySent(blastId: string, contactId: string, eventType: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_blast_events")
    .select("id")
    .eq("client_id", getCurrentClientId())
    .eq("blast_id", blastId)
    .eq("event_type", eventType)
    .contains("metadata", { contact_id: contactId })
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
  const clientId = getCurrentClientId();
  const { error } = await supabase.from("campaign_blast_events").insert({
    blast_id: blastId,
    client_id: clientId,
    email: email ?? null,
    event_type: eventType,
    metadata: {
      ...metadata,
      client_id: clientId,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function runNewSignupAutomation({
  contactId,
  source,
}: AutomationContext) {
  const contact = await getContact(contactId);

  if (!contact) {
    return;
  }

  const { campaignId, blastId } = await ensureNewSignupAutomationCampaign();
  const blast = await getOrCreateBlast(campaignId);

  if (contact.email_opt_in && contact.email) {
    const eventType = "new_signup_email_sent";

    if (!(await hasAlreadySent(blastId, contact.id, eventType))) {
      const emailSettings = await getEmailSettings();

      try {
        const result = await sendCampaignTestEmail({
          from: formatFromEmail(emailSettings),
          html: blast.html_content,
          preheader: blast.preheader,
          replyTo: emailSettings.email_reply_to,
          subject: blast.subject,
          to: contact.email,
          unsubscribeUrl: createUnsubscribeUrl(contact.id),
        });

        await recordBlastEvent({
          blastId,
          email: contact.email,
          eventType,
          metadata: {
            contact_id: contact.id,
            mode: result.mode,
            provider: result.provider,
            provider_id: result.providerId,
            source,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to send the new signup welcome email.";

        await recordBlastEvent({
          blastId,
          email: contact.email,
          eventType: "new_signup_email_failed",
          metadata: {
            contact_id: contact.id,
            message,
            source,
          },
        }).catch(() => undefined);

        await logContactActivity({
          body: message,
          contactId: contact.id,
          metadata: {
            blast_id: blastId,
            campaign_id: campaignId,
            email: contact.email,
            source,
          },
          title: "Welcome email failed",
          type: "new_signup_email_failed",
        }).catch(() => undefined);
      }
    }
  }

  if (contact.sms_opt_in) {
    const eventType = "new_signup_sms_pending";

    if (!(await hasAlreadySent(blastId, contact.id, eventType))) {
      await recordBlastEvent({
        blastId,
        email: contact.email,
        eventType,
        metadata: {
          contact_id: contact.id,
          phone: contact.phone,
          reason: "SMS provider is not connected yet.",
          source,
        },
      });
    }
  }

  await logContactActivity({
    body: "New signup automation processed.",
    contactId: contact.id,
    metadata: {
      blast_id: blastId,
      campaign_id: campaignId,
      email_opt_in: contact.email_opt_in,
      sms_opt_in: contact.sms_opt_in,
      source,
    },
    title: "New signup thank-you automation",
    type: "new_signup_automation_processed",
  }).catch(() => undefined);
}
