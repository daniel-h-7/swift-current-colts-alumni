import { adminPath } from "@/lib/team-admin";
import { AdminForm } from "@/components/admin-navigation";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getEmailSettings } from "@/lib/email-settings";
import { getMembershipSettings } from "@/lib/membership-settings";
import { AdminHeader } from "@/components/admin-header";
import { EmailSettingsForm } from "@/components/email-settings-form";

export const dynamic = "force-dynamic";
type SettingsSearchParams = { email_saved?: string; error?: string; saved?: string };

export default async function AdminSettingsPage({ searchParams }: {
  searchParams: Promise<SettingsSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) redirect(await adminPath("/admin/login"));
  const [settings, emailSettings, params] = await Promise.all([
    getMembershipSettings(), getEmailSettings(), searchParams,
  ]);
  return (
    <main className="min-h-screen bg-white text-[#171917]">
      <AdminHeader
        actions={[{ href: "/admin", label: "Dashboard" }, { href: "/admin/campaigns", label: "Campaign Mailer" }]}
        eyebrow="Team Settings"
        title="Settings"
        subtitle="Manage your annual supporter fee and the sender details for your team’s emails."
      />
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <section className="grid gap-6 border-b border-[#dedfd7] py-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#785d25]">Support</p>
            <h2 className="mt-3 text-2xl font-black">Supporter Fee</h2>
            <p className="mt-3 text-sm leading-7 text-[#62675e]">The same annual price shown in your site editor and supporter checkout. Changes apply to new subscriptions; existing subscriptions keep their current price.</p>
          </div>
          <div>
            {params.saved === "1" ? <p role="status" className="mb-5 border-l-2 border-[#c5a45b] pl-4 text-sm font-bold text-[#785d25]">Supporter fee saved.</p> : null}
            {params.error ? <p role="alert" className="mb-5 text-sm font-bold text-red-800">Settings could not be saved: {params.error}</p> : null}
            <AdminForm action="/admin/settings/membership" method="post" className="space-y-5">
              <label className="block text-sm font-bold">
                Annual supporter fee (CAD)
                <input className="mt-2 w-full rounded-lg border border-[#dedfd7] bg-white px-4 py-3 outline-none focus:border-[#785d25] focus:ring-2 focus:ring-[#c5a45b]/25" defaultValue={(settings.annual_membership_amount_cents / 100).toFixed(2)} min="0" name="annual_membership_amount" required step="0.01" type="number" />
              </label>
              <button className="rounded-full bg-[#171917] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#785d25]" type="submit">Save Supporter Fee</button>
            </AdminForm>
          </div>
        </section>
        <section className="grid gap-6 py-10 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#785d25]">Communication</p>
            <h2 className="mt-3 text-2xl font-black">Email Settings</h2>
            <p className="mt-3 text-sm leading-7 text-[#62675e]">Choose how your team appears in campaign and welcome emails, and where supporters can reply.</p>
          </div>
          <EmailSettingsForm defaultSettings={emailSettings} saved={params.email_saved === "1"} />
        </section>
      </div>
    </main>
  );
}
