import Image from "next/image";
import Link from "next/link";
import { EventsSlider } from "@/components/events-slider";
import { PublicNav } from "@/components/public-nav";
import { SponsorScroll } from "@/components/sponsor-scroll";
import { getSiteBrand } from "@/lib/site-brand";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

function getSpotlightImageClass(name: string, savedClass: string) {
  if (name.trim().toLowerCase() === "gerry inglis") {
    return "origin-[23%_23%] object-[23%_23%] scale-[2.75]";
  }

  return savedClass;
}

export default async function Home() {
  const brand = getSiteBrand();
  const siteContent = await getSiteContent();

  return (
    <main className={`min-h-screen bg-black text-white ${brand.isDemo ? "demo-public" : ""}`}>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className={`object-cover object-center opacity-95 contrast-110 md:scale-110 md:object-[center_42%] ${
            brand.isDemo ? "grayscale saturate-0" : "saturate-125"
          }`}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-blue-950/18 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.48)_0%,rgba(0,0,0,0.25)_36%,rgba(0,0,0,0.1)_62%,rgba(0,0,0,0.24)_100%)] md:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0.2)_34%,rgba(0,0,0,0.04)_62%,rgba(0,0,0,0.14)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.42),transparent_68%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 premium-grid opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(37,99,235,0.2)_0%,transparent_34%,rgba(220,38,38,0.18)_70%,transparent_100%)]" />

        <PublicNav />

        <div className="relative z-10 flex min-h-[68vh] items-center justify-center px-6 text-center">
          <div className="max-w-5xl">
            <p className={`mb-5 text-sm font-black uppercase tracking-[8px] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] ${brand.isDemo ? "text-gray-200" : "text-red-400"}`}>
              {brand.heroKicker}
            </p>

            <h2 className="text-6xl font-black leading-none text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)] md:text-8xl">
              {brand.heroLineOne}
              <span className={`block drop-shadow-[0_0_26px_rgba(37,99,235,0.55)] ${brand.isDemo ? "text-gray-300" : "text-blue-400"}`}>
                {brand.heroLineTwo}
              </span>
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-lg font-semibold leading-8 text-gray-100 drop-shadow-[0_3px_18px_rgba(0,0,0,0.95)] md:text-2xl">
              {brand.heroBody}
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/join" className="premium-button">
                {brand.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="sponsors" className="section-rule mx-auto max-w-7xl px-6 pb-20 pt-8">
        <div className="overflow-hidden border border-blue-300/25 bg-[linear-gradient(135deg,rgba(37,99,235,0.94)_0%,rgba(18,42,105,0.92)_36%,rgba(8,12,24,0.98)_73%,rgba(0,0,0,0.98)_100%)] p-8 shadow-[0_28px_90px_rgba(37,99,235,0.22)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[5px] text-blue-100/80">{brand.sponsorEyebrow}</p>
              <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">{brand.sponsorTitle}</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-blue-50/85">
              {brand.sponsorCopy}
            </p>
          </div>

          <SponsorScroll sponsors={siteContent.sponsors} />
        </div>
      </section>

      <section id="alumni" className="section-rule relative isolate overflow-hidden px-6 py-24">
        <div
          aria-hidden="true"
          className="alumni-logo-mask alumni-logo-sc absolute left-[-2rem] top-10 hidden h-72 w-72 bg-red-600/24 md:block"
        />
        <div
          aria-hidden="true"
          className="alumni-logo-mask alumni-logo-horseshoe absolute right-[-3rem] top-14 hidden h-72 w-72 bg-red-600/24 md:block"
        />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-red-950/20 to-transparent" />
        <div className="absolute inset-0 premium-grid opacity-20" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="program-kicker">Colts Family</p>
              <h2 className="mt-3 text-4xl font-black md:text-5xl">Alumni Spotlights</h2>
            </div>
            <p className="max-w-lg text-sm font-semibold leading-6 text-gray-400">
              {brand.alumniSectionCopy}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {siteContent.spotlights.map((spotlight) => (
              <article key={spotlight.name} className="group border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(9,9,11,0.96))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.36)] transition hover:-translate-y-1 hover:border-blue-400/35">
                <div className="relative h-72 overflow-hidden border border-white/10 bg-gradient-to-br from-blue-950 to-red-950">
                  <Image
                    src={spotlight.imageUrl}
                    alt={`${spotlight.name} headshot`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={`object-cover ${getSpotlightImageClass(spotlight.name, spotlight.imageClass)} grayscale-[18%] transition duration-300`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                </div>
                <div className="border-x border-b border-white/10 px-5 py-5">
                  <h3 className="text-2xl font-black">{spotlight.name}</h3>
                  {spotlight.classYear ? (
                    <p className="mt-1 text-sm font-semibold italic text-red-400">{spotlight.classYear}</p>
                  ) : null}
                  <p className="mt-4 border-t border-white/10 pt-4 text-xs font-black uppercase tracking-[2px] text-gray-400">
                    {spotlight.descriptor}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="section-rule mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="program-kicker">Gather Again</p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">Upcoming Events</h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-gray-400">
            Keep the alumni network moving with clean, scannable event listings.
          </p>
        </div>

        <EventsSlider events={siteContent.events} />
      </section>

      <footer className="border-t border-white/10 px-6 py-12 text-center text-gray-500">
        <p className="font-bold text-white">{brand.metaTitle}</p>
        <p className="mt-2">{brand.footerLocation}</p>
      </footer>
    </main>
  );
}
