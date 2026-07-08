import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { formatFromEmail, getEmailSettings } from "@/lib/email-settings";
import {
  formatMembershipAmount,
  getMembershipSettings,
} from "@/lib/membership-settings";
import { AdminHeader } from "@/components/admin-header";
import { EmailSettingsForm } from "@/components/email-settings-form";

export const dynamic = "force-dynamic";

type SettingsSearchParams = {
  email_saved?: string;
  saved?: string;
};

const fieldClass =
  "mt-2 w-full border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

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
      <AdminHeader
        actions={[
          { href: "/admin/settings/site-content", label: "Site Content" },
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/logout", label: "Log Out", tone: "danger" },
        ]}
        eyebrow="CRM Settings"
        subtitle="Control membership pricing, join-page availability, and campaign sender details."
        title="Membership Settings"
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <h2 className="text-2xl font-black">Annual Membership</h2>
            <p className="mt-2 text-gray-400">
              These values shape the join page today and will feed Stripe
              Checkout later.
            </p>

            {params.saved === "1" ? (
              <div className="mt-5 border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
                Settings saved.
              </div>
            ) : null}

            <form action="/admin/settings/membership" className="mt-6 space-y-5" method="post">
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

              <label className="flex items-start gap-3 border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-gray-200">
                <input
                  className="mt-1 h-4 w-4 border-white/20 accent-blue-600"
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
                className="w-full border border-blue-400/40 bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
                type="submit"
              >
                Save Settings
              </button>
            </form>
          </section>

          <section className="border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <h2 className="text-2xl font-black">Email Sender</h2>
            <p className="mt-2 text-gray-400">
              These settings control campaign test sends. The Resend API key
              stays hidden in Vercel.
            </p>

            <EmailSettingsForm
              defaultSettings={emailSettings}
              saved={params.email_saved === "1"}
            />
          </section>
        </div>

        <section className="border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(9,9,11,0.96))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <p className="program-kicker">
            Current Setup
          </p>
          <h2 className="mt-3 text-4xl font-black">
            {formatMembershipAmount(settings)}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Year
              </p>
              <p className="mt-2 font-bold">{settings.membership_year_label}</p>
            </div>
            <div className="border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Join Status
              </p>
              <p className="mt-2 font-bold">
                {settings.join_is_open ? "Open" : "Closed"}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Renewal Deadline
              </p>
              <p className="mt-2 font-bold">
                {settings.renewal_deadline || "-"}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Email From
              </p>
              <p className="mt-2 break-words font-bold">
                {formatFromEmail(emailSettings)}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                Replies To
              </p>
              <p className="mt-2 break-words font-bold">
                {emailSettings.email_reply_to || "-"}
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.04] p-4">
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
