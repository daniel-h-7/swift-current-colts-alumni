import { adminPath } from "@/lib/team-admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { serializeAudienceFilter } from "@/lib/campaign-options";
import { getWorkspaceClientId } from "@/lib/team-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BlastEditorForm } from "@/components/blast-editor-form";
import { getAdminBrand } from "@/lib/team-admin";

type NewBlastParams = {
  id: string;
};

async function createBlast(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const supabase = createServerSupabaseClient();
  const clientId = (await getWorkspaceClientId());
  const { data, error } = await supabase
    .from("campaign_blasts")
    .insert({
      audience_filter: serializeAudienceFilter(formData),
      campaign_id: campaignId,
      client_id: clientId,
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

  revalidatePath(await adminPath(`/admin/campaigns/${campaignId}`));
  redirect(await adminPath(`/admin/campaigns/${campaignId}/blasts/${data.id}`));
}

export default async function NewBlastPage({
  params,
}: {
  params: Promise<NewBlastParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const { id } = await params;
  const brand = (await getAdminBrand());

  return (
    <BlastEditorForm
      action={createBlast}
      backHref={`/admin/campaigns/${id}`}
      campaignId={id}
      defaultHtml={`<h2>${brand.programName} update</h2><p>Write your email blast here.</p>`}
      heading="New Blast"
      submitLabel="Create Blast"
    />
  );
}
