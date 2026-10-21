import Link from "next/link";
import { StudioHeader } from "@/components/studio-header";
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
      number: "01",
      title: "Edit Site",
      description:
        "Keep your team's story current. Update your homepage, alumni spotlights, events and supporter information.",
      href: `${base}/content`,
      label: "Edit your site",
      enabled: true,
    },
    {
      number: "02",
      title: "CRM & Donors",
      description:
        "Your community in one place. View contacts, membership status, recorded dues, gifts and supporter activity.",
      href: `${base}/admin`,
      label: "Open team dashboard",
      enabled: operations,
    },
    {
      number: "03",
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
              key={tool.number}
              className="flex flex-col py-9 first:pl-0 last:pr-0 md:px-8 md:py-12"
            >
              <p className="font-serif text-3xl italic text-[#a18442]">
                {tool.number}
              </p>
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
