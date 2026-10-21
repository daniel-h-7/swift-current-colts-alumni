import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudioHeader } from "@/components/studio-header";
import { getClientIntegration } from "@/lib/client-integrations";
import { formatMembershipAmount, getMembershipSettingsForClient } from "@/lib/membership-settings";
import { getPlatformClient } from "@/lib/platform-data";
import { getStudioClientOwner, canAccessStudioClient, hasStudioOrHqSession, isHqStudioAccess } from "@/lib/studio-auth";
import { studioLoginPath } from "@/lib/studio-navigation";
import { getStripeMode } from "@/lib/stripe";

export const dynamic = "force-dynamic";
const actionClass = "inline-flex justify-center rounded-full bg-[#17130d] px-5 py-3 text-sm font-bold text-white hover:bg-[#362b19] disabled:cursor-not-allowed disabled:opacity-50";
export default async function StudioPaymentsPage({ params, searchParams }: { params: Promise<{ clientId: string }>; searchParams: Promise<{ error?: string; stripe_returned?: string }> }) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const path = `/studio/${encodeURIComponent(clientId)}/payments`;
  if (!(await hasStudioOrHqSession()) || !(await canAccessStudioClient(clientId))) redirect(studioLoginPath(path,"Log in to manage this organization's payments."));
  const [client, settings, integration, owner, hq] = await Promise.all([getPlatformClient(clientId),getMembershipSettingsForClient(clientId),getClientIntegration(clientId,"stripe_connect"),getStudioClientOwner(clientId),isHqStudioAccess()]);
  if (!client) notFound();
  const metadata = integration?.metadata;
  const mode = getStripeMode();
  const verified = metadata?.verified_client_id === clientId && metadata?.verified_account_id === integration?.external_account_id && metadata?.verification_mode === mode;
  const accountId = integration?.external_account_id;
  const status = verified ? integration!.status.replaceAll("_"," ") : accountId ? "Not verified yet" : "Not connected";
  const lastChecked = typeof metadata?.last_checked_at === "string" ? metadata.last_checked_at : null;
  const flag = (key: string) => verified ? metadata?.[key] === true ? "Enabled" : "Needs setup" : "Not verified";
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#17130d]">
      <StudioHeader title="Payments" subtitle="Your organization owns its Stripe account and payouts." actions={[...(hq?[{href:`/hq/clients/${clientId}`,label:"Back to HQ"}]:[]),{href:`/studio/${clientId}`,label:"Builder Dashboard"},{href:"/studio",label:"Switch organization"}]} />
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {query.error ? <p role="alert" className="rounded-2xl bg-red-50 p-5 font-semibold text-red-800">{query.error}</p> : null}
          {query.stripe_returned ? <p role="status" className="rounded-2xl bg-[#f1e7ce] p-5 font-semibold">Stripe was checked. Review payments, payouts, and verification below.</p> : null}
          <section className="rounded-[2rem] bg-white p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#785d25]">{client.name}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{status}</h1>
            <p className="mt-3 text-sm text-slate-600">Annual membership: <strong>{formatMembershipAmount(settings)}</strong> · {mode === "live" ? "Live payments" : mode === "sandbox" ? "Test environment" : "Stripe is not configured"}</p>
            <dl className="mt-7 grid gap-4 sm:grid-cols-3">{[["Payments",flag("charges_enabled")],["Payouts",flag("payouts_enabled")],["Details",verified && metadata?.details_submitted ? "Submitted" : "Not verified"]].map(([label,value])=><div key={label} className="rounded-2xl bg-[#faf7ef] p-4"><dt className="text-xs font-bold uppercase tracking-wider text-[#785d25]">{label}</dt><dd className="mt-2 font-bold">{value}</dd></div>)}</dl>
            <p className="mt-5 break-all text-sm text-slate-500">Account: {accountId || "No account linked"}</p>
            <p className="mt-2 text-sm text-slate-500">Last checked: {lastChecked ? new Date(lastChecked).toLocaleString("en-CA", { timeZone: "UTC" }) + " UTC" : "Not checked yet"}</p>
            {verified && metadata?.disabled_reason ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Stripe needs attention. Open Stripe Dashboard to review its requirements.</p> : null}
            {accountId ? <div className="mt-7 flex flex-wrap gap-3">
              <a className={actionClass} href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer">Open Stripe Dashboard ↗</a>
              {owner || hq ? <form action={`${path}/return`} method="post"><button className={actionClass} type="submit" disabled={mode==="mock"}>Check connection</button></form> : null}
              {owner && integration?.status!=="connected" ? <form action={`${path}/connect`} method="post"><button className={actionClass} type="submit" disabled={mode==="mock"}>Continue setup</button></form> : null}
              {owner && integration?.status==="disabled" ? <form action={`${path}/oauth`} method="post"><button className={actionClass} type="submit">Reauthorize this account</button></form> : null}
            </div> : owner ? <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <form className="rounded-2xl border border-[#dfcc9a] p-5" action={`${path}/connect`} method="post"><input type="hidden" name="intent" value="new"/><h2 className="font-black">New to Stripe?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Create an account owned by your organization. Interrupted setup resumes the same attempt.</p><button className={`${actionClass} mt-4`} type="submit" disabled={mode==="mock"}>Create a new Stripe account</button></form>
              <form className="rounded-2xl border border-[#dfcc9a] p-5" action={`${path}/oauth`} method="post"><h2 className="font-black">Already use Stripe?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Authorize your existing account. Your saved payment account will never be silently replaced.</p><button className={`${actionClass} mt-4`} type="submit" disabled={mode==="mock"}>Connect existing Stripe account</button></form>
            </div> : null}
            {!owner ? <p className="mt-6 rounded-xl bg-[#faf7ef] p-4 text-sm leading-6">The organization’s Studio owner must create or authorize its Stripe account. HQ can check an existing connection; editor and viewer logins cannot manage it. <Link href={studioLoginPath(path)} className="font-bold underline">Sign in as the organization owner</Link></p> : null}
          </section>
        </div>
        <aside className="space-y-6"><section className="rounded-3xl bg-white p-6"><h2 className="text-xl font-black">Setup guide</h2><p className="mt-3 text-sm leading-6 text-slate-600">Keep an existing account for active memberships. Sign in on the same Studio address throughout setup.</p><Link className={`${actionClass} mt-5`} href="/studio/help/stripe">Read the Stripe setup guide</Link></section><p className="px-2 text-sm leading-6 text-slate-600">Payment data and payout bank details stay with Stripe. Never email TeamAlum your bank details or Stripe secret key.</p></aside>
      </section>
    </main>
  );
}
