import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Contact,
  contactStatuses,
  membershipStatuses,
} from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  formatContactName,
  formatDate,
  getContactStatus,
  getContactTags,
  getMembershipStatus,
} from "@/lib/contact-format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ContactPageParams = {
  id: string;
};

type ContactSearchParams = {
  saved?: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

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

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      admin_notes: String(formData.get("admin_notes") ?? "").trim() || null,
      membership_status: String(formData.get("membership_status") ?? ""),
      status: String(formData.get("status") ?? ""),
      tags,
    })
    .eq("id", id);

  if (error) {
    throw error;
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
  value: string | number | null | undefined;
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
  const { saved } = await searchParams;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  const tags = getContactTags(contact);

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
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-gray-200 hover:border-blue-500 hover:text-white"
              href="/admin"
            >
              Dashboard
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

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px]">
        <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-blue-300">
                {contact.email}
              </p>
              <p className="mt-2 text-gray-400">
                Added {formatDate(contact.created_at)}
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

          <form action={updateContact} className="mt-6 space-y-5">
            <input name="id" type="hidden" value={contact.id} />

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
              className="w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
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
