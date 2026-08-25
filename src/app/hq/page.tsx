import Link from "next/link";
import { redirect } from "next/navigation";
import { HqHeader } from "@/components/hq-header";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ClientRow = {
  custom_domain?: string | null;
  id: string;
  launch_approved_at?: string | null;
  launch_review_requested_at?: string | null;
  name: string;
  plan_key?: string | null;
  primary_domain: string | null;
  published_at?: string | null;
  site_variant: string;
  status?: string | null;
  subdomain?: string | null;
  created_at: string;
  updated_at: string;
};

type ClientSummary = ClientRow & {
  campaignCount: number;
  contactCount: number;
  ownerEmail: string | null;
  settingsUpdatedAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getClientSummaries() {
  const supabase = createServerSupabaseClient();

  let clientsData: ClientRow[] | null = null;
  let queryError: { message: string } | null = null;

  const expandedResult = await supabase
    .from("clients")
    .select(
      "id, name, site_variant, primary_domain, created_at, updated_at, status, plan_key, subdomain, custom_domain, published_at, launch_approved_at, launch_review_requested_at",
    )
    .order("name", { ascending: true });

  clientsData = expandedResult.data as ClientRow[] | null;
  queryError = expandedResult.error;

  if (queryError && queryError.message.includes("schema cache")) {
    const fallback = await supabase
      .from("clients")
      .select("id, name, site_variant, primary_domain, created_at, updated_at")
      .order("name", { ascending: true });

    clientsData = fallback.data as ClientRow[] | null;
    queryError = fallback.error;
  }

  if (queryError) {
    throw new Error(queryError.message);
  }

  const clients = clientsData ?? [];

  return Promise.all(
    clients.map(async (client) => {
      const [contacts, campaigns, settings, owner] = await Promise.all([
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client.id),
        supabase
          .from("campaigns")
          .select("id", { count: "exact", head: true })
          .eq("client_id", client.id),
        supabase
          .from("crm_settings")
          .select("updated_at")
          .eq("client_id", client.id)
          .eq("id", "default")
          .maybeSingle(),
        supabase
          .from("client_users")
          .select("email")
          .eq("client_id", client.id)
          .eq("role", "owner")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        ...client,
        campaignCount: campaigns.count ?? 0,
        contactCount: contacts.count ?? 0,
        ownerEmail: owner.data?.email ?? null,
        settingsUpdatedAt: settings.data?.updated_at ?? null,
      } satisfies ClientSummary;
    }),
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load TeamAlum HQ.";
}

export default async function HqHomePage() {
  if (!(await isHqAuthenticated())) {
    redirect("/hq/login");
  }

  let clients: ClientSummary[] = [];
  let errorMessage = "";

  try {
    clients = await getClientSummaries();
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  const totalContacts = clients.reduce(
    (total, client) => total + client.contactCount,
    0,
  );
  const configuredDomains = clients.filter((client) => client.subdomain || client.id)
    .length;
  const publishedClients = clients.filter((client) => client.launch_approved_at)
    .length;
  const awaitingApprovalClients = clients.filter(
    (client) =>
      client.launch_review_requested_at && !client.launch_approved_at,
  );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <HqHeader
        actions={[
          { href: "/hq", label: "Clients", tone: "primary" },
          { href: "/hq/clients/new", label: "New Client" },
          { href: "/hq/logout", label: "Log Out", tone: "danger" },
        ]}
        subtitle="Manage tenant metadata and shared settings across every TeamAlum client."
        title="Client Console"
      />

      <section className="mx-auto max-w-7xl px-6 py-8">
        {errorMessage ? (
          <div className="border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Clients
            </p>
            <p className="mt-2 text-3xl font-black">{clients.length}</p>
          </div>
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Contacts
            </p>
            <p className="mt-2 text-3xl font-black">{totalContacts}</p>
          </div>
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              TeamAlum URLs
            </p>
            <p className="mt-2 text-3xl font-black">{configuredDomains}</p>
          </div>
          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
              Published
            </p>
            <p className="mt-2 text-3xl font-black">{publishedClients}</p>
          </div>
        </div>

        <div className="mt-8 border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
                  Launch Queue
                </p>
                <h2 className="mt-1 text-lg font-black">
                  Awaiting TeamAlum Approval
                </h2>
              </div>
              <p className="text-sm font-black text-amber-800">
                {awaitingApprovalClients.length} pending
              </p>
            </div>
          </div>

          {awaitingApprovalClients.length ? (
            <div className="divide-y divide-slate-200">
              {awaitingApprovalClients.map((client) => (
                <div
                  className="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.7fr)_minmax(260px,auto)] lg:items-center"
                  key={client.id}
                >
                  <div>
                    <p className="font-black text-slate-950">{client.name}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {client.id}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Owner: {client.ownerEmail ?? "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Submitted
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      {formatDate(client.launch_review_requested_at ?? null)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      className="inline-flex border border-slate-300 bg-white px-3 py-2 font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                      href={`/preview/${encodeURIComponent(client.id)}`}
                    >
                      Preview
                    </Link>
                    <Link
                      className="inline-flex border border-blue-200 bg-blue-50 px-3 py-2 font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                      href={`/hq/clients/${encodeURIComponent(client.id)}`}
                    >
                      Open
                    </Link>
                    <form
                      action={`/hq/clients/${encodeURIComponent(client.id)}/approve-launch`}
                      method="post"
                    >
                      <button
                        className="inline-flex border border-emerald-700 bg-emerald-700 px-3 py-2 font-black text-white transition hover:bg-emerald-600"
                        type="submit"
                      >
                        Approve
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm font-bold text-slate-500">
              No sites are waiting for launch approval.
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-black">Clients</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Variant</th>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Launch</th>
                  <th className="px-5 py-3">TeamAlum URL</th>
                  <th className="px-5 py-3">Contacts</th>
                  <th className="px-5 py-3">Campaigns</th>
                  <th className="px-5 py-3">Settings</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clients.map((client) => (
                  <tr className="align-top" key={client.id}>
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-950">{client.name}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {client.id}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {client.site_variant}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {client.plan_key ?? "starter"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {client.status ?? "active"}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      <span
                        className={
                          client.launch_approved_at
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }
                      >
                        {client.launch_approved_at ? "Approved" : "Parked"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {`${client.subdomain || client.id}.teamalum.com`}
                    </td>
                    <td className="px-5 py-4 font-black">
                      {client.contactCount}
                    </td>
                    <td className="px-5 py-4 font-black">
                      {client.campaignCount}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(client.settingsUpdatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        className="inline-flex border border-blue-200 bg-blue-50 px-3 py-2 font-black text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                        href={`/hq/clients/${encodeURIComponent(client.id)}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!clients.length && !errorMessage ? (
            <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
              No clients found in the shared database.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
