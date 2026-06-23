import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Blast,
  BlastEvent,
  BlastStatus,
  serializeAudienceFilter,
  summarizeAudienceFilter,
} from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { duplicateBlast } from "@/lib/campaign-duplication";
import {
  getAudienceContacts,
  getAudiencePreview,
  getEmailAudiencePreview,
} from "@/lib/campaign-audience";
import { formatContactName } from "@/lib/contact-format";
import { formatFromEmail, getEmailSettings } from "@/lib/email-settings";
import { getEmailProviderMode, sendCampaignTestEmail } from "@/lib/email-provider";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createUnsubscribeUrl } from "@/lib/unsubscribe";
import { BlastEditorForm } from "@/components/blast-editor-form";

type BlastParams = {
  blastId: string;
  id: string;
};

async function getBlast(blastId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_blasts")
    .select("*")
    .eq("id", blastId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Blast | null;
}

async function getBlastEvents(blastId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_blast_events")
    .select("*")
    .eq("blast_id", blastId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BlastEvent[];
}

async function updateBlast(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const blastId = String(formData.get("blast_id") ?? "");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("campaign_blasts")
    .update({
      audience_filter: serializeAudienceFilter(formData),
      html_content: String(formData.get("html_content") ?? "").trim(),
      preheader: String(formData.get("preheader") ?? "").trim() || null,
      subject: String(formData.get("subject") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", blastId);

  if (error) {
    throw error;
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}`);
}

async function recordTestSend(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const blastId = String(formData.get("blast_id") ?? "");
  const email = String(formData.get("test_email") ?? "").trim().toLowerCase();
  const supabase = createServerSupabaseClient();
  const emailProviderMode = getEmailProviderMode();
  const { data: blast, error: blastError } = await supabase
    .from("campaign_blasts")
    .select("html_content, preheader, subject")
    .eq("id", blastId)
    .maybeSingle();

  if (blastError || !blast) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?test_error=${encodeURIComponent(
        blastError?.message ?? "Unable to load this blast before sending.",
      )}`,
    );
  }

  let testError: string | null = null;
  const emailSettings = await getEmailSettings();

  const result = await sendCampaignTestEmail({
    from: formatFromEmail(emailSettings),
    html: blast.html_content,
    preheader: blast.preheader,
    replyTo: emailSettings.email_reply_to,
    subject: blast.subject,
    to: email,
  }).catch((error: unknown) => {
    testError =
      error instanceof Error
        ? error.message
        : "Unable to send this test email.";
    return null;
  });

  if (result) {
    const { error } = await supabase.from("campaign_blast_events").insert({
      blast_id: blastId,
      email,
      event_type: "test_send_sent",
      metadata: {
        provider: result.provider,
        provider_id: result.providerId,
        delivered_to: result.deliveredTo,
        reply_to: emailSettings.email_reply_to || null,
        mode: result.mode,
        sender: formatFromEmail(emailSettings),
      },
    });

    if (error) {
      testError = error.message;
    }
  }

  if (testError) {
    const message = testError;

    await supabase.from("campaign_blast_events").insert({
      blast_id: blastId,
      email,
      event_type: "test_send_failed",
      metadata: {
        message,
        mode: emailProviderMode,
        provider: emailProviderMode === "smtp-demo" ? "smtp" : "resend",
        reply_to: emailSettings.email_reply_to || null,
        sender: formatFromEmail(emailSettings),
      },
    });

    revalidatePath(`/admin/campaigns/${campaignId}/blasts/${blastId}`);
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?test_error=${encodeURIComponent(
        message,
      )}`,
    );
  }

  revalidatePath(`/admin/campaigns/${campaignId}/blasts/${blastId}`);
  redirect(`/admin/campaigns/${campaignId}/blasts/${blastId}?test_sent=1`);
}

async function sendBlast(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const blastId = String(formData.get("blast_id") ?? "");
  const supabase = createServerSupabaseClient();
  const { data: blast, error: blastError } = await supabase
    .from("campaign_blasts")
    .select("audience_filter, html_content, preheader, status, subject")
    .eq("id", blastId)
    .maybeSingle();

  if (blastError || !blast) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?send_error=${encodeURIComponent(
        blastError?.message ?? "Unable to load this blast before sending.",
      )}`,
    );
  }

  if (blast.status === "Sent") {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?send_error=${encodeURIComponent(
        "This blast has already been sent.",
      )}`,
    );
  }

  let contacts = [];

  try {
    contacts = await getAudienceContacts(blast.audience_filter);
  } catch (error) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?send_error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to load the audience.",
      )}`,
    );
  }

  if (!contacts.length) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?send_error=${encodeURIComponent(
        "This saved audience has no email opt-in recipients.",
      )}`,
    );
  }

  const emailSettings = await getEmailSettings();
  const sender = formatFromEmail(emailSettings);
  const emailProviderMode = getEmailProviderMode();
  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    const result = await sendCampaignTestEmail({
      from: sender,
      html: blast.html_content,
      preheader: blast.preheader,
      replyTo: emailSettings.email_reply_to,
      subject: blast.subject,
      to: contact.email,
      unsubscribeUrl: createUnsubscribeUrl(contact.id),
    }).catch((error: unknown) => {
      failedCount += 1;
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send this blast email.",
      };
    });

    if ("error" in result) {
      await supabase.from("campaign_blast_events").insert({
        blast_id: blastId,
        email: contact.email,
        event_type: "blast_send_failed",
        metadata: {
          contact_id: contact.id,
          message: result.error,
          mode: emailProviderMode,
          provider: emailProviderMode === "smtp-demo" ? "smtp" : "resend",
          sender,
        },
      });
      continue;
    }

    sentCount += 1;
    await supabase.from("campaign_blast_events").insert({
      blast_id: blastId,
      email: contact.email,
      event_type: "blast_send_sent",
      metadata: {
        contact_id: contact.id,
        delivered_to: result.deliveredTo,
        mode: result.mode,
        provider: result.provider,
        provider_id: result.providerId,
        reply_to: emailSettings.email_reply_to || null,
        sender,
      },
    });
  }

  if (!sentCount) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?send_error=${encodeURIComponent(
        `No emails were sent. ${failedCount} failed.`,
      )}`,
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("campaign_blasts")
    .update({
      recipient_count: sentCount,
      sent_at: now,
      status: "Sent" satisfies BlastStatus,
      updated_at: now,
    })
    .eq("id", blastId);

  if (updateError) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?send_error=${encodeURIComponent(
        updateError.message,
      )}`,
    );
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/campaigns/${campaignId}/blasts/${blastId}`);
  redirect(
    `/admin/campaigns/${campaignId}/blasts/${blastId}?send_sent=${sentCount}&send_failed=${failedCount}`,
  );
}

async function duplicateBlastAction(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const blastId = String(formData.get("blast_id") ?? "");
  const { campaignId, blastId: newBlastId } = await duplicateBlast(blastId);

  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}/blasts/${newBlastId}`);
}

function getEventProviderDetail(event: BlastEvent) {
  const metadata = event.metadata ?? {};
  const mode = typeof metadata.mode === "string" ? metadata.mode : null;
  const provider = typeof metadata.provider === "string" ? metadata.provider : null;
  const deliveredTo =
    typeof metadata.delivered_to === "string" && metadata.delivered_to !== event.email
      ? metadata.delivered_to
      : null;
  const parts = [mode, provider].filter(Boolean);

  if (deliveredTo) {
    parts.push(`delivered to ${deliveredTo}`);
  }

  return parts.length ? parts.join(" · ") : null;
}

export default async function EditBlastPage({
  params,
  searchParams,
}: {
  params: Promise<BlastParams>;
  searchParams: Promise<{
    send_error?: string;
    send_failed?: string;
    send_sent?: string;
    test_error?: string;
    test_sent?: string;
  }>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { blastId, id } = await params;
  const query = await searchParams;
  const blast = await getBlast(blastId);

  if (!blast) {
    notFound();
  }

  const [audiencePreview, emailAudiencePreview, blastEvents] = await Promise.all([
    getAudiencePreview(blast.audience_filter).catch((error: unknown) => ({
      contacts: [],
      count: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unable to preview this audience.",
    })),
    getEmailAudiencePreview(blast.audience_filter).catch(() => ({
      count: 0,
      filter: { email_opt_in: true },
    })),
    getBlastEvents(blast.id).catch(() => [] as BlastEvent[]),
  ]);
  const emailProviderMode = getEmailProviderMode();
  const sendSentCount = Number.parseInt(query.send_sent ?? "0", 10) || 0;
  const sendFailedCount = Number.parseInt(query.send_failed ?? "0", 10) || 0;
  const isSent = blast.status === "Sent";

  return (
    <>
      <BlastEditorForm
        action={updateBlast}
        backHref={`/admin/campaigns/${id}`}
        blastId={blast.id}
        campaignId={id}
        defaultAudience={blast.audience_filter ?? ""}
        defaultHtml={blast.html_content}
        defaultPreheader={blast.preheader ?? ""}
        defaultSubject={blast.subject}
        defaultTitle={blast.title}
        heading="Edit Blast"
        submitLabel="Save Blast"
      >
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Reuse This Blast</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Create a fresh draft copy with the same content and audience.
              </p>
            </div>
            <form action={duplicateBlastAction}>
              <input name="blast_id" type="hidden" value={blast.id} />
              <button
                className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm font-black uppercase tracking-[2px] text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/35 hover:text-white"
                type="submit"
              >
                Duplicate Blast
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black">Send Blast</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Sends the saved blast to email opt-ins in the saved audience.
                Save changes before sending.
              </p>
            </div>
            <p className="text-sm font-bold text-gray-400">
              {summarizeAudienceFilter(blast.audience_filter)}
            </p>
          </div>

          {sendSentCount > 0 ? (
            <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
              Sent to {sendSentCount} recipient{sendSentCount === 1 ? "" : "s"}
              {sendFailedCount
                ? `; ${sendFailedCount} failed and were recorded.`
                : "."}
            </div>
          ) : null}

          {query.send_error ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              {query.send_error}
            </div>
          ) : null}

          {isSent ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm font-bold text-gray-300">
              This blast has already been sent.
            </div>
          ) : (
            <form action={sendBlast} className="mt-5">
              <input name="campaign_id" type="hidden" value={id} />
              <input name="blast_id" type="hidden" value={blast.id} />
              <button
                className="w-full rounded-md bg-red-600 px-6 py-4 font-black uppercase tracking-[3px] text-white shadow-[0_12px_34px_rgba(220,38,38,0.22)] transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!emailAudiencePreview.count}
                type="submit"
              >
                Send Blast to {emailAudiencePreview.count} Email Recipient
                {emailAudiencePreview.count === 1 ? "" : "s"}
              </button>
            </form>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black">Send Test</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                {emailProviderMode === "smtp-demo"
                  ? "Sends a demo-tagged test email through the configured SMTP server."
                  : "Sends a real test email through Resend when the provider variables are configured."}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-400">
              {summarizeAudienceFilter(blast.audience_filter)}
            </p>
          </div>

          {query.test_sent === "1" ? (
            <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
              Test email sent and recorded
              {emailProviderMode === "smtp-demo" ? " in SMTP demo mode." : "."}
            </div>
          ) : null}

          {query.test_error ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              {query.test_error}
            </div>
          ) : null}

          <form action={recordTestSend} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input name="campaign_id" type="hidden" value={id} />
            <input name="blast_id" type="hidden" value={blast.id} />
            <input
              className="w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              name="test_email"
              placeholder="you@example.com"
              required
              type="email"
            />
            <button
              className="rounded-md bg-blue-700 px-6 py-3 font-black uppercase tracking-[3px] text-white shadow-[0_10px_30px_rgba(29,78,216,0.22)] transition hover:bg-blue-600"
              type="submit"
            >
              Send Test
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {blastEvents.map((event) => {
              const providerDetail = getEventProviderDetail(event);

              return (
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm"
                  key={event.id}
                >
                  <p className="font-black text-white">{event.event_type}</p>
                  <p className="mt-1 text-gray-400">
                    {event.email || "-"} · {new Date(event.created_at).toLocaleString()}
                  </p>
                  {providerDetail ? (
                    <p className="mt-1 text-gray-500">{providerDetail}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black">Audience Preview</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Preview is based on the last saved audience filters.
              </p>
            </div>
            <p className="text-3xl font-black text-blue-300">
              {audiencePreview.count} recipients
            </p>
          </div>

          {"error" in audiencePreview && audiencePreview.error ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              {audiencePreview.error}
            </div>
          ) : null}

          {!audiencePreview.count && !("error" in audiencePreview) ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              This audience is empty. Adjust the send categories before sending.
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-black/40 text-gray-300">
                <tr>
                  {["Name", "Email", "Year", "Relationship", "Sport"].map(
                    (heading) => (
                      <th className="px-4 py-3 font-black uppercase tracking-[2px]" key={heading}>
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {audiencePreview.contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-white">
                      {formatContactName(contact)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                      {contact.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                      {contact.graduation_year || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                      {contact.relationship_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                      {contact.sport}
                    </td>
                  </tr>
                ))}
                {!audiencePreview.contacts.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                      No preview recipients.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </BlastEditorForm>
    </>
  );
}
