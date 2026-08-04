import Link from "next/link";
import { notFound } from "next/navigation";
import { StudioHeader } from "@/components/studio-header";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

const fieldClass =
  "mt-2 w-full border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

const setupSections = [
  {
    body: "Upload a square logo for nav, social previews, and default marks.",
    label: "Square Logo",
    status: "Next",
  },
  {
    body: "Add a strong hero image for the top of the public site.",
    label: "Hero Photo",
    status: "Next",
  },
  {
    body: "Choose primary, secondary, and accent colors for the template.",
    label: "Site Colors",
    status: "Next",
  },
  {
    body: "Review the generated site and publish when everything is ready.",
    label: "Launch Preview",
    status: "Final",
  },
];

export default async function StudioContentSetupPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { clientId } = await params;
  const client = await getPlatformClient(clientId);

  if (!client) {
    notFound();
  }

  const siteContent = await getSiteContentForClient(client.id);
  const previewHref = `/preview/${encodeURIComponent(client.id)}`;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <StudioHeader
        actions={[
          { href: `/studio/${client.id}`, label: "Builder" },
          { href: previewHref, label: "Preview Site", tone: "primary" },
        ]}
        subtitle="Add the brand assets and homepage content needed to launch."
        title={`${client.name} Content Setup`}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Brand Assets</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              File uploads will be wired to Supabase Storage next. For now,
              capture the setup requirements and continue through the launch
              path.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                Square Logo
                <input
                  accept="image/*"
                  className={fieldClass}
                  name="logo"
                  type="file"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Hero Photo
                <input
                  accept="image/*"
                  className={fieldClass}
                  name="hero_photo"
                  type="file"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Primary Color
                <div className="mt-2 grid grid-cols-[56px_minmax(0,1fr)] border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
                  <input
                    aria-label="Primary color picker"
                    className="h-full min-h-12 w-full border-r border-slate-300 bg-white p-1"
                    defaultValue="#047857"
                    name="primary_color_picker"
                    type="color"
                  />
                  <input
                    className="min-w-0 px-4 py-3 text-slate-950 outline-none"
                    defaultValue="#047857"
                    name="primary_color"
                    placeholder="#047857 or rgb(4, 120, 87)"
                  />
                </div>
              </label>
              <label className="text-sm font-bold text-slate-700">
                Secondary Color
                <div className="mt-2 grid grid-cols-[56px_minmax(0,1fr)] border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
                  <input
                    aria-label="Secondary color picker"
                    className="h-full min-h-12 w-full border-r border-slate-300 bg-white p-1"
                    defaultValue="#0f172a"
                    name="secondary_color_picker"
                    type="color"
                  />
                  <input
                    className="min-w-0 px-4 py-3 text-slate-950 outline-none"
                    defaultValue="#0f172a"
                    name="secondary_color"
                    placeholder="#0f172a or rgb(15, 23, 42)"
                  />
                </div>
              </label>
            </div>
          </section>

          <a
            className="block w-full border border-emerald-700 bg-emerald-700 px-6 py-5 text-center text-sm font-black uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-emerald-600"
            href="#homepage-blocks"
          >
            Continue to Edit Site Content
          </a>

          <section
            className="border border-slate-200 bg-white p-6 shadow-sm"
            id="homepage-blocks"
          >
            <h2 className="text-xl font-black">Homepage Blocks</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {[
                ["Sponsors", siteContent.sponsors.length],
                ["Events", siteContent.events.length],
                ["Spotlights", siteContent.spotlights.length],
                ["Campaigns", siteContent.fundraisingCampaigns.length],
              ].map(([label, value]) => (
                <div className="border border-slate-200 bg-slate-50 p-4" key={label}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-black">Sponsors</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Add sponsor names, logos, and links.
                </p>
                <span className="mt-4 inline-flex border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Coming Next
                </span>
              </div>
              <div className="border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-black">Events</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Add event dates, details, and registration links.
                </p>
                <span className="mt-4 inline-flex border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Coming Next
                </span>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Setup Path</h2>
            <div className="mt-5 space-y-3">
              {setupSections.map((section, index) => (
                <div
                  className="flex gap-3 border border-slate-200 bg-slate-50 p-4"
                  key={section.label}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{section.label}</h3>
                      <span className="border border-slate-200 bg-white px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-500">
                        {section.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {section.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Finish</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Preview the site, then launch once uploads, content, Stripe, and
              domain setup are complete.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                className="w-full border border-emerald-700 bg-emerald-700 px-5 py-4 text-center font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-600"
                href={previewHref}
              >
                Preview Site
              </Link>
              <button
                className="w-full cursor-not-allowed border border-slate-300 bg-slate-200 px-5 py-4 font-black uppercase tracking-[0.2em] text-slate-500"
                disabled
                type="button"
              >
                Launch Site
              </button>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
