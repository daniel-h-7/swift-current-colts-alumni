import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Blast, serializeAudienceFilter } from "@/lib/campaign-options";
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

export default async function EditBlastPage({
  params,
}: {
  params: Promise<BlastParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { blastId, id } = await params;
  const blast = await getBlast(blastId);

  if (!blast) {
    notFound();
  }

  const audiencePreview = await getAudiencePreview(blast.audience_filter).catch(
    (error: unknown) => ({
      contacts: [],
      count: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unable to preview this audience.",
    }),
  );

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
