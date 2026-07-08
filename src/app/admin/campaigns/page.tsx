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

type CampaignWithBlasts = Campaign & {
  campaign_blasts?: CampaignBlastSummary[];
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
        className="inline-flex items-center gap-2 text-white hover:text-blue-300"
        href={getCampaignSortHref(filters, sortBy)}
      >
        {label}
        <span className={isActive ? "text-blue-300" : "text-white/35"}>
          {isActive && currentSort.sortDir === "asc" ? "^" : "v"}
        </span>
      </Link>
    </th>
  );
}

async function getCampaigns(filters: CampaignsSearchParams) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, campaign_blasts(id, created_at, sent_at, updated_at)");

  if (error) {
    throw new Error(error.message);
  }

  const rows = ((data ?? []) as CampaignWithBlasts[]).map((campaign) => {
    const blasts = Array.isArray(campaign.campaign_blasts)
      ? campaign.campaign_blasts
      : [];
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

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<CampaignsSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
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
    <main className="min-h-screen bg-black text-white">
      <AdminHeader
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
          <section className="border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            {errorMessage}
          </section>
        ) : null}

        <section className="overflow-visible border border-white/10 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-950 via-zinc-950 to-red-950 text-white">
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
              <tbody className="divide-y divide-white/10">
                {campaigns.map((campaign) => (
                  <tr className="align-top hover:bg-white/[0.04]" key={campaign.id}>
                    <td className="min-w-80 px-4 py-4">
                      <Link
                        className="font-black text-white hover:text-blue-300"
                        href={`/admin/campaigns/${campaign.id}`}
                      >
                        {campaign.title}
                      </Link>
                      <p className="mt-1 max-w-xl text-sm leading-6 text-gray-400">
                        {campaign.description || "No description yet."}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="border border-red-500/20 bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                        {campaign.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      <LocalDateTime
                        fallback={formatDate(campaign.created_at)}
                        value={campaign.created_at}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {campaign.blastCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {campaign.lastSentAt ? (
                        <LocalDateTime
                          fallback={formatDate(campaign.lastSentAt)}
                          value={campaign.lastSentAt}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      <LocalDateTime
                        fallback={formatDate(campaign.lastEditedAt)}
                        value={campaign.lastEditedAt}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-3">
                        <Link
                          className="font-black text-blue-400 hover:text-blue-300"
                          href={`/admin/campaigns/${campaign.id}/edit`}
                        >
                          Edit
                        </Link>
                        <form action={duplicateCampaign}>
                          <input name="campaign_id" type="hidden" value={campaign.id} />
                          <button
                            className="font-black text-gray-400 hover:text-white"
                            type="submit"
                          >
                            Duplicate
                          </button>
                        </form>
                        <form action={deleteCampaign}>
                          <input name="campaign_id" type="hidden" value={campaign.id} />
                          <ConfirmSubmitButton
                            className="font-black text-red-400 hover:text-red-300"
                            message={`Delete campaign "${campaign.title}" and all of its blasts?`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}

                {!campaigns.length && !errorMessage ? (
                  <tr>
                    <td
                      className="px-4 py-12 text-center font-bold text-gray-400"
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
