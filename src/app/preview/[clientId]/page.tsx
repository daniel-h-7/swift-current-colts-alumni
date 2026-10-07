import Link from "next/link";
import { notFound } from "next/navigation";
import { EventsSlider } from "@/components/events-slider";
import { SponsorScroll } from "@/components/sponsor-scroll";
import {
  getClientFeatures,
  getPlatformClient,
  ClientFeature,
} from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { getSiteSections, SiteSectionKey } from "@/lib/site-sections";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

export default async function ClientPreviewPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { clientId } = await params;
  const client = await getPlatformClient(clientId);

  if (!client) {
    notFound();
  }

  const previewClient = client;
  const [siteContent, features, sections] = await Promise.all([
    getSiteContentForClient(previewClient.id),
    getClientFeatures(previewClient.id),
    getSiteSections(previewClient.id),
  ]);
  const featureMap = new Map(
    features.map((feature: ClientFeature) => [
      feature.feature_key,
      feature.is_enabled,
    ]),
  );
  const isSectionVisible = (sectionKey: SiteSectionKey) => {
    const section = sections.find((item) => item.section_key === sectionKey);

    if (section?.is_enabled === false) {
      return false;
    }

    if (sectionKey === "fundraising_campaigns") {
      return featureMap.get("fundraising_campaigns") === true;
    }

    return featureMap.get(sectionKey) !== false;
  };
  const visibleSections = sections.filter((section) =>
    isSectionVisible(section.section_key),
  );
  const brand = siteContent.brand;
  const heroImage = brand.heroImageUrl || "/images/stadium.jpg";
  const heroImagePosition = brand.heroImagePosition || "50% 50%";
  const joinHref = isSectionVisible("memberships")
    ? `/preview/${encodeURIComponent(previewClient.id)}/join`
    : `/studio/${previewClient.id}/content`;
  const kickerStyle = { color: brand.accentColor };

  function renderSection(sectionKey: SiteSectionKey) {
    if (sectionKey === "sponsors") {
      return (
        <section id="sponsors" className="relative isolate overflow-hidden px-6 py-16" key={sectionKey}>
          <div className="absolute inset-0 bg-[#141414]" />
          <div className="relative mx-auto max-w-7xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="program-kicker" style={kickerStyle}>Community Powered</p>
                <h2
                  className="mt-2 text-3xl font-black"
                  style={{ color: brand.accentColor }}
                >
                  Sponsors
                </h2>
              </div>
              <p className="max-w-xl text-sm font-semibold leading-6 text-gray-400">
                Showcase the partners helping the program move forward.
              </p>
            </div>
            <SponsorScroll sponsors={siteContent.sponsors} />
          </div>
        </section>
      );
    }

    if (sectionKey === "events") {
      return (
        <section id="events" className="relative isolate overflow-hidden px-6 py-16" key={sectionKey}>
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
                  Upcoming Events
                </h2>
              </div>
              <p className="max-w-md text-sm font-semibold leading-6 text-gray-400">
                Keep the alumni network moving with clean event listings.
              </p>
            </div>
            <EventsSlider events={siteContent.events} fallbackImage={heroImage} />
          </div>
        </section>
      );
    }

    if (sectionKey === "spotlights") {
      return (
        <section className="mx-auto max-w-7xl px-6 py-16" key={sectionKey}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="program-kicker" style={kickerStyle}>Alumni</p>
              <h2 className="mt-3 text-4xl font-black">Spotlights</h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-gray-400">
              Feature alumni, boosters, and supporters.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {siteContent.spotlights.map((spotlight) => (
              <article className="border border-white/10 bg-zinc-950 p-5" key={spotlight.name}>
                <h3 className="text-2xl font-black">{spotlight.name}</h3>
                <p className="mt-2 text-sm font-semibold text-gray-400">
                  {spotlight.descriptor}
                </p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (sectionKey === "fundraising_campaigns") {
      return (
        <section className="mx-auto max-w-7xl px-6 py-16" key={sectionKey}>
          <div className="rounded-[8px] border border-white/10 bg-zinc-950 p-8">
            <p className="program-kicker" style={kickerStyle}>Campaigns</p>
            <h2 className="mt-3 text-4xl font-black">Campaign Goals</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {siteContent.fundraisingCampaigns.map((campaign) => (
                <article className="border border-white/10 bg-black/35 p-5" key={campaign.title}>
                  <h3 className="text-2xl font-black">{campaign.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-gray-400">
                    {campaign.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{ backgroundColor: brand.secondaryColor }}
    >
      <div className="border-b border-amber-300/25 bg-amber-950/50 px-6 py-3 text-center text-xs font-black uppercase text-amber-100">
        Preview Mode
      </div>

      <section className="relative min-h-[82vh] overflow-hidden">
        <div
          aria-label="Site hero image"
          className="absolute inset-0 bg-cover bg-center opacity-55 saturate-125"
          role="img"
          style={{
            backgroundImage: `url("${heroImage}")`,
            backgroundPosition: heroImagePosition,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/72 to-black" />
        <div className="absolute inset-0 premium-grid opacity-35" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link className="flex items-center gap-3" href={`/studio/${previewClient.id}`}>
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
            {isSectionVisible("sponsors") ? <a href="#sponsors">Sponsors</a> : null}
            {isSectionVisible("events") ? <a href="#events">Events</a> : null}
            {isSectionVisible("memberships") ? <Link href={joinHref}>Join</Link> : null}
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[62vh] max-w-5xl items-center justify-center px-6 text-center">
          <div>
            <p
              className="text-sm font-black uppercase"
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
            <Link
              className="mt-9 inline-flex rounded-full px-6 py-4 text-sm font-black uppercase text-white transition hover:opacity-90"
              href={joinHref}
              style={{ backgroundColor: brand.primaryColor }}
            >
              Support the Program
            </Link>
          </div>
        </div>
      </section>

      {visibleSections.map((section) => renderSection(section.section_key))}
    </main>
  );
}
