import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Blast } from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
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
      audience_filter: String(formData.get("audience_filter") ?? "").trim() || null,
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

  return (
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
    />
  );
}
