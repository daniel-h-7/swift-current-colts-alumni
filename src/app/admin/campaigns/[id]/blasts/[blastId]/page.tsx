import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Blast,
  BlastEvent,
  serializeAudienceFilter,
  summarizeAudienceFilter,
} from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAudiencePreview } from "@/lib/campaign-audience";
import { formatContactName } from "@/lib/contact-format";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  const { error } = await supabase.from("campaign_blast_events").insert({
    blast_id: blastId,
    email,
    event_type: "test_send_requested",
    metadata: {
      mode: "mock",
      note: "No email provider connected yet.",
    },
  });

  if (error) {
    redirect(
      `/admin/campaigns/${campaignId}/blasts/${blastId}?test_error=${encodeURIComponent(
        error.message,
      )}`,
    );
  }

  revalidatePath(`/admin/campaigns/${campaignId}/blasts/${blastId}`);
  redirect(`/admin/campaigns/${campaignId}/blasts/${blastId}?test_sent=1`);
}

export default async function EditBlastPage({
  params,
  searchParams,
}: {
  params: Promise<BlastParams>;
  searchParams: Promise<{ test_error?: string; test_sent?: string }>;
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

  const [audiencePreview, blastEvents] = await Promise.all([
    getAudiencePreview(blast.audience_filter).catch((error: unknown) => ({
      contacts: [],
      count: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unable to preview this audience.",
    })),
    getBlastEvents(blast.id).catch(() => [] as BlastEvent[]),
  ]);

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
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black">Send Test</h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                This records a safe test-send request. No email is sent until a
                provider is connected.
              </p>
            </div>
            <p className="text-sm font-bold text-gray-400">
              {summarizeAudienceFilter(blast.audience_filter)}
            </p>
          </div>

          {query.test_sent === "1" ? (
            <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
              Test send request recorded.
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
              className="rounded-full bg-blue-700 px-6 py-3 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
              type="submit"
            >
              Send Test
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {blastEvents.map((event) => (
              <div
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm"
                key={event.id}
              >
                <p className="font-black text-white">{event.event_type}</p>
                <p className="mt-1 text-gray-400">
                  {event.email || "-"} · {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
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
