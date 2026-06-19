import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Contact,
  contactStatuses,
  membershipStatuses,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  formatCurrencyFromCents,
  formatContactName,
  formatDate,
  formatOptionalDate,
  getContactStatus,
  getContactTags,
  getMembershipStatus,
} from "@/lib/contact-format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  graduation_year?: string;
  relationship_type?: string;
  sport?: string;
  email_opt_in?: string;
  sms_opt_in?: string;
  status?: string;
  membership_status?: string;
  paid_status?: string;
  sort_by?: string;
  sort_dir?: string;
};

const filterClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

const sortableColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "graduation_year", label: "Grad Year" },
  { key: "relationship_type", label: "Relationship" },
  { key: "sport", label: "Sport" },
  { key: "status", label: "Status" },
  { key: "membership_status", label: "Membership" },
  { key: "annual_dues_amount_cents", label: "Dues" },
  { key: "gift_donation_amount_cents", label: "Gifts" },
  { key: "paid_through", label: "Paid Through" },
  { key: "last_payment_at", label: "Last Payment" },
  { key: "tags", label: "Tags" },
  { key: "email_opt_in", label: "Email Opt-In" },
  { key: "sms_opt_in", label: "SMS" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Added" },
] as const;

type SortKey = (typeof sortableColumns)[number]["key"];
type SortDirection = "asc" | "desc";

function getSort(filters: SearchParams): {
  sortBy: SortKey;
  sortDir: SortDirection;
} {
  const allowedKeys = sortableColumns.map((column) => column.key);
  const sortBy = allowedKeys.includes(filters.sort_by as SortKey)
    ? (filters.sort_by as SortKey)
    : "created_at";
  const sortDir = filters.sort_dir === "asc" ? "asc" : "desc";

  return { sortBy, sortDir };
}

function getSortHref(filters: SearchParams, sortBy: SortKey) {
  const currentSort = getSort(filters);
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== "sort_by" && key !== "sort_dir") {
      params.set(key, value);
    }
  });

  params.set("sort_by", sortBy);
  params.set(
    "sort_dir",
    currentSort.sortBy === sortBy && currentSort.sortDir === "asc"
      ? "desc"
      : "asc",
  );

  return `/admin?${params.toString()}`;
}

function getExportHref(filters: SearchParams) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  return `/admin/export${params.size ? `?${params.toString()}` : ""}`;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function SortHeader({
  filters,
  label,
  sortBy,
}: {
  filters: SearchParams;
  label: string;
  sortBy: SortKey;
}) {
  const currentSort = getSort(filters);
  const isActive = currentSort.sortBy === sortBy;

  return (
    <th className="whitespace-nowrap px-4 py-4 font-black uppercase tracking-[3px]">
      <Link
        className="inline-flex items-center gap-2 text-white hover:text-blue-300"
        href={getSortHref(filters, sortBy)}
      >
        {label}
        <span className={isActive ? "text-blue-300" : "text-white/35"}>
          {isActive && currentSort.sortDir === "asc" ? "^" : "v"}
        </span>
      </Link>
    </th>
  );
}

async function getCount(
  column?: string,
  operator?: "eq" | "gte" | "lt" | "is",
  value?: string | boolean | null,
) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("contacts")
    .select("id", { count: "exact", head: true });

  if (column && operator) {
    if (operator === "is") {
      query = query.is(column, value);
    } else if (operator === "eq") {
      query = query.eq(column, value);
    } else if (operator === "gte") {
      query = query.gte(column, value);
    } else {
      query = query.lt(column, value);
    }
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getSafeCount(
  label: string,
  column?: string,
  operator?: "eq" | "gte" | "lt" | "is",
  value?: string | boolean | null,
) {
  try {
    return {
      error: "",
      label,
      value: await getCount(column, operator, value),
    };
  } catch (error) {
    return {
      error: getErrorMessage(error, `Unable to load ${label}.`),
      label,
      value: 0,
    };
  }
}

async function getSummaryStats() {
  const today = getTodayDate();

  return Promise.all([
    getSafeCount("Total Contacts"),
    getSafeCount("Active Members", "membership_status", "eq", "Active Member"),
    getSafeCount("Expired Memberships", "paid_through", "lt", today),
    getSafeCount("Missing Paid Through", "paid_through", "is", null),
    getSafeCount("Email Opt-Ins", "email_opt_in", "eq", true),
    getSafeCount("SMS Opt-Ins", "sms_opt_in", "eq", true),
  ]);
}

async function getContacts(filters: SearchParams) {
  const { sortBy, sortDir } = getSort(filters);
  const ascending = sortDir === "asc";
  const searchTerm = filters.q?.trim().replaceAll(",", " ");
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("contacts")
    .select("*");

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`,
    );
  }

  if (filters.graduation_year) {
    query = query.eq(
      "graduation_year",
      Number.parseInt(filters.graduation_year, 10),
    );
  }

  if (filters.relationship_type) {
    query = query.eq("relationship_type", filters.relationship_type);
  }

  if (filters.sport) {
    query = query.eq("sport", filters.sport);
  }

  if (filters.email_opt_in) {
    query = query.eq("email_opt_in", filters.email_opt_in === "true");
  }

  if (filters.sms_opt_in) {
    query = query.eq("sms_opt_in", filters.sms_opt_in === "true");
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.membership_status) {
    query = query.eq("membership_status", filters.membership_status);
  }

  if (filters.paid_status === "active") {
    query = query.gte("paid_through", getTodayDate());
  }

  if (filters.paid_status === "expired") {
    query = query.lt("paid_through", getTodayDate());
  }

  if (filters.paid_status === "missing") {
    query = query.is("paid_through", null);
  }

  if (sortBy === "name") {
    query = query
      .order("last_name", { ascending })
      .order("first_name", { ascending });
  } else {
    query = query.order(sortBy, { ascending, nullsFirst: false });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Contact[];
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const filters = await searchParams;
  let contacts: Contact[] = [];
  let summaryStats: Array<{ error: string; label: string; value: number }> = [];
  let errorMessage = "";
  let summaryErrorMessage = "";

  try {
    contacts = await getContacts(filters);
  } catch (error) {
    errorMessage = getErrorMessage(
      error,
      "Unable to load contacts from Supabase.",
    );
  }

  try {
    summaryStats = await getSummaryStats();
  } catch (error) {
    summaryErrorMessage = getErrorMessage(
      error,
      "Unable to load summary stats from Supabase.",
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              Colts CRM
            </p>
            <h1 className="mt-3 text-4xl font-black">Contacts Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/"
            >
              Home
            </Link>
            <Link
              className="rounded-full bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-600"
              href="/join"
            >
              Join Form
            </Link>
            <Link
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href={getExportHref(filters)}
            >
              Export CSV
            </Link>
            <Link
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/admin/campaigns"
            >
              Campaigns
            </Link>
            <Link
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/admin/settings"
            >
              Settings
            </Link>
            <Link
              className="rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-500"
              href="/admin/logout"
            >
              Log Out
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {summaryStats.length
            ? summaryStats.map((stat) => (
                <div
                  className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl"
                  key={stat.label}
                >
                  <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-black text-white">
                    {stat.value}
                  </p>
                  {stat.error ? (
                    <p className="mt-3 text-xs font-bold leading-5 text-red-300">
                      {stat.error}
                    </p>
                  ) : null}
                </div>
              ))
            : null}
        </section>

        {summaryErrorMessage ? (
          <section className="mt-6 rounded-3xl border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            Summary stats could not load: {summaryErrorMessage}
          </section>
        ) : null}

        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Filters</h2>
              <p className="mt-2 text-gray-400">
                Narrow the contact list by class year, relationship, program,
                status, membership, paid-through date, and opt-in preferences.
              </p>
            </div>
            <p className="font-black text-blue-400">
              {contacts.length} contact{contacts.length === 1 ? "" : "s"}
            </p>
          </div>

          <form action="/admin" className="mt-6 grid gap-5 md:grid-cols-6">
            <input name="sort_by" type="hidden" value={getSort(filters).sortBy} />
            <input
              name="sort_dir"
              type="hidden"
              value={getSort(filters).sortDir}
            />

            <label className="text-sm font-bold text-gray-200 md:col-span-2">
              Search
              <input
                className={filterClass}
                defaultValue={filters.q ?? ""}
                name="q"
                placeholder="Name, email, or phone"
                type="search"
              />
            </label>

            <label className="text-sm font-bold text-gray-200">
              Graduation year
              <input
                className={filterClass}
                defaultValue={filters.graduation_year ?? ""}
                inputMode="numeric"
                name="graduation_year"
                placeholder="All"
                type="number"
              />
            </label>

            <label className="text-sm font-bold text-gray-200">
              Relationship
              <select
                className={filterClass}
                defaultValue={filters.relationship_type ?? ""}
                name="relationship_type"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                {relationshipTypes.map((type) => (
                  <option className="bg-zinc-950" key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-gray-200">
              Sport / program
              <select
                className={filterClass}
                defaultValue={filters.sport ?? ""}
                name="sport"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                {sports.map((sport) => (
                  <option className="bg-zinc-950" key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-gray-200">
              Email opt-in
              <select
                className={filterClass}
                defaultValue={filters.email_opt_in ?? ""}
                name="email_opt_in"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                <option className="bg-zinc-950" value="true">
                  Yes
                </option>
                <option className="bg-zinc-950" value="false">
                  No
                </option>
              </select>
            </label>

            <label className="text-sm font-bold text-gray-200">
              SMS opt-in
              <select
                className={filterClass}
                defaultValue={filters.sms_opt_in ?? ""}
                name="sms_opt_in"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                <option className="bg-zinc-950" value="true">
                  Yes
                </option>
                <option className="bg-zinc-950" value="false">
                  No
                </option>
              </select>
            </label>

            <label className="text-sm font-bold text-gray-200">
              Status
              <select
                className={filterClass}
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                {contactStatuses.map((status) => (
                  <option className="bg-zinc-950" key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-gray-200">
              Membership
              <select
                className={filterClass}
                defaultValue={filters.membership_status ?? ""}
                name="membership_status"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                {membershipStatuses.map((status) => (
                  <option className="bg-zinc-950" key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-bold text-gray-200">
              Paid through
              <select
                className={filterClass}
                defaultValue={filters.paid_status ?? ""}
                name="paid_status"
              >
                <option className="bg-zinc-950" value="">
                  All
                </option>
                <option className="bg-zinc-950" value="active">
                  Current
                </option>
                <option className="bg-zinc-950" value="expired">
                  Expired
                </option>
                <option className="bg-zinc-950" value="missing">
                  Missing
                </option>
              </select>
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-6">
              <button
                className="rounded-full bg-red-600 px-6 py-3 font-black uppercase tracking-[3px] text-white hover:bg-red-500"
                type="submit"
              >
                Apply
              </button>
              <Link
                className="rounded-full border border-white/15 px-6 py-3 font-bold text-gray-200 hover:border-blue-500 hover:text-white"
                href="/admin"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        {errorMessage ? (
          <section className="mt-6 rounded-3xl border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-gradient-to-r from-blue-950 via-zinc-950 to-red-950 text-white">
                <tr>
                  {sortableColumns.map((column) => (
                    <SortHeader
                      filters={filters}
                      key={column.key}
                      label={column.label}
                      sortBy={column.key}
                    />
                  ))}
                  <th className="whitespace-nowrap px-4 py-4 font-black uppercase tracking-[3px]" />
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {contacts.map((contact) => (
                  <tr className="align-top hover:bg-white/[0.04]" key={contact.id}>
                    <td className="whitespace-nowrap px-4 py-4 font-black text-white">
                      <Link
                        className="hover:text-blue-300"
                        href={`/admin/contacts/${contact.id}`}
                      >
                        {formatContactName(contact)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {contact.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {contact.phone || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {contact.graduation_year || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {contact.relationship_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {contact.sport}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-gray-200">
                        {getContactStatus(contact)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                        {getMembershipStatus(contact)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {formatCurrencyFromCents(
                        contact.annual_dues_amount_cents,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {formatCurrencyFromCents(
                        contact.gift_donation_amount_cents,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {formatOptionalDate(contact.paid_through)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {formatOptionalDate(contact.last_payment_at)}
                    </td>
                    <td className="min-w-48 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {getContactTags(contact).length ? (
                          getContactTags(contact).map((tag) => (
                            <span
                              className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300"
                              key={tag}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">
                        {contact.email_opt_in ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                        {contact.sms_opt_in ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="max-w-sm px-4 py-4 text-gray-300">
                      {contact.notes || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-gray-300">
                      {formatDate(contact.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <Link
                        className="font-black text-blue-400 hover:text-blue-300"
                        href={`/admin/contacts/${contact.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {!contacts.length && !errorMessage ? (
                  <tr>
                    <td
                      className="px-4 py-12 text-center font-bold text-gray-400"
                      colSpan={18}
                    >
                      No contacts match the current filters.
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
