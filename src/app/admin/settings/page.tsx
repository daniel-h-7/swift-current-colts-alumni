import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatFromEmail, getEmailSettings } from "@/lib/email-settings";
import {
  formatMembershipAmount,
  getMembershipSettings,
} from "@/lib/membership-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SettingsSearchParams = {
  email_saved?: string;
  saved?: string;
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

async function saveSettings(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const amount = String(formData.get("annual_membership_amount") ?? "").trim();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("crm_settings").upsert({
    annual_membership_amount_cents: amount
      ? Math.round(Number.parseFloat(amount) * 100)
      : 0,
    id: "default",
    join_body: String(formData.get("join_body") ?? "").trim(),
    join_headline: String(formData.get("join_headline") ?? "").trim(),
    join_is_open: formData.get("join_is_open") === "on",
    membership_year_label: String(
      formData.get("membership_year_label") ?? "",
    ).trim(),
    renewal_deadline:
      String(formData.get("renewal_deadline") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  revalidatePath("/join");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

async function saveEmailSettings(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("crm_settings").upsert({
    email_from_address: String(formData.get("email_from_address") ?? "")
      .trim()
      .toLowerCase(),
    email_from_name: String(formData.get("email_from_name") ?? "").trim(),
    email_reply_to: String(formData.get("email_reply_to") ?? "")
      .trim()
      .toLowerCase(),
    email_sending_domain: String(formData.get("email_sending_domain") ?? "")
      .trim()
      .toLowerCase(),
    id: "default",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/campaigns");
  redirect("/admin/settings?email_saved=1");
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SettingsSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const [settings, emailSettings] = await Promise.all([
    getMembershipSettings(),
    getEmailSettings(),
  ]);
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              CRM Settings
            </p>
            <h1 className="mt-3 text-4xl font-black">Membership Settings</h1>
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
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Annual Membership</h2>
            <p className="mt-2 text-gray-400">
              These values shape the join page today and will feed Stripe
              Checkout later.
            </p>

            {params.saved === "1" ? (
              <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
                Settings saved.
              </div>
            ) : null}

            <form action={saveSettings} className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-gray-200">
                Annual membership amount
                <input
                  className={fieldClass}
                  defaultValue={(
                    settings.annual_membership_amount_cents / 100
                  ).toFixed(2)}
                  min="0"
                  name="annual_membership_amount"
                  step="0.01"
                  type="number"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Membership year label
                <input
                  className={fieldClass}
                  defaultValue={settings.membership_year_label}
                  name="membership_year_label"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Renewal deadline
                <input
                  className={fieldClass}
                  defaultValue={settings.renewal_deadline ?? ""}
                  name="renewal_deadline"
                  type="date"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-gray-200">
                <input
                  className="mt-1 h-4 w-4 rounded border-white/20 accent-blue-600"
                  defaultChecked={settings.join_is_open}
                  name="join_is_open"
                  type="checkbox"
                />
                Join page is open
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Join page headline
                <input
                  className={fieldClass}
                  defaultValue={settings.join_headline}
                  name="join_headline"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Join page body
                <textarea
                  className={`${fieldClass} min-h-36 resize-y`}
                  defaultValue={settings.join_body}
                  name="join_body"
                />
              </label>

              <button
                className="w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
                type="submit"
              >
                Save Settings
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Email Sender</h2>
            <p className="mt-2 text-gray-400">
              These settings control campaign test sends. The Resend API key
              stays hidden in Vercel.
            </p>

            {params.email_saved === "1" ? (
              <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
                Email settings saved.
              </div>
            ) : null}

            <form action={saveEmailSettings} className="mt-6 space-y-5">
              <label className="block text-sm font-bold text-gray-200">
                Sender name
                <input
                  className={fieldClass}
                  defaultValue={emailSettings.email_from_name}
                  name="email_from_name"
                  placeholder="Colts Alumni"
                  required
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                From email
                <input
                  className={fieldClass}
                  defaultValue={emailSettings.email_from_address}
                  name="email_from_address"
                  placeholder="updates@your-sending-domain.com"
                  required
                  type="email"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Reply-to email
                <input
                  className={fieldClass}
                  defaultValue={emailSettings.email_reply_to}
                  name="email_reply_to"
                  placeholder="alumni@coltsfootball.ca"
                  type="email"
                />
              </label>

              <label className="block text-sm font-bold text-gray-200">
                Sending domain
                <input
                  className={fieldClass}
                  defaultValue={emailSettings.email_sending_domain}
                  name="email_sending_domain"
                  placeholder="updates.yourdomain.com"
                />
              </label>

              <div className="rounded-2xl border border-red-500/25 bg-red-950/25 p-4 text-sm leading-6 text-red-100">
                The from email must belong to a domain verified with your email
                provider. If Wix blocks DNS access, use a separate sending
                domain with DNS you control.
              </div>

              <button
                className="w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
                type="submit"
              >
                Save Email Settings
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">
            Current Setup
          </p>
          <h2 className="mt-3 text-4xl font-black">
            {formatMembershipAmount(settings)}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Year
              </p>
              <p className="mt-2 font-bold">{settings.membership_year_label}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Join Status
              </p>
              <p className="mt-2 font-bold">
                {settings.join_is_open ? "Open" : "Closed"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Renewal Deadline
              </p>
              <p className="mt-2 font-bold">
                {settings.renewal_deadline || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Email From
              </p>
              <p className="mt-2 break-words font-bold">
                {formatFromEmail(emailSettings)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Replies To
              </p>
              <p className="mt-2 break-words font-bold">
                {emailSettings.email_reply_to || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Sending Domain
              </p>
              <p className="mt-2 break-words font-bold">
                {emailSettings.email_sending_domain || "Not set"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
