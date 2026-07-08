import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Contact,
  contactStatuses,
  membershipStatuses,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { runNewSignupAutomation } from "@/lib/new-signup-automation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin-header";
import { AdminContactsTable } from "@/components/admin-contacts-table";

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
  "mt-2 w-full border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

const sortableColumns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "alternate_email", label: "Alt Email" },
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
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,alternate_email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`,
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

async function bulkContactAction(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const contactIds = String(formData.get("contact_ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const bulkAction = String(formData.get("bulk_action") ?? "");

  if (!contactIds.length) {
    redirect("/admin");
  }

  const supabase = createServerSupabaseClient();

  if (bulkAction === "delete") {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .in("id", contactIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (bulkAction === "status") {
    const status = String(formData.get("status") ?? "");

    if (!contactStatuses.includes(status as never)) {
      throw new Error("Invalid contact status.");
    }

    const { error } = await supabase
      .from("contacts")
      .update({ status })
      .in("id", contactIds);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (bulkAction === "membership_status") {
    const membershipStatus = String(formData.get("membership_status") ?? "");

    if (!membershipStatuses.includes(membershipStatus as never)) {
      throw new Error("Invalid membership status.");
    }

    const { error } = await supabase
      .from("contacts")
      .update({ membership_status: membershipStatus })
      .in("id", contactIds);

    if (error) {
      throw new Error(error.message);
    }

    if (membershipStatus === "Active Member") {
      await Promise.all(
        contactIds.map((contactId) =>
          runNewSignupAutomation({
            contactId,
            source: "admin",
          }).catch((error: unknown) => {
            console.error("Unable to run new signup automation", error);
          }),
        ),
      );
    }
  }

  revalidatePath("/admin");
  redirect("/admin");
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
      <AdminHeader
        actions={[
          { href: "/", label: "Home" },
          { href: "/join", label: "Join Form", tone: "primary" },
          { href: getExportHref(filters), label: "Export CSV" },
          { href: "/admin/import", label: "Import CSV" },
          { href: "/admin/campaigns", label: "Campaigns" },
          { href: "/admin/settings", label: "Settings" },
          { href: "/admin/logout", label: "Log Out", tone: "danger" },
        ]}
        eyebrow="Colts CRM"
        subtitle="Manage contacts, membership status, opt-ins, donations, and campaign audiences from one working console."
        title="Contacts Dashboard"
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {summaryStats.length
            ? summaryStats.map((stat) => (
                <div
                  className="border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(9,9,11,0.96))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.26)]"
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
          <section className="mt-6 border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            Summary stats could not load: {summaryErrorMessage}
          </section>
        ) : null}

        <section className="mt-6 border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
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
                className="border border-red-400/40 bg-red-600 px-6 py-3 font-black uppercase tracking-[3px] text-white hover:bg-red-500"
                type="submit"
              >
                Apply
              </button>
              <Link
                className="border border-white/15 bg-black/25 px-6 py-3 font-bold text-gray-200 hover:border-blue-500 hover:text-white"
                href="/admin"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        {errorMessage ? (
          <section className="mt-6 border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            {errorMessage}
          </section>
        ) : null}

        <AdminContactsTable
          bulkAction={bulkContactAction}
          contacts={contacts}
          errorMessage={errorMessage}
          filters={filters}
        />
      </div>
    </main>
  );
}
