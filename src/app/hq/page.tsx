import Link from "next/link";
import { redirect } from "next/navigation";
import { HqHeader } from "@/components/hq-header";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ClientRow = {
  custom_domain?: string | null;
  id: string;
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
      "id, name, site_variant, primary_domain, created_at, updated_at, status, plan_key, subdomain, custom_domain, published_at",
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
      const [contacts, campaigns, settings] = await Promise.all([
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
      ]);

      return {
        ...client,
        campaignCount: campaigns.count ?? 0,
        contactCount: contacts.count ?? 0,
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
  const configuredDomains = clients.filter((client) => client.primary_domain)
    .length;
  const publishedClients = clients.filter((client) => client.published_at)
    .length;

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
              Domains
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
                  <th className="px-5 py-3">Domain</th>
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
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      {client.custom_domain ||
                        client.primary_domain ||
                        (client.subdomain
                          ? `${client.subdomain}.teamalum.com`
                          : "Not set")}
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
