import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Contact,
  ContactActivity,
  contactStatuses,
  membershipStatuses,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { logContactActivity } from "@/lib/contact-activity";
import { runNewSignupAutomation } from "@/lib/new-signup-automation";
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
import { LocalDateTime } from "@/components/local-date-time";

export const dynamic = "force-dynamic";

type ContactPageParams = {
  id: string;
};

type ContactSearchParams = {
  error?: string;
  saved?: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

function getActionErrorMessage(error: unknown) {
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

  return "Unable to save contact.";
}

function getErrorRedirect(id: string, error: unknown) {
  const params = new URLSearchParams({
    error: getActionErrorMessage(error),
  });

  return `/admin/contacts/${id}?${params.toString()}`;
}

async function getContact(id: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Contact | null;
}

async function getContactActivities(contactId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contact_activities")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContactActivity[];
}

async function updateContact(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const id = String(formData.get("id") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const annualDues = String(formData.get("annual_dues_amount") ?? "").trim();
  const giftDonations = String(
    formData.get("gift_donation_amount") ?? "",
  ).trim();
  const graduationYear = String(formData.get("graduation_year") ?? "").trim();
  const updates = {
    admin_notes: String(formData.get("admin_notes") ?? "").trim() || null,
    alternate_email:
      String(formData.get("alternate_email") ?? "").trim().toLowerCase() ||
      null,
    annual_dues_amount_cents: annualDues
      ? Math.round(Number.parseFloat(annualDues) * 100)
      : null,
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    email_opt_in: formData.get("email_opt_in") === "on",
    first_name: String(formData.get("first_name") ?? "").trim(),
    gift_donation_amount_cents: giftDonations
      ? Math.round(Number.parseFloat(giftDonations) * 100)
      : 0,
    graduation_year: graduationYear
      ? Number.parseInt(graduationYear, 10)
      : null,
    last_payment_at:
      String(formData.get("last_payment_at") ?? "").trim() || null,
    last_name: String(formData.get("last_name") ?? "").trim(),
    membership_status: String(formData.get("membership_status") ?? ""),
    notes: String(formData.get("notes") ?? "").trim() || null,
    paid_through: String(formData.get("paid_through") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    relationship_type: String(formData.get("relationship_type") ?? ""),
    sms_opt_in: formData.get("sms_opt_in") === "on",
    sport: String(formData.get("sport") ?? ""),
    status: String(formData.get("status") ?? ""),
    stripe_checkout_session_id:
      String(formData.get("stripe_checkout_session_id") ?? "").trim() || null,
    stripe_customer_id:
      String(formData.get("stripe_customer_id") ?? "").trim() || null,
    tags,
  };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id);

  if (error) {
    redirect(getErrorRedirect(id, error));
  }

  if (updates.membership_status === "Active Member" && updates.email_opt_in) {
    await runNewSignupAutomation({
      contactId: id,
      source: "admin",
    }).catch((error: unknown) => {
      console.error("Unable to run new signup automation", error);
    });
  }

  try {
    await logContactActivity({
      body: `Status: ${updates.status}. Membership: ${updates.membership_status}.`,
      contactId: id,
      metadata: {
        fields: Object.keys(updates),
        source: "admin",
      },
      title: "Contact updated",
      type: "admin_update",
    });
  } catch (error) {
    // Activity is useful, but contact saves should not fail if the activity table
    // has not been migrated yet.
    console.error("Unable to log contact activity", error);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/contacts/${id}`);
  redirect(`/admin/contacts/${id}?saved=1`);
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
        {label}
      </p>
      <p className="mt-2 font-bold text-white">{value || "-"}</p>
    </div>
  );
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<ContactPageParams>;
  searchParams: Promise<ContactSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const { error, saved } = await searchParams;
  const [contact, activityResult] = await Promise.all([
    getContact(id),
    getContactActivities(id)
      .then((activities) => ({ activities, error: "" }))
      .catch((error: unknown) => ({
        activities: [] as ContactActivity[],
        error:
          error instanceof Error
            ? error.message
            : "Activity timeline could not load.",
      })),
  ]);

  if (!contact) {
    notFound();
  }

  const tags = getContactTags(contact);
  const activities = activityResult.activities;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              Contact Record
            </p>
            <h1 className="mt-3 text-4xl font-black">
              {formatContactName(contact)}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm font-bold text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/35 hover:text-white"
              href="/admin"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(220,38,38,0.22)] transition hover:bg-red-500"
              href="/admin/logout"
            >
              Log Out
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px]">
        <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-blue-300">
                {contact.email}
              </p>
              {contact.alternate_email ? (
                <p className="mt-1 text-sm font-bold text-gray-400">
                  {contact.alternate_email}
                </p>
              ) : null}
              <p className="mt-2 text-gray-400">
                Added{" "}
                <LocalDateTime
                  fallback={formatDate(contact.created_at)}
                  value={contact.created_at}
                />
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-gray-200">
                {getContactStatus(contact)}
              </span>
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-300">
                {getMembershipStatus(contact)}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <DetailItem label="Primary Email" value={contact.email} />
            <DetailItem
              label="Additional Email"
              value={contact.alternate_email}
            />
            <DetailItem label="Phone" value={contact.phone} />
            <DetailItem
              label="Graduation Year"
              value={contact.graduation_year}
            />
            <DetailItem label="Relationship" value={contact.relationship_type} />
            <DetailItem label="Sport / Program" value={contact.sport} />
            <DetailItem
              label="Email Opt-In"
              value={contact.email_opt_in ? "Yes" : "No"}
            />
            <DetailItem
              label="SMS Opt-In"
              value={contact.sms_opt_in ? "Yes" : "No"}
            />
            <DetailItem
              label="Annual Dues"
              value={formatCurrencyFromCents(contact.annual_dues_amount_cents)}
            />
            <DetailItem
              label="Gift Donations"
              value={formatCurrencyFromCents(
                contact.gift_donation_amount_cents,
              )}
            />
            <DetailItem
              label="Paid Through"
              value={formatOptionalDate(contact.paid_through)}
            />
            <DetailItem
              label="Last Payment"
              value={
                contact.last_payment_at ? (
                  <LocalDateTime
                    fallback={formatDate(contact.last_payment_at)}
                    value={contact.last_payment_at}
                  />
                ) : (
                  "-"
                )
              }
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
              Public Notes
            </p>
            <p className="mt-3 whitespace-pre-wrap text-gray-300">
              {contact.notes || "-"}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
              Tags
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.length ? (
                tags.map((tag) => (
                  <span
                    className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No tags yet.</span>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
              Activity Timeline
            </p>
            <div className="mt-5 space-y-4">
              {activityResult.error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
                  Activity timeline could not load: {activityResult.error}
                </div>
              ) : null}

              {activities.length ? (
                activities.map((activity) => (
                  <div
                    className="border-l-2 border-blue-500/50 pl-4"
                    key={activity.id}
                  >
                    <p className="font-black text-white">{activity.title}</p>
                    {activity.body ? (
                      <p className="mt-1 text-sm text-gray-300">
                        {activity.body}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-bold uppercase tracking-[2px] text-gray-500">
                      <LocalDateTime
                        fallback={formatDate(activity.created_at)}
                        value={activity.created_at}
                      />
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No activity yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <h2 className="text-2xl font-black">CRM Management</h2>
          <p className="mt-2 text-sm text-gray-400">
            Track follow-up, tag useful segments, and prepare this record for
            future annual membership payments.
          </p>

          {saved === "1" ? (
            <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
              Contact updated.
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
              {error}
            </div>
          ) : null}

          <form action={updateContact} className="mt-6 space-y-5">
            <input name="id" type="hidden" value={contact.id} />

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-200">
                First name
                <input
                  className={fieldClass}
                  defaultValue={contact.first_name}
                  name="first_name"
                  required
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Last name
                <input
                  className={fieldClass}
                  defaultValue={contact.last_name}
                  name="last_name"
                  required
                />
              </label>
            </div>

            <label className="block text-sm font-bold text-gray-200">
              Primary email
              <input
                className={fieldClass}
                defaultValue={contact.email}
                name="email"
                required
                type="email"
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Additional email
              <input
                className={fieldClass}
                defaultValue={contact.alternate_email ?? ""}
                name="alternate_email"
                placeholder="second-contact@example.com"
                type="email"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-200">
                Phone
                <input
                  className={fieldClass}
                  defaultValue={contact.phone ?? ""}
                  name="phone"
                  type="tel"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Graduation year
                <input
                  className={fieldClass}
                  defaultValue={contact.graduation_year ?? ""}
                  inputMode="numeric"
                  max="2100"
                  min="1940"
                  name="graduation_year"
                  type="number"
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-200">
                Relationship
                <select
                  className={fieldClass}
                  defaultValue={contact.relationship_type}
                  name="relationship_type"
                >
                  {relationshipTypes.map((type) => (
                    <option className="bg-zinc-950" key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Sport / program
                <select
                  className={fieldClass}
                  defaultValue={contact.sport}
                  name="sport"
                >
                  {sports.map((sport) => (
                    <option className="bg-zinc-950" key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2">
              <label className="flex items-start gap-3 text-sm font-bold text-gray-200">
                <input
                  className="mt-1 h-4 w-4 rounded border-white/20 accent-blue-600"
                  defaultChecked={contact.email_opt_in}
                  name="email_opt_in"
                  type="checkbox"
                />
                Email opt-in
              </label>

              <label className="flex items-start gap-3 text-sm font-bold text-gray-200">
                <input
                  className="mt-1 h-4 w-4 rounded border-white/20 accent-red-600"
                  defaultChecked={contact.sms_opt_in}
                  name="sms_opt_in"
                  type="checkbox"
                />
                SMS opt-in
              </label>
            </div>

            <label className="block text-sm font-bold text-gray-200">
              Status
              <select
                className={fieldClass}
                defaultValue={getContactStatus(contact)}
                name="status"
              >
                {contactStatuses.map((status) => (
                  <option className="bg-zinc-950" key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Membership status
              <select
                className={fieldClass}
                defaultValue={getMembershipStatus(contact)}
                name="membership_status"
              >
                {membershipStatuses.map((status) => (
                  <option className="bg-zinc-950" key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block text-sm font-bold text-gray-200">
                Annual dues amount
                <input
                  className={fieldClass}
                  defaultValue={
                    typeof contact.annual_dues_amount_cents === "number"
                      ? (contact.annual_dues_amount_cents / 100).toFixed(2)
                      : ""
                  }
                  min="0"
                  name="annual_dues_amount"
                  placeholder="100.00"
                  step="0.01"
                  type="number"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Gift donations total
                <input
                  className={fieldClass}
                  defaultValue={
                    typeof contact.gift_donation_amount_cents === "number"
                      ? (contact.gift_donation_amount_cents / 100).toFixed(2)
                      : ""
                  }
                  min="0"
                  name="gift_donation_amount"
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Paid through
                <input
                  className={fieldClass}
                  defaultValue={contact.paid_through ?? ""}
                  name="paid_through"
                  type="date"
                />
              </label>
            </div>

            <label className="block text-sm font-bold text-gray-200">
              Last payment date
              <input
                className={fieldClass}
                defaultValue={contact.last_payment_at ?? ""}
                name="last_payment_at"
                type="date"
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Stripe customer ID
              <input
                className={fieldClass}
                defaultValue={contact.stripe_customer_id ?? ""}
                name="stripe_customer_id"
                placeholder="cus_..."
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Stripe checkout session ID
              <input
                className={fieldClass}
                defaultValue={contact.stripe_checkout_session_id ?? ""}
                name="stripe_checkout_session_id"
                placeholder="cs_..."
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Public notes
              <textarea
                className={`${fieldClass} min-h-28 resize-y`}
                defaultValue={contact.notes ?? ""}
                name="notes"
                placeholder="Public notes from signup."
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Tags
              <input
                className={fieldClass}
                defaultValue={tags.join(", ")}
                name="tags"
                placeholder="Volunteer, Sponsor Lead, Homecoming"
              />
            </label>

            <label className="block text-sm font-bold text-gray-200">
              Admin notes
              <textarea
                className={`${fieldClass} min-h-36 resize-y`}
                defaultValue={contact.admin_notes ?? ""}
                name="admin_notes"
                placeholder="Internal notes for the booster club."
              />
            </label>

            <button
              className="w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
              type="submit"
            >
              Save Contact
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
