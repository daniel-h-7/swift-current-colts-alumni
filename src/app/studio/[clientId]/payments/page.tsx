import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudioHeader } from "@/components/studio-header";
import {
  getClientIntegration,
} from "@/lib/client-integrations";
import { formatMembershipAmount, getMembershipSettingsForClient } from "@/lib/membership-settings";
import { getPlatformClient } from "@/lib/platform-data";
import { canAccessStudioClient, getStudioSession } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

type PageSearchParams = {
  error?: string;
  stripe_returned?: string;
};

function getStatusTone(status: string) {
  if (status === "connected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "needs_attention") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function StudioPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);

  if (!(await getStudioSession())) {
    redirect(`/studio/login?error=${encodeURIComponent("Log in to manage payments.")}`);
  }

  if (!(await canAccessStudioClient(clientId))) {
    redirect(`/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`);
  }

  const [client, settings, stripeIntegration] = await Promise.all([
    getPlatformClient(clientId),
    getMembershipSettingsForClient(clientId),
    getClientIntegration(clientId, "stripe_connect"),
  ]);

  if (!client) {
    notFound();
  }

  const stripeStatus = stripeIntegration?.status ?? "not_connected";
  const accountId = stripeIntegration?.external_account_id;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <StudioHeader
        actions={[
          { href: `/studio/${client.id}`, label: "Builder" },
          { href: `/studio/${client.id}/content`, label: "Edit Content" },
          { href: "/studio/logout", label: "Log Out" },
        ]}
        subtitle="Connect your own Stripe account so membership money goes directly to your program."
        title="Payments"
      />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {query.error ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {query.error}
            </div>
          ) : null}

          {query.stripe_returned === "1" ? (
            <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Stripe setup checked. If Stripe still needs information, continue
              onboarding below.
            </div>
          ) : null}

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Client-owned payments
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Connect Stripe without handing TeamAlum the money.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Your program owns the Stripe account, payout settings, bank
              details, and Stripe Dashboard. TeamAlum stores the connection ID so
              your membership form can launch secure checkout for this site.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className={`border p-4 ${getStatusTone(stripeStatus)}`}>
                <p className="text-xs font-black uppercase tracking-[0.18em]">
                  Stripe Status
                </p>
                <p className="mt-2 text-lg font-black">
                  {stripeStatus.replaceAll("_", " ")}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 text-slate-700">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Account
                </p>
                <p className="mt-2 break-all font-mono text-sm font-bold">
                  {accountId ?? "Not created yet"}
                </p>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-4 text-slate-700">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Annual Membership
                </p>
                <p className="mt-2 text-lg font-black">
                  {formatMembershipAmount(settings)}
                </p>
              </div>
            </div>

            <form
              action={`/studio/${encodeURIComponent(client.id)}/payments/connect`}
              className="mt-7"
              method="post"
            >
              <button
                className="w-full border border-emerald-700 bg-emerald-700 px-6 py-5 text-sm font-black uppercase tracking-[0.22em] text-white transition hover:bg-emerald-600 md:w-auto"
                type="submit"
              >
                {stripeStatus === "connected"
                  ? "Review Stripe Setup"
                  : "Connect Stripe"}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Setup Notes</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold leading-6 text-slate-600">
              <p>Stripe will ask the account owner for business and bank details.</p>
              <p>TeamAlum does not store bank account details or Stripe API keys.</p>
              <p>After onboarding, return here and the status will update.</p>
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Next</h2>
            <Link
              className="mt-5 inline-flex w-full justify-center border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
              href={`/studio/${encodeURIComponent(client.id)}`}
            >
              Back to Builder
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
