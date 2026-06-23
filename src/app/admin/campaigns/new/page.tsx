import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

async function createCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link className="font-bold text-blue-300" href="/admin/campaigns">
          Back to campaigns
        </Link>
        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            New Campaign
          </p>
          <h1 className="mt-3 text-4xl font-black">Create a campaign</h1>
          <form action={createCampaign} className="mt-8 space-y-5">
            <label className="block text-sm font-bold text-gray-200">
              Campaign title
              <input
                className={fieldClass}
                name="title"
                placeholder="Spring 2026 Member Drive"
                required
              />
            </label>
            <label className="block text-sm font-bold text-gray-200">
              Description
              <textarea
                className={`${fieldClass} min-h-32 resize-y`}
                name="description"
                placeholder="Internal notes about this communication push."
              />
            </label>
            <button
              className="w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
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
