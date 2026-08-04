import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventsSlider } from "@/components/events-slider";
import { SponsorScroll } from "@/components/sponsor-scroll";
import { getMembershipSettingsForClient } from "@/lib/membership-settings";
import { getPlatformClient } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";

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

  const [siteContent, settings] = await Promise.all([
    getSiteContentForClient(client.id),
    getMembershipSettingsForClient(client.id),
  ]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-amber-300/25 bg-amber-950/50 px-6 py-3 text-center text-xs font-black uppercase tracking-[0.22em] text-amber-100">
        Preview Mode
      </div>

      <section className="relative min-h-[82vh] overflow-hidden">
        <Image
          alt="Football stadium under lights"
          className="object-cover opacity-55 saturate-125"
          fill
          priority
          src="/images/stadium.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/72 to-black" />
        <div className="absolute inset-0 premium-grid opacity-35" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link className="flex items-center gap-3" href={`/studio/${client.id}`}>
            <span className="flex h-11 w-11 items-center justify-center border border-white/25 bg-white/10 text-sm font-black">
              {client.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
                .toUpperCase()}
            </span>
            <span className="font-black">{client.name}</span>
          </Link>

          <nav className="hidden gap-5 text-sm font-black uppercase tracking-[0.16em] text-gray-300 md:flex">
            <a href="#sponsors">Sponsors</a>
            <a href="#events">Events</a>
            <a href="#join">Join</a>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[62vh] max-w-5xl items-center justify-center px-6 text-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.36em] text-emerald-300">
              Alumni and Booster Club
            </p>
            <h1 className="mt-5 text-5xl font-black leading-none md:text-7xl">
              {client.name}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-8 text-gray-200">
              {settings.join_body}
            </p>
            <Link
              className="mt-9 inline-flex border border-emerald-400/50 bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-500"
              href="#join"
            >
              Support the Program
            </Link>
          </div>
        </div>
      </section>

      <section id="sponsors" className="mx-auto max-w-7xl px-6 py-16">
        <div className="border border-white/10 bg-zinc-950 p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="program-kicker">Community Powered</p>
              <h2 className="mt-2 text-3xl font-black">Sponsors</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-gray-400">
              Showcase the partners helping the program move forward.
            </p>
          </div>
          <SponsorScroll sponsors={siteContent.sponsors} />
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="program-kicker">Gather Again</p>
            <h2 className="mt-3 text-4xl font-black">Upcoming Events</h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-6 text-gray-400">
            Keep the alumni network moving with clean event listings.
          </p>
        </div>
        <EventsSlider events={siteContent.events} />
      </section>

      <section id="join" className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="border border-white/10 bg-zinc-950 p-8">
          <p className="program-kicker">Membership</p>
          <h2 className="mt-3 text-4xl font-black">{settings.join_headline}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-7 text-gray-400">
            {settings.membership_year_label}
          </p>
          <Link
            className="mt-7 inline-flex border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white"
            href={`/studio/${client.id}/content`}
          >
            Continue Editing
          </Link>
        </div>
      </section>
    </main>
  );
}
