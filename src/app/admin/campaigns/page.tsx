import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Campaign } from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { duplicateCampaignWithBlasts } from "@/lib/campaign-duplication";
import { formatDate } from "@/lib/contact-format";
import { ensureNewSignupAutomationCampaign } from "@/lib/new-signup-automation";
import { ensureRenewalReminderCampaign } from "@/lib/renewal-reminder-automation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

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

async function duplicateCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const newCampaignId = await duplicateCampaignWithBlasts(campaignId);

  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${newCampaignId}`);
}

async function deleteCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/campaigns");
  redirect("/admin/campaigns");
}

export default async function CampaignsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  let campaigns: Campaign[] = [];
  let errorMessage = "";

  try {
    await ensureNewSignupAutomationCampaign();
    await ensureRenewalReminderCampaign();
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
              className="rounded-md border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/30 hover:text-white"
              href="/admin"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(29,78,216,0.28)] transition hover:bg-blue-600"
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
            <div
              className="relative overflow-visible rounded-xl border border-white/10 bg-zinc-950 p-6 pr-16 shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition hover:border-blue-500/60 hover:bg-zinc-900/80"
              key={campaign.id}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-zinc-800 to-red-600" />
              <details className="group absolute right-3 top-3">
                <summary
                  aria-label="Campaign actions"
                  className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-white/10 bg-black/45 text-gray-300 transition hover:border-blue-500/70 hover:bg-blue-950/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&::-webkit-details-marker]:hidden"
                >
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 7.25h.01M12 12h.01M12 16.75h.01"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                  </svg>
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-zinc-950/98 p-1.5 shadow-[0_22px_80px_rgba(0,0,0,0.65)] ring-1 ring-black/60">
                  <Link
                    className="block rounded-md px-3 py-2.5 text-sm font-bold text-gray-200 transition hover:bg-blue-950/50 hover:text-white"
                    href={`/admin/campaigns/${campaign.id}/edit`}
                  >
                    Edit Campaign
                  </Link>
                  <form action={duplicateCampaign}>
                    <input name="campaign_id" type="hidden" value={campaign.id} />
                    <button
                      className="w-full rounded-md px-3 py-2.5 text-left text-sm font-bold text-gray-200 transition hover:bg-blue-950/50 hover:text-white"
                      type="submit"
                    >
                      Duplicate Campaign
                    </button>
                  </form>
                  <form action={deleteCampaign}>
                    <input name="campaign_id" type="hidden" value={campaign.id} />
                    <ConfirmSubmitButton
                      className="w-full rounded-md px-3 py-2.5 text-left text-sm font-bold text-red-300 transition hover:bg-red-950/55 hover:text-red-100"
                      message={`Delete campaign "${campaign.title}" and all of its blasts?`}
                    >
                      Delete Campaign
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </details>
              <Link href={`/admin/campaigns/${campaign.id}`}>
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
            </div>
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
