import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Blast, Campaign, getClickRate, getOpenRate } from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatDate } from "@/lib/contact-format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CampaignParams = {
  id: string;
};

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

async function getBlasts(campaignId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaign_blasts")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Blast[];
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<CampaignParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [campaign, blasts] = await Promise.all([getCampaign(id), getBlasts(id)]);

  if (!campaign) {
    notFound();
  }

  const sentBlasts = blasts.filter((blast) => blast.status === "Sent");
  const recipients = blasts.reduce((total, blast) => total + blast.recipient_count, 0);
  const opens = blasts.reduce((total, blast) => total + blast.open_count, 0);
  const clicks = blasts.reduce((total, blast) => total + blast.click_count, 0);
  const openRate = recipients ? Math.round((opens / recipients) * 1000) / 10 : 0;
  const clickRate = recipients ? Math.round((clicks / recipients) * 1000) / 10 : 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              Campaign
            </p>
            <h1 className="mt-3 text-4xl font-black">{campaign.title}</h1>
            <p className="mt-3 max-w-2xl text-gray-400">
              {campaign.description || "No description yet."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/admin/campaigns"
            >
              Campaigns
            </Link>
            <Link
              className="rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-600"
              href={`/admin/campaigns/${campaign.id}/blasts/new`}
            >
              New Blast
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["Blasts", blasts.length],
            ["Sent", sentBlasts.length],
            ["Recipients", recipients],
            ["Open Rate", `${openRate}%`],
            ["Click Rate", `${clickRate}%`],
          ].map(([label, value]) => (
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl" key={label}>
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                {label}
              </p>
              <p className="mt-3 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-950 via-zinc-950 to-red-950 text-white">
                <tr>
                  {["Blast", "Status", "Recipients", "Open", "Click", "Updated", ""].map((heading) => (
                    <th className="whitespace-nowrap px-4 py-4 font-black uppercase tracking-[3px]" key={heading}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {blasts.map((blast) => (
                  <tr className="hover:bg-white/[0.04]" key={blast.id}>
                    <td className="px-4 py-4">
                      <p className="font-black text-white">{blast.title}</p>
                      <p className="mt-1 text-gray-400">{blast.subject}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">{blast.status}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">{blast.recipient_count}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">{getOpenRate(blast)}%</td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">{getClickRate(blast)}%</td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">{formatDate(blast.updated_at)}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <Link className="font-black text-blue-400 hover:text-blue-300" href={`/admin/campaigns/${campaign.id}/blasts/${blast.id}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {!blasts.length ? (
                  <tr>
                    <td className="px-4 py-12 text-center font-bold text-gray-400" colSpan={7}>
                      No blasts yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
