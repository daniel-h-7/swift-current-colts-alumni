import Link from "next/link";
import { EventsSlider } from "@/components/events-slider";
import { JoinForm } from "@/components/join-form";
import { SiteNotLaunched } from "@/components/site-not-launched";
import { SponsorScroll } from "@/components/sponsor-scroll";
import {
  formatMembershipAmount,
  getMembershipSettingsForClient,
} from "@/lib/membership-settings";
import {
  ClientFeature,
  getClientFeatures,
  getPlatformClientByStudioSlug,
} from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { getSiteSections, SiteSectionKey } from "@/lib/site-sections";

function isSectionVisible({
  featureMap,
  sectionKey,
  sections,
}: {
  featureMap: Map<string, boolean>;
  sectionKey: SiteSectionKey;
  sections: Awaited<ReturnType<typeof getSiteSections>>;
}) {
  const section = sections.find((item) => item.section_key === sectionKey);

  if (section?.is_enabled === false) {
    return false;
  }

  if (sectionKey === "fundraising_campaigns") {
    return featureMap.get("fundraising_campaigns") === true;
  }

  return featureMap.get(sectionKey) !== false;
}

export async function ClientSitePublic({
  clientId,
  showJoin = false,
}: {
  clientId: string;
  showJoin?: boolean;
}) {
  const client = await getPlatformClientByStudioSlug(clientId);

  if (!client?.launch_approved_at) {
    return <SiteNotLaunched siteName={client?.name} />;
  }

  const [siteContent, settings, features, sections] = await Promise.all([
    getSiteContentForClient(client.id),
    getMembershipSettingsForClient(client.id),
    getClientFeatures(client.id),
    getSiteSections(client.id),
  ]);
  const featureMap = new Map(
    features.map((feature: ClientFeature) => [
      feature.feature_key,
      feature.is_enabled,
    ]),
  );
  const brand = siteContent.brand;
  const heroImage = brand.heroImageUrl || "/images/stadium.jpg";
  const heroImagePosition = brand.heroImagePosition || "50% 50%";
  const kickerStyle = { color: brand.accentColor };
  const visibleSections = sections.filter((section) =>
    isSectionVisible({
      featureMap,
      sectionKey: section.section_key,
      sections,
    }),
  );
  const joinPath = "/join";

  if (showJoin) {
    return (
      <main
        className="min-h-screen text-white"
        style={{ backgroundColor: brand.secondaryColor }}
      >
        <section className="relative min-h-screen overflow-hidden">
          <div
            aria-label="Site hero image"
            className="absolute inset-0 bg-cover bg-center opacity-45 saturate-125"
            role="img"
            style={{
              backgroundImage: `url("${heroImage}")`,
              backgroundPosition: heroImagePosition,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/82 to-black" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `linear-gradient(115deg, ${brand.primaryColor}22 0%, transparent 34%, ${brand.accentColor}18 72%, transparent 100%)`,
            }}
          />
          <div className="absolute inset-0 premium-grid opacity-25" />

          <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
            <Link className="flex items-center gap-3" href="/">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${brand.siteTitle} logo`}
                  className="h-12 w-12 rounded-full border border-white/25 bg-white object-contain p-1"
                  src={brand.logoUrl}
                />
              ) : (
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-sm font-black"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {brand.siteTitle
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </span>
              )}
              <span className="font-black">{brand.siteTitle}</span>
            </Link>
            <Link
              className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              href="/"
            >
              Back Home
            </Link>
          </header>

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-12">
            <div className="grid flex-1 gap-10 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div className="border-l border-white/10 pl-6 lg:pt-8">
                <p className="program-kicker" style={kickerStyle}>
                  {settings.membership_year_label}
                </p>
                <div className="mt-7 border border-white/10 bg-zinc-950/80 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
                  <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                    Annual Membership
                  </p>
                  <p className="mt-2 text-3xl font-black text-white">
                    {formatMembershipAmount(settings)}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-gray-500">
                    Renews each year on the subscription date until opted out.
                  </p>
                  {!settings.join_is_open ? (
                    <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-950/40 p-3 text-sm font-bold text-red-200">
                      Membership signups are currently closed.
                    </p>
                  ) : null}
                </div>
                <div
                  className="mt-8 h-px w-56"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${brand.accentColor}, transparent)`,
                  }}
                />
              </div>

              <JoinForm
                checkoutPath={`/site/${encodeURIComponent(client.id)}/api/membership/checkout`}
                accentColor={brand.accentColor}
                headline={settings.join_headline}
                isOpen={settings.join_is_open}
                primaryColor={brand.primaryColor}
                programName={client.name}
                subtext={settings.join_body}
              />
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{ backgroundColor: brand.secondaryColor }}
    >
      <section className="relative min-h-[86vh] overflow-hidden">
        <div
          aria-label="Site hero image"
          className="absolute inset-0 bg-cover bg-center opacity-60 saturate-125"
          role="img"
          style={{
            backgroundImage: `url("${heroImage}")`,
            backgroundPosition: heroImagePosition,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/72 to-black" />
        <div className="absolute inset-0 premium-grid opacity-30" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link className="flex items-center gap-3" href="/">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${brand.siteTitle} logo`}
                className="h-12 w-12 rounded-full border border-white/25 bg-white object-contain p-1"
                src={brand.logoUrl}
              />
            ) : (
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 text-sm font-black"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {brand.siteTitle
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </span>
            )}
            <span className="font-black">{brand.siteTitle}</span>
          </Link>

          <nav className="hidden gap-5 text-sm font-black uppercase text-gray-300 md:flex">
            {visibleSections.some((section) => section.section_key === "sponsors") ? (
              <a href="#sponsors">Sponsors</a>
            ) : null}
            {visibleSections.some((section) => section.section_key === "events") ? (
              <a href="#events">Events</a>
            ) : null}
            {featureMap.get("memberships") !== false ? (
              <Link href={joinPath}>Join</Link>
            ) : null}
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[62vh] max-w-5xl items-center justify-center px-6 text-center">
          <div>
            <p
              className="text-sm font-black uppercase tracking-[0.28em]"
              style={{ color: brand.accentColor }}
            >
              {brand.heroKicker}
            </p>
            <h1 className="mt-5 text-5xl font-black leading-none md:text-7xl">
              {brand.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-8 text-gray-200">
              {brand.heroBody}
            </p>
            {featureMap.get("memberships") !== false ? (
              <Link
                className="mt-9 inline-flex rounded-full px-6 py-4 text-sm font-black uppercase text-white transition hover:opacity-90"
                href={joinPath}
                style={{ backgroundColor: brand.primaryColor }}
              >
                Support the Program
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {visibleSections.map((section) => {
          if (section.section_key === "sponsors") {
            return (
              <section className="relative isolate overflow-hidden px-6 py-16" id="sponsors" key={section.section_key}>
                <div className="absolute inset-0 bg-[#141414]" />
                <div className="relative mx-auto max-w-7xl">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="program-kicker" style={kickerStyle}>Community Powered</p>
                      <h2
                        className="mt-3 text-4xl font-black"
                        style={{ color: brand.accentColor }}
                      >
                        Sponsors
                      </h2>
                    </div>
                    <p className="max-w-xl text-sm font-semibold leading-6 text-gray-300">
                      Showcase the partners helping the program move forward.
                    </p>
                  </div>
                  <SponsorScroll sponsors={siteContent.sponsors} />
                </div>
              </section>
            );
          }

          if (section.section_key === "events") {
            return (
              <section className="relative isolate overflow-hidden px-6 py-16" id="events" key={section.section_key}>
                <div className="absolute inset-0 bg-[#141414]" />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-2"
                  style={{ backgroundColor: brand.accentColor }}
                />
                <div className="relative mx-auto max-w-7xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="program-kicker" style={kickerStyle}>Gather Again</p>
                      <h2
                        className="mt-3 text-4xl font-black"
                        style={{ color: brand.accentColor }}
                      >
                        Events
                      </h2>
                    </div>
                    <p className="max-w-md text-sm font-semibold leading-6 text-gray-300">
                      Keep the alumni network moving with clean event listings.
                    </p>
                  </div>
                  <EventsSlider
                    events={siteContent.events}
                    fallbackImage={heroImage}
                  />
                </div>
              </section>
            );
          }

          return null;
        })}
    </main>
  );
}
