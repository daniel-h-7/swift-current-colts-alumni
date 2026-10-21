import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";
function TeamToolIcon({ kind }: { kind: "site" | "contacts" | "email" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-12 w-12 text-[#a18442]"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "site" ? (
        <>
          <rect x="5" y="8" width="38" height="31" rx="3" />
          <path d="M5 17h38M11 12.5h.01M16 12.5h.01M21 12.5h.01M11 23h14v10H11zM31 23h6M31 28h6M31 33h4" />
        </>
      ) : kind === "contacts" ? (
        <>
          <rect x="5" y="6" width="38" height="36" rx="3" />
          <circle cx="16" cy="18" r="4" />
          <path d="M9 31v-2a7 7 0 0 1 14 0v2M29 16h8M29 23h8M29 30h8M11 36h26" />
        </>
      ) : (
        <>
          <rect x="4" y="10" width="40" height="29" rx="3" />
          <path d="m5 12 19 15 19-15M5 37l13-13M43 37 30 24" />
        </>
      )}
    </svg>
  );
}
export function TeamHubView({
  client,
  operations,
}: {
  client: { id: string; name: string };
  operations: boolean;
}) {
  const base = `/studio/${encodeURIComponent(client.id)}`;
  const tools = [
    {
      icon: "site" as const,
      title: "Edit Site",
      description:
        "Keep your team's story current. Update your homepage, alumni spotlights, events and supporter information.",
      href: `${base}/content`,
      label: "Edit your site",
      enabled: true,
    },
    {
      icon: "contacts" as const,
      title: "CRM & Donors",
      description:
        "Your community in one place. View contacts, membership status, recorded dues, gifts and supporter activity.",
      href: `${base}/admin`,
      label: "Open team dashboard",
      enabled: operations,
    },
    {
      icon: "email" as const,
      title: "Campaign Mailer",
      description:
        "Stay connected with your people. Build campaigns, choose your audience and manage your team's email messages.",
      href: `${base}/admin/campaigns`,
      label: "Open campaign mailer",
      enabled: operations,
    },
  ];
  return (
    <main className="min-h-screen bg-[#faf8f2] text-[#17130d]">
      <StudioHeader
        title={client.name}
        subtitle="Your team. Your community. Your next chapter."
        actions={[
          { href: `${base}/hub`, label: "Team Hub", tone: "primary" },
          { href: base, label: "Site Setup" },
          {
            href: `/preview/${encodeURIComponent(client.id)}`,
            label: "View Site",
          },
          { href: "/studio/logout", label: "Log Out" },
        ]}
      />
      <section className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#785d25]">
          Your team’s workspace
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Build your legacy.
          <br />
          <em className="text-[#94722f]">Bring your people with you.</em>
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#655c4c]">
          Three ways to move your program forward, all connected to{" "}
          {client.name}.
        </p>
        <div className="mt-12 grid divide-y divide-[#dfd7c5] border-y border-[#dfd7c5] md:grid-cols-3 md:divide-x md:divide-y-0">
          {tools.map((tool) => (
            <article
              key={tool.icon}
              className="flex flex-col py-9 first:pl-0 last:pr-0 md:px-8 md:py-12"
            >
              <TeamToolIcon kind={tool.icon} />
              <h3 className="mt-6 text-2xl font-black tracking-tight">
                {tool.title}
              </h3>
              <p className="mb-8 mt-4 flex-1 text-sm leading-7 text-[#655c4c]">
                {tool.description}
              </p>
              {tool.enabled ? (
                <Link
                  className="w-fit border-b-2 border-[#c5a45b] pb-2 text-sm font-bold hover:text-[#94722f]"
                  href={tool.href}
                >
                  {tool.label} →
                </Link>
              ) : (
                <p className="text-sm leading-6 text-[#785d25]">
                  An owner or admin account is required. Contact your team
                  administrator for access.
                </p>
              )}
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-[#655c4c]">
          Site configuration, payment connections and launch status are under{" "}
          <Link className="font-bold underline underline-offset-4" href={base}>
            Site Setup
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
