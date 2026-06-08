import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BlastEditorForm } from "@/components/blast-editor-form";

type NewBlastParams = {
  id: string;
};

async function createBlast(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_blasts")
    .insert({
      audience_filter: String(formData.get("audience_filter") ?? "").trim() || null,
      campaign_id: campaignId,
      html_content: String(formData.get("html_content") ?? "").trim(),
      preheader: String(formData.get("preheader") ?? "").trim() || null,
      status: "Draft",
      subject: String(formData.get("subject") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}/blasts/${data.id}`);
}

export default async function NewBlastPage({
  params,
}: {
  params: Promise<NewBlastParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;

  return (
    <BlastEditorForm
      action={createBlast}
      backHref={`/admin/campaigns/${id}`}
      campaignId={id}
      defaultHtml="<h2>Colts update</h2><p>Write your email blast here.</p>"
      heading="New Blast"
      submitLabel="Create Blast"
    />
  );
}
