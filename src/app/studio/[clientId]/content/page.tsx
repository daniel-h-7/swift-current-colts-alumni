import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StudioHeader } from "@/components/studio-header";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { canAccessStudioClient, getStudioSession } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

type PageSearchParams = {
  error?: string;
  saved?: string;
};

const fieldClass =
  "mt-2 w-full rounded-[8px] border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

const areaClass = `${fieldClass} min-h-28`;

const setupSections = [
  {
    body: "Name, logo, colors, and the first thing visitors read.",
    label: "Brand",
    status: "Now",
  },
  {
    body: "Sponsors, events, spotlights, and campaign starters.",
    label: "Content",
    status: "Now",
  },
  {
    body: "Review the generated site before domain and payment setup.",
    label: "Preview",
    status: "Final",
  },
];

function row<T>(items: T[], index: number, fallback: T) {
  return items[index] ?? fallback;
}

export default async function StudioContentSetupPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const { clientId } = await params;
  const { error, saved } = await searchParams;
  const session = await getStudioSession();

  if (!session) {
    redirect(`/studio/login?error=${encodeURIComponent("Log in to edit your site.")}`);
  }

  if (!(await canAccessStudioClient(clientId))) {
    redirect(`/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`);
  }

  const client = await getPlatformClient(clientId);

  if (!client) {
    notFound();
  }

  const siteContent = await getSiteContentForClient(client.id);
  const previewHref = `/preview/${encodeURIComponent(client.id)}`;
  const action = `/studio/${encodeURIComponent(client.id)}/content/save`;
  const brand = siteContent.brand;
  const sponsors = [
    row(siteContent.sponsors, 0, { imageUrl: "", linkUrl: "", name: "" }),
    row(siteContent.sponsors, 1, { imageUrl: "", linkUrl: "", name: "" }),
    row(siteContent.sponsors, 2, { imageUrl: "", linkUrl: "", name: "" }),
  ];
  const events = [
    row(siteContent.events, 0, {
      date: "",
      linkLabel: "Details",
      linkUrl: "",
      notes: "",
      title: "",
    }),
    row(siteContent.events, 1, {
      date: "",
      linkLabel: "Details",
      linkUrl: "",
      notes: "",
      title: "",
    }),
  ];
  const spotlight = row(siteContent.spotlights, 0, {
    classYear: "",
    descriptor: "",
    imageClass: "object-center",
    imageUrl: "",
    name: "",
  });
  const campaign = row(siteContent.fundraisingCampaigns, 0, {
    buttonLabel: "Support the Program",
    buttonUrl: "/join",
    description: "",
    eyebrow: "Current Campaign",
    goalLabel: "",
    progressPercent: 25,
    raisedLabel: "",
    title: "",
  });

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
        <form action={action} className="space-y-6" method="post">
          {saved ? (
            <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Site content saved. Preview is updated.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          ) : null}

          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-black">Brand and Hero</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  This is the fast setup layer: what the site is called, what
                  it says first, and the colors the template should use.
                </p>
              </div>
              <button
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-emerald-700"
                type="submit"
              >
                Save Content
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">
                Site Title
                <input
                  className={fieldClass}
                  defaultValue={brand.siteTitle}
                  name="site_title"
                  placeholder="Swift Current Colts Football"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Hero Kicker
                <input
                  className={fieldClass}
                  defaultValue={brand.heroKicker}
                  name="hero_kicker"
                  placeholder="Alumni and Booster Club"
                />
              </label>
              <label className="text-sm font-bold text-slate-700 md:col-span-2">
                Hero Headline
                <input
                  className={fieldClass}
                  defaultValue={brand.heroTitle}
                  name="hero_title"
                  placeholder="Build the legacy."
                />
              </label>
              <label className="text-sm font-bold text-slate-700 md:col-span-2">
                Hero Body
                <textarea
                  className={areaClass}
                  defaultValue={brand.heroBody}
                  name="hero_body"
                  placeholder="A short paragraph that explains why alumni should join, give, sponsor, or come back."
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Logo URL
                <input
                  className={fieldClass}
                  defaultValue={brand.logoUrl}
                  name="logo_url"
                  placeholder="/images/team-gridiron-shield.svg"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Hero Image URL
                <input
                  className={fieldClass}
                  defaultValue={brand.heroImageUrl}
                  name="hero_image_url"
                  placeholder="/images/stadium.jpg"
                />
              </label>
              <label className="text-sm font-bold text-slate-700">
                Primary Color
                <div className="mt-2 grid grid-cols-[56px_minmax(0,1fr)] border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25">
                  <input
                    aria-label="Primary color picker"
                    className="h-full min-h-12 w-full border-r border-slate-300 bg-white p-1"
                    defaultValue={brand.primaryColor.startsWith("#") ? brand.primaryColor : "#047857"}
                    name="primary_color_picker"
                    type="color"
                  />
                  <input
                    className="min-w-0 px-4 py-3 text-slate-950 outline-none"
                    defaultValue={brand.primaryColor}
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
                    defaultValue={brand.secondaryColor.startsWith("#") ? brand.secondaryColor : "#0f172a"}
                    name="secondary_color_picker"
                    type="color"
                  />
                  <input
                    className="min-w-0 px-4 py-3 text-slate-950 outline-none"
                    defaultValue={brand.secondaryColor}
                    name="secondary_color"
                    placeholder="#0f172a or rgb(15, 23, 42)"
                  />
                </div>
              </label>
              <label className="text-sm font-bold text-slate-700">
                Accent Color
                <div className="mt-2 grid grid-cols-[56px_minmax(0,1fr)] border border-slate-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus:ring-emerald-500/25">
                  <input
                    aria-label="Accent color picker"
                    className="h-full min-h-12 w-full border-r border-slate-300 bg-white p-1"
                    defaultValue={brand.accentColor.startsWith("#") ? brand.accentColor : "#10b981"}
                    name="accent_color_picker"
                    type="color"
                  />
                  <input
                    className="min-w-0 px-4 py-3 text-slate-950 outline-none"
                    defaultValue={brand.accentColor}
                    name="accent_color"
                    placeholder="#10b981 or rgb(16, 185, 129)"
                  />
                </div>
              </label>
            </div>
          </section>

          <section
            className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm"
            id="homepage-blocks"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-black">Starter Homepage Content</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Enough to launch a clean first version. The deeper editor can
                  grow from here.
                </p>
              </div>
              <Link
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black uppercase text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
                href={previewHref}
              >
                Preview
              </Link>
            </div>

            <div className="mt-6 space-y-8">
              <div>
                <h3 className="font-black">Sponsors</h3>
                <div className="mt-4 grid gap-4">
                  {sponsors.map((sponsor, index) => (
                    <div className="grid gap-3 md:grid-cols-3" key={index}>
                      <input
                        className={fieldClass}
                        defaultValue={sponsor.name}
                        name={`sponsor_${index + 1}_name`}
                        placeholder={`Sponsor ${index + 1} name`}
                      />
                      <input
                        className={fieldClass}
                        defaultValue={sponsor.linkUrl}
                        name={`sponsor_${index + 1}_link_url`}
                        placeholder="Website URL"
                      />
                      <input
                        className={fieldClass}
                        defaultValue={sponsor.imageUrl}
                        name={`sponsor_${index + 1}_image_url`}
                        placeholder="Logo URL"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-black">Events</h3>
                <div className="mt-4 grid gap-4">
                  {events.map((event, index) => (
                    <div className="grid gap-3 md:grid-cols-[1fr_180px] md:items-start" key={index}>
                      <div>
                        <input
                          className={fieldClass}
                          defaultValue={event.title}
                          name={`event_${index + 1}_title`}
                          placeholder={`Event ${index + 1} title`}
                        />
                        <textarea
                          className={areaClass}
                          defaultValue={event.notes}
                          name={`event_${index + 1}_notes`}
                          placeholder="Short event description"
                        />
                      </div>
                      <div>
                        <input
                          className={fieldClass}
                          defaultValue={event.date}
                          name={`event_${index + 1}_date`}
                          placeholder="Date"
                        />
                        <input
                          className={fieldClass}
                          defaultValue={event.linkUrl}
                          name={`event_${index + 1}_link_url`}
                          placeholder="Registration URL"
                        />
                        <input
                          className={fieldClass}
                          defaultValue={event.linkLabel}
                          name={`event_${index + 1}_link_label`}
                          placeholder="Details"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-black">Alumni Spotlight</h3>
                  <input
                    className={fieldClass}
                    defaultValue={spotlight.name}
                    name="spotlight_name"
                    placeholder="Name"
                  />
                  <input
                    className={fieldClass}
                    defaultValue={spotlight.classYear}
                    name="spotlight_class_year"
                    placeholder="Class year or role"
                  />
                  <input
                    className={fieldClass}
                    defaultValue={spotlight.descriptor}
                    name="spotlight_descriptor"
                    placeholder="Short description"
                  />
                  <input
                    className={fieldClass}
                    defaultValue={spotlight.imageUrl}
                    name="spotlight_image_url"
                    placeholder="Photo URL"
                  />
                </div>

                <div>
                  <h3 className="font-black">Campaign</h3>
                  <input
                    className={fieldClass}
                    defaultValue={campaign.title}
                    name="campaign_title"
                    placeholder="Campaign title"
                  />
                  <textarea
                    className={areaClass}
                    defaultValue={campaign.description}
                    name="campaign_description"
                    placeholder="Campaign description"
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className={fieldClass}
                      defaultValue={campaign.raisedLabel}
                      name="campaign_raised_label"
                      placeholder="$6,250"
                    />
                    <input
                      className={fieldClass}
                      defaultValue={campaign.goalLabel}
                      name="campaign_goal_label"
                      placeholder="Raised of $25,000"
                    />
                  </div>
                  <input
                    className={fieldClass}
                    defaultValue={campaign.progressPercent}
                    max="100"
                    min="0"
                    name="campaign_progress_percent"
                    placeholder="25"
                    type="number"
                  />
                </div>
              </div>
            </div>
          </section>

          <button
            className="w-full rounded-full bg-emerald-700 px-6 py-5 text-center text-sm font-black uppercase text-white shadow-sm transition hover:bg-emerald-600"
            type="submit"
          >
            Save and Continue to Preview
          </button>
        </form>

        <aside className="space-y-6">
          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Setup Path</h2>
            <div className="mt-5 space-y-3">
              {setupSections.map((section, index) => (
                <div
                  className="flex gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4"
                  key={section.label}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black">{section.label}</h3>
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.62rem] font-black uppercase text-slate-500">
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

          <section className="rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Finish</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Preview the site, then launch once uploads, content, Stripe, and
              domain setup are complete.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                className="w-full rounded-full border border-emerald-700 bg-emerald-700 px-5 py-4 text-center font-black uppercase text-white transition hover:bg-emerald-600"
                href={previewHref}
              >
                Preview Site
              </Link>
              <button
                className="w-full cursor-not-allowed rounded-full border border-slate-300 bg-slate-200 px-5 py-4 font-black uppercase text-slate-500"
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
