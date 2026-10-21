import { adminPath } from "@/lib/team-admin";

import { AdminForm } from "@/components/admin-navigation";
import { AdminLink as Link } from "@/components/admin-navigation";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Blast,
  Campaign,
  getClickRate,
  getOpenRate,
  summarizeAudienceFilter,
} from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { duplicateBlast } from "@/lib/campaign-duplication";
import { getWorkspaceClientId } from "@/lib/team-admin";
import { formatDate } from "@/lib/contact-format";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { LocalDateTime } from "@/components/local-date-time";

export const dynamic = "force-dynamic";

type CampaignParams = {
  id: string;
};

type CampaignDetailSearchParams = {
  sort_by?: string;
  sort_dir?: string;
};

const blastSortColumns = [
  { key: "title", label: "Blast" },
  { key: "status", label: "Status" },
  { key: "recipient_count", label: "Recipients" },
  { key: "open_count", label: "Open" },
  { key: "click_count", label: "Click" },
  { key: "created_at", label: "Created" },
  { key: "sent_at", label: "Last Sent" },
  { key: "updated_at", label: "Last Edited" },
] as const;

type BlastSortKey = (typeof blastSortColumns)[number]["key"];
type SortDirection = "asc" | "desc";

function getBlastSort(filters: CampaignDetailSearchParams): {
  sortBy: BlastSortKey;
  sortDir: SortDirection;
} {
  const allowedKeys = blastSortColumns.map((column) => column.key);
  const sortBy = allowedKeys.includes(filters.sort_by as BlastSortKey)
    ? (filters.sort_by as BlastSortKey)
    : "updated_at";
  const sortDir = filters.sort_dir === "asc" ? "asc" : "desc";

  return { sortBy, sortDir };
}

function compareOptionalDates(first: string | null, second: string | null) {
  if (!first && !second) {
    return 0;
  }

  if (!first) {
    return 1;
  }

  if (!second) {
    return -1;
  }

  return new Date(first).getTime() - new Date(second).getTime();
}

function sortBlasts(blasts: Blast[], filters: CampaignDetailSearchParams) {
  const { sortBy, sortDir } = getBlastSort(filters);
  const direction = sortDir === "asc" ? 1 : -1;

  return [...blasts].sort((first, second) => {
    if (sortBy === "created_at" || sortBy === "sent_at" || sortBy === "updated_at") {
      const firstValue = first[sortBy];
      const secondValue = second[sortBy];

      if (!firstValue || !secondValue) {
        return compareOptionalDates(firstValue, secondValue);
      }

      return compareOptionalDates(firstValue, secondValue) * direction;
    }

    if (
      sortBy === "recipient_count" ||
      sortBy === "open_count" ||
      sortBy === "click_count"
    ) {
      return (first[sortBy] - second[sortBy]) * direction;
    }

    return String(first[sortBy] ?? "").localeCompare(String(second[sortBy] ?? "")) * direction;
  });
}

function getBlastSortHref(
  campaignId: string,
  filters: CampaignDetailSearchParams,
  sortBy: BlastSortKey,
) {
  const currentSort = getBlastSort(filters);
  const params = new URLSearchParams();

  params.set("sort_by", sortBy);
  params.set(
    "sort_dir",
    currentSort.sortBy === sortBy && currentSort.sortDir === "asc"
      ? "desc"
      : "asc",
  );

  return `/admin/campaigns/${campaignId}?${params.toString()}`;
}

function BlastSortHeader({
  campaignId,
  filters,
  label,
  sortBy,
}: {
  campaignId: string;
  filters: CampaignDetailSearchParams;
  label: string;
  sortBy: BlastSortKey;
}) {
  const currentSort = getBlastSort(filters);
  const isActive = currentSort.sortBy === sortBy;

  return (
    <th className="whitespace-nowrap px-4 py-4 font-black uppercase tracking-[3px]">
      <Link
        className="inline-flex items-center gap-2 text-[#17130d] hover:text-[#785d25]"
        href={getBlastSortHref(campaignId, filters, sortBy)}
      >
        {label}
        <span className={isActive ? "text-[#785d25]" : "text-slate-400"}>
          {isActive && currentSort.sortDir === "asc" ? "^" : "v"}
        </span>
      </Link>
    </th>
  );
}

async function getCampaign(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", (await getWorkspaceClientId()))
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
    .eq("client_id", (await getWorkspaceClientId()))
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Blast[];
}

async function duplicateBlastAction(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const blastId = String(formData.get("blast_id") ?? "");
  const { campaignId, blastId: newBlastId } = await duplicateBlast(blastId);

  revalidatePath(await adminPath(`/admin/campaigns/${campaignId}`));
  redirect(await adminPath(`/admin/campaigns/${campaignId}/blasts/${newBlastId}`));
}

async function deleteBlastAction(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const blastId = String(formData.get("blast_id") ?? "");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("campaign_blasts")
    .delete()
    .eq("client_id", (await getWorkspaceClientId()))
    .eq("id", blastId)
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(await adminPath(`/admin/campaigns/${campaignId}`));
  redirect(await adminPath(`/admin/campaigns/${campaignId}`));
}

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<CampaignParams>;
  searchParams: Promise<CampaignDetailSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const [{ id }, filters] = await Promise.all([params, searchParams]);
  const [campaign, unsortedBlasts] = await Promise.all([getCampaign(id), getBlasts(id)]);

  if (!campaign) {
    notFound();
  }

  const blasts = sortBlasts(unsortedBlasts, filters);
  const sentBlasts = blasts.filter((blast) => blast.status === "Sent");
  const recipients = blasts.reduce((total, blast) => total + blast.recipient_count, 0);
  const opens = blasts.reduce((total, blast) => total + blast.open_count, 0);
  const clicks = blasts.reduce((total, blast) => total + blast.click_count, 0);
  const openRate = recipients ? Math.round((opens / recipients) * 1000) / 10 : 0;
  const clickRate = recipients ? Math.round((clicks / recipients) * 1000) / 10 : 0;

  return (
    <main className="min-h-screen bg-white text-[#17130d]">
      <AdminHeader theme="paper"
        actions={[
          { href: "/admin/campaigns", label: "Campaigns" },
          {
            href: `/admin/campaigns/${campaign.id}/blasts/new`,
            label: "New Blast",
            tone: "primary",
          },
        ]}
        eyebrow="Campaign"
        subtitle={campaign.description || "No description yet."}
        title={campaign.title}
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["Blasts", blasts.length],
            ["Sent", sentBlasts.length],
            ["Recipients", recipients],
            ["Open Rate", `${openRate}%`],
            ["Click Rate", `${clickRate}%`],
          ].map(([label, value]) => (
            <div className="border border-[#e9e1d1] bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.26)]" key={label}>
              <p className="text-xs font-black uppercase tracking-[3px] text-slate-500">
                {label}
              </p>
              <p className="mt-3 text-3xl font-black">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#e9e1d1] bg-white shadow-[0_24px_80px_rgba(23,19,13,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e9e1d1] text-left text-sm">
              <thead className="bg-[#faf7ef] text-[#17130d]">
                <tr>
                  {blastSortColumns.map((column) => (
                    <BlastSortHeader
                      campaignId={campaign.id}
                      filters={filters}
                      key={column.key}
                      label={column.label}
                      sortBy={column.key}
                    />
                  ))}
                  <th className="whitespace-nowrap px-4 py-4 font-black uppercase tracking-[3px]">
                    Audience
                  </th>
                  <th className="whitespace-nowrap px-4 py-4 text-right font-black uppercase tracking-[3px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9e1d1]">
                {blasts.map((blast) => (
                  <tr className="hover:bg-[#faf7ef]" key={blast.id}>
                    <td className="px-4 py-4">
                      <p className="font-black text-[#17130d]">{blast.title}</p>
                      <p className="mt-1 text-slate-600">{blast.subject}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{blast.status}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{blast.recipient_count}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{getOpenRate(blast)}%</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{getClickRate(blast)}%</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <LocalDateTime
                        fallback={formatDate(blast.created_at)}
                        value={blast.created_at}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {blast.sent_at ? (
                        <LocalDateTime
                          fallback={formatDate(blast.sent_at)}
                          value={blast.sent_at}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <LocalDateTime
                        fallback={formatDate(blast.updated_at)}
                        value={blast.updated_at}
                      />
                    </td>
                    <td className="max-w-sm px-4 py-4 text-slate-600">
                      {summarizeAudienceFilter(blast.audience_filter)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-3">
                        <Link className="font-black text-[#785d25] hover:text-[#785d25]" href={`/admin/campaigns/${campaign.id}/blasts/${blast.id}`}>
                          Edit
                        </Link>
                        <AdminForm action={duplicateBlastAction}>
                          <input name="blast_id" type="hidden" value={blast.id} />
                          <button
                            className="font-black text-slate-600 hover:text-[#17130d]"
                            type="submit"
                          >
                            Duplicate
                          </button>
                        </AdminForm>
                        <AdminForm action={deleteBlastAction}>
                          <input name="campaign_id" type="hidden" value={campaign.id} />
                          <input name="blast_id" type="hidden" value={blast.id} />
                          <ConfirmSubmitButton
                            className="font-black text-red-700 hover:text-red-700"
                            message={`Delete blast "${blast.title}"?`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </AdminForm>
                      </div>
                    </td>
                  </tr>
                ))}
                {!blasts.length ? (
                  <tr>
                    <td className="px-4 py-12 text-center font-bold text-slate-600" colSpan={10}>
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
