import { adminPath } from "@/lib/team-admin";

import { AdminForm } from "@/components/admin-navigation";
import { AdminLink as Link } from "@/components/admin-navigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Campaign } from "@/lib/campaign-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { duplicateCampaignWithBlasts } from "@/lib/campaign-duplication";
import { getWorkspaceClientId } from "@/lib/team-admin";
import { formatDate } from "@/lib/contact-format";
import { ensureNewSignupAutomationCampaign } from "@/lib/new-signup-automation";
import { ensureRenewalReminderCampaign } from "@/lib/renewal-reminder-automation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { LocalDateTime } from "@/components/local-date-time";

export const dynamic = "force-dynamic";

type CampaignsSearchParams = {
  sort_by?: string;
  sort_dir?: string;
};

type CampaignRow = Campaign & {
  blastCount: number;
  lastEditedAt: string;
  lastSentAt: string | null;
};

type CampaignBlastSummary = {
  created_at: string;
  id: string;
  sent_at: string | null;
  updated_at: string;
};

const campaignSortColumns = [
  { key: "title", label: "Campaign" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
  { key: "blastCount", label: "Blasts" },
  { key: "lastSentAt", label: "Last Sent" },
  { key: "lastEditedAt", label: "Last Edited" },
] as const;

type CampaignSortKey = (typeof campaignSortColumns)[number]["key"];
type SortDirection = "asc" | "desc";

function getCampaignSort(filters: CampaignsSearchParams): {
  sortBy: CampaignSortKey;
  sortDir: SortDirection;
} {
  const allowedKeys = campaignSortColumns.map((column) => column.key);
  const sortBy = allowedKeys.includes(filters.sort_by as CampaignSortKey)
    ? (filters.sort_by as CampaignSortKey)
    : "lastEditedAt";
  const sortDir = filters.sort_dir === "asc" ? "asc" : "desc";

  return { sortBy, sortDir };
}

function compareNullableDates(
  first: string | null,
  second: string | null,
) {
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

function sortCampaignRows(rows: CampaignRow[], filters: CampaignsSearchParams) {
  const { sortBy, sortDir } = getCampaignSort(filters);
  const direction = sortDir === "asc" ? 1 : -1;

  return [...rows].sort((first, second) => {
    if (
      sortBy === "created_at" ||
      sortBy === "lastSentAt" ||
      sortBy === "lastEditedAt"
    ) {
      const firstValue = first[sortBy];
      const secondValue = second[sortBy];

      if (!firstValue || !secondValue) {
        return compareNullableDates(firstValue, secondValue);
      }

      return compareNullableDates(firstValue, secondValue) * direction;
    }

    if (sortBy === "blastCount") {
      return (first.blastCount - second.blastCount) * direction;
    }

    return String(first[sortBy] ?? "").localeCompare(String(second[sortBy] ?? "")) * direction;
  });
}

function getCampaignSortHref(filters: CampaignsSearchParams, sortBy: CampaignSortKey) {
  const currentSort = getCampaignSort(filters);
  const params = new URLSearchParams();

  params.set("sort_by", sortBy);
  params.set(
    "sort_dir",
    currentSort.sortBy === sortBy && currentSort.sortDir === "asc"
      ? "desc"
      : "asc",
  );

  return `/admin/campaigns?${params.toString()}`;
}

function CampaignSortHeader({
  filters,
  label,
  sortBy,
}: {
  filters: CampaignsSearchParams;
  label: string;
  sortBy: CampaignSortKey;
}) {
  const currentSort = getCampaignSort(filters);
  const isActive = currentSort.sortBy === sortBy;

  return (
    <th className="whitespace-nowrap px-4 py-4 font-black uppercase tracking-[3px]">
      <Link
        className="inline-flex items-center gap-2 text-[#17130d] hover:text-[#785d25]"
        href={getCampaignSortHref(filters, sortBy)}
      >
        {label}
        <span className={isActive ? "text-[#785d25]" : "text-slate-400"}>
          {isActive && currentSort.sortDir === "asc" ? "^" : "v"}
        </span>
      </Link>
    </th>
  );
}

async function getCampaigns(filters: CampaignsSearchParams) {
  const supabase = createServerSupabaseClient();
  const clientId = (await getWorkspaceClientId());
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientId);

  if (campaignsError) {
    throw new Error(campaignsError.message);
  }

  const campaignIds = (campaigns ?? []).map((campaign) => campaign.id as string);
  let blastsByCampaign = new Map<string, CampaignBlastSummary[]>();

  if (campaignIds.length) {
    const { data: blasts, error: blastsError } = await supabase
      .from("campaign_blasts")
      .select("campaign_id, created_at, id, sent_at, updated_at")
      .eq("client_id", clientId)
      .in("campaign_id", campaignIds);

    if (blastsError) {
      throw new Error(blastsError.message);
    }

    blastsByCampaign = (blasts ?? []).reduce((byCampaign, blast) => {
      const campaignId = blast.campaign_id as string;
      const existing = byCampaign.get(campaignId) ?? [];

      byCampaign.set(campaignId, [
        ...existing,
        blast as CampaignBlastSummary,
      ]);

      return byCampaign;
    }, new Map<string, CampaignBlastSummary[]>());
  }

  const rows = ((campaigns ?? []) as Campaign[]).map((campaign) => {
    const blasts = blastsByCampaign.get(campaign.id) ?? [];
    const blastDates = blasts
      .map((blast) => blast.updated_at as string | null)
      .filter(Boolean) as string[];
    const sentDates = blasts
      .map((blast) => blast.sent_at as string | null)
      .filter(Boolean) as string[];
    const lastEditedAt = [campaign.updated_at as string, ...blastDates].sort(
      (first, second) => new Date(second).getTime() - new Date(first).getTime(),
    )[0];
    const lastSentAt = sentDates.sort(
      (first, second) => new Date(second).getTime() - new Date(first).getTime(),
    )[0] ?? null;

    return {
      created_at: campaign.created_at,
      description: campaign.description,
      id: campaign.id,
      status: campaign.status,
      title: campaign.title,
      updated_at: campaign.updated_at,
      blastCount: blasts.length,
      lastEditedAt,
      lastSentAt,
    } as CampaignRow;
  });

  return sortCampaignRows(rows, filters);
}

async function duplicateCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const newCampaignId = await duplicateCampaignWithBlasts(campaignId);

  revalidatePath(await adminPath("/admin/campaigns"));
  redirect(await adminPath(`/admin/campaigns/${newCampaignId}`));
}

async function deleteCampaign(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const campaignId = String(formData.get("campaign_id") ?? "");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("client_id", (await getWorkspaceClientId()))
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(await adminPath("/admin/campaigns"));
  redirect(await adminPath("/admin/campaigns"));
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<CampaignsSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect(await adminPath("/admin/login"));
  }

  const filters = await searchParams;
  let campaigns: CampaignRow[] = [];
  let errorMessage = "";

  try {
    await ensureNewSignupAutomationCampaign();
    await ensureRenewalReminderCampaign();
    campaigns = await getCampaigns(filters);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Unable to load campaigns.";
  }

  return (
    <main className="min-h-screen bg-white text-[#17130d]">
      <AdminHeader theme="paper"
        actions={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/campaigns/new", label: "New Campaign", tone: "primary" },
        ]}
        eyebrow="Communications"
        subtitle="Review campaigns, duplicate seasonal templates, and jump into blasts from a sortable campaign list."
        title="Campaigns"
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {errorMessage ? (
          <section className="border border-red-500/30 bg-red-50 p-6 font-bold text-red-800">
            {errorMessage}
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-[#e9e1d1] bg-white shadow-[0_24px_80px_rgba(23,19,13,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e9e1d1] text-left text-sm">
              <thead className="bg-[#faf7ef] text-[#17130d]">
                <tr>
                  {campaignSortColumns.map((column) => (
                    <CampaignSortHeader
                      filters={filters}
                      key={column.key}
                      label={column.label}
                      sortBy={column.key}
                    />
                  ))}
                  <th className="whitespace-nowrap px-4 py-4 text-right font-black uppercase tracking-[3px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9e1d1]">
                {campaigns.map((campaign) => (
                  <tr className="align-top hover:bg-[#faf7ef]" key={campaign.id}>
                    <td className="min-w-80 px-4 py-4">
                      <Link
                        className="font-black text-[#17130d] hover:text-[#785d25]"
                        href={`/admin/campaigns/${campaign.id}`}
                      >
                        {campaign.title}
                      </Link>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                        {campaign.description || "No description yet."}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full border border-[#dfcc9a] bg-[#faf7ef] px-3 py-1 text-xs font-black text-[#785d25]">
                        {campaign.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <LocalDateTime
                        fallback={formatDate(campaign.created_at)}
                        value={campaign.created_at}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {campaign.blastCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {campaign.lastSentAt ? (
                        <LocalDateTime
                          fallback={formatDate(campaign.lastSentAt)}
                          value={campaign.lastSentAt}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <LocalDateTime
                        fallback={formatDate(campaign.lastEditedAt)}
                        value={campaign.lastEditedAt}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-3">
                        <Link
                          className="font-black text-[#785d25] hover:text-[#785d25]"
                          href={`/admin/campaigns/${campaign.id}/edit`}
                        >
                          Edit
                        </Link>
                        <AdminForm action={duplicateCampaign}>
                          <input name="campaign_id" type="hidden" value={campaign.id} />
                          <button
                            className="font-black text-slate-600 hover:text-[#17130d]"
                            type="submit"
                          >
                            Duplicate
                          </button>
                        </AdminForm>
                        <AdminForm action={deleteCampaign}>
                          <input name="campaign_id" type="hidden" value={campaign.id} />
                          <ConfirmSubmitButton
                            className="font-black text-red-700 hover:text-red-700"
                            message={`Delete campaign "${campaign.title}" and all of its blasts?`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </AdminForm>
                      </div>
                    </td>
                  </tr>
                ))}

                {!campaigns.length && !errorMessage ? (
                  <tr>
                    <td
                      className="px-4 py-12 text-center font-bold text-slate-600"
                      colSpan={7}
                    >
                      No campaigns yet.
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
