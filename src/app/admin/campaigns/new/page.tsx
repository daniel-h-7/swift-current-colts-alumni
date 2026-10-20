import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getCurrentClientId } from "@/lib/client-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#e9e1d1] bg-white px-4 py-3 text-[#17130d] outline-none transition focus:border-[#a18442] focus:ring-2 focus:ring-[#c5a45b]/30";

async function createCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      client_id: getCurrentClientId(),
      description: String(formData.get("description") ?? "").trim() || null,
      status: "Draft",
      title: String(formData.get("title") ?? "").trim(),
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  redirect(`/admin/campaigns/${data.id}`);
}

export default async function NewCampaignPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-white text-[#17130d]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link className="font-bold text-[#785d25]" href="/admin/campaigns">
          Back to campaigns
        </Link>
        <section className="mt-6 rounded-3xl border border-[#e9e1d1] bg-white p-6 shadow-[0_16px_60px_rgba(23,19,13,0.06)]">
          <p className="text-sm uppercase tracking-[5px] text-[#785d25]">
            New Campaign
          </p>
          <h1 className="mt-3 text-4xl font-black">Create a campaign</h1>
          <form action={createCampaign} className="mt-8 space-y-5">
            <label className="block text-sm font-bold text-slate-700">
              Campaign title
              <input
                className={fieldClass}
                name="title"
                placeholder="Spring 2026 Member Drive"
                required
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Description
              <textarea
                className={`${fieldClass} min-h-32 resize-y`}
                name="description"
                placeholder="Internal notes about this communication push."
              />
            </label>
            <button
              className="w-full rounded-full bg-[#17130d] px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-[#362b19]"
              type="submit"
            >
              Create Campaign
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
