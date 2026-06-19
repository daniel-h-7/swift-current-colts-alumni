import Link from "next/link";
import { redirect } from "next/navigation";
import { Campaign } from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatDate } from "@/lib/contact-format";
import { ensureNewSignupAutomationCampaign } from "@/lib/new-signup-automation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Campaign[];
}

export default async function CampaignsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  let campaigns: Campaign[] = [];
  let errorMessage = "";

  try {
    await ensureNewSignupAutomationCampaign();
    campaigns = await getCampaigns();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load campaigns.";
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              Communications
            </p>
            <h1 className="mt-3 text-4xl font-black">Campaigns</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/admin"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-600"
              href="/admin/campaigns/new"
            >
              New Campaign
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {errorMessage ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl hover:border-blue-500/60"
              href={`/admin/campaigns/${campaign.id}`}
              key={campaign.id}
            >
              <p className="text-xs font-black uppercase tracking-[3px] text-red-400">
                {campaign.status}
              </p>
              <h2 className="mt-3 text-2xl font-black">{campaign.title}</h2>
              <p className="mt-3 min-h-12 text-sm leading-6 text-gray-400">
                {campaign.description || "No description yet."}
              </p>
              <p className="mt-6 text-xs font-bold uppercase tracking-[2px] text-gray-500">
                Updated {formatDate(campaign.updated_at)}
              </p>
            </Link>
          ))}

          {!campaigns.length && !errorMessage ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-gray-400">
              No campaigns yet.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
