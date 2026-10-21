import { studioLoginPath } from "@/lib/studio-navigation";
import Link from "next/link";
import { SiteAdminLink } from "@/components/site-admin-link";
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

          <header className="relative z-10 mx-auto flex max-w-7xl flex-wrap gap-4 items-center justify-between px-6 py-6">
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
            <div className="flex flex-wrap items-center justify-end gap-3">
            <SiteAdminLink href={studioLoginPath(`/studio/${encodeURIComponent(client.id)}`)} />
            <Link
              className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
              href="/"
            >
              Back Home
            </Link>
            </div>
          </header>

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-12">
            <div className="grid flex-1 gap-10 py-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div className="lg:pt-8">
                <p className="program-kicker" style={kickerStyle}>
                  {settings.membership_year_label}
                </p>
                <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">Your story.<br /><span className="font-serif italic font-normal">Our next chapter.</span></h1>
                <p className="mt-6 max-w-sm text-lg leading-8 text-gray-300">Stay connected to the people, the memories, and the program. Help build what comes next.</p>
                <div className="mt-9 border-t border-white/25 pt-6">
                  <p className="text-xs font-black uppercase tracking-[3px] text-gray-300">
                    Annual Membership
                  </p>
                  <p className="mt-2 text-5xl font-black text-white">
                    {formatMembershipAmount(settings)}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-gray-300">
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

        <header className="relative z-10 mx-auto flex max-w-7xl flex-wrap gap-4 items-center justify-between px-6 py-6">
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

          <div className="flex flex-wrap items-center justify-end gap-5">
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
          <SiteAdminLink href={studioLoginPath(`/studio/${encodeURIComponent(client.id)}`)} />
          </div>
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
                    placeholderImage={brand.logoUrl}
                  />
                </div>
              </section>
            );
          }

          if (section.section_key === "fundraising_campaigns") {
            return (
              <section className="relative isolate overflow-hidden px-6 py-16" key={section.section_key}>
                <div className="absolute inset-0 bg-[#141414]" />
                <div className="relative mx-auto max-w-7xl">
                  <p className="program-kicker" style={kickerStyle}>
                    Campaigns
                  </p>
                  <h2
                    className="mt-3 text-4xl font-black"
                    style={{ color: brand.accentColor }}
                  >
                    Campaign Goals
                  </h2>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {siteContent.fundraisingCampaigns.map((campaign) => (
                      <article
                        className="border border-white/10 bg-black/35 p-5"
                        key={campaign.title}
                      >
                        <p
                          className="text-xs font-black uppercase tracking-[0.18em]"
                          style={kickerStyle}
                        >
                          {campaign.eyebrow}
                        </p>
                        <h3 className="mt-2 text-2xl font-black">
                          {campaign.title}
                        </h3>
                        {campaign.description ? (
                          <p className="mt-2 text-sm font-semibold leading-6 text-gray-400">
                            {campaign.description}
                          </p>
                        ) : null}
                        <div className="mt-6">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-3xl font-black text-white">
                                {campaign.raisedLabel}
                              </p>
                              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-gray-300">
                                {campaign.goalLabel}
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-200">
                              {campaign.progressPercent}%
                            </p>
                          </div>
                          <div className="mt-4 h-3 overflow-hidden bg-white/10">
                            <div
                              className="h-full"
                              style={{
                                backgroundColor: brand.accentColor,
                                width: `${campaign.progressPercent}%`,
                              }}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })}
    </main>
  );
}
