import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Campaign,
  CampaignStatus,
  campaignStatuses,
} from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type EditCampaignParams = {
  id: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

async function getCampaign(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Campaign | null;
}

async function updateCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const status = String(formData.get("status") ?? "Draft") as CampaignStatus;
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("campaigns")
    .update({
      description: String(formData.get("description") ?? "").trim() || null,
      status: campaignStatuses.includes(status) ? status : "Draft",
      title: String(formData.get("title") ?? "").trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
  redirect(`/admin/campaigns/${campaignId}`);
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<EditCampaignParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const campaign = await getCampaign(id);

  if (!campaign) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link className="font-bold text-blue-300" href={`/admin/campaigns/${id}`}>
          Back to campaign
        </Link>
        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            Edit Campaign
          </p>
          <h1 className="mt-3 text-4xl font-black">Campaign Settings</h1>
          <form action={updateCampaign} className="mt-8 space-y-5">
            <input name="campaign_id" type="hidden" value={campaign.id} />
            <label className="block text-sm font-bold text-gray-200">
              Campaign title
              <input
                className={fieldClass}
                defaultValue={campaign.title}
                name="title"
                placeholder="Spring 2026 Member Drive"
                required
              />
            </label>
            <label className="block text-sm font-bold text-gray-200">
              Description
              <textarea
                className={`${fieldClass} min-h-32 resize-y`}
                defaultValue={campaign.description ?? ""}
                name="description"
                placeholder="Internal notes about this communication push."
              />
            </label>
            <label className="block text-sm font-bold text-gray-200">
              Status
              <select
                className={fieldClass}
                defaultValue={campaign.status}
                name="status"
              >
                {campaignStatuses.map((status) => (
                  <option className="bg-zinc-950" key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
              type="submit"
            >
              Save Campaign
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
