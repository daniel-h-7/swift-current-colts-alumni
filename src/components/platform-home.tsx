import Image from "next/image";
import Link from "next/link";

const outcomes = [
  ["Always-on giving", "Turn every alumni visit, update, event, and email into a soft fundraising touchpoint."],
  ["Cleaner contact data", "Build a living CRM instead of chasing spreadsheets, inboxes, and half-remembered grad years."],
  ["Mailer built in", "Send polished updates that bring alumni back to the program without rebuilding lists every time."],
];

const productPillars = [
  {
    eyebrow: "01",
    title: "A professional alumni home",
    body: "Launch a branded site with sponsors, events, spotlights, memberships, campaign goals, and a clean giving path that feels worthy of the program.",
  },
  {
    eyebrow: "02",
    title: "A CRM that remembers everyone",
    body: "Every supporter can become a contact record: alumni, parents, sponsors, boosters, coaches, and community champions in one organized place.",
  },
  {
    eyebrow: "03",
    title: "A mailer that keeps the network warm",
    body: "Share wins, events, campaigns, and alumni stories with targeted lists so your program stays present all year, not just on game night.",
  },
];

const fundraisingLoop = [
  "Alumni discover the site",
  "They join, donate, RSVP, or sponsor",
  "The CRM updates automatically",
  "Campaigns and mailers bring them back",
];

const featureRows = [
  ["Site builder", "Build a polished team site without hiring a web team."],
  ["Memberships", "Collect annual support, gifts, and supporter details in one flow."],
  ["Sponsors", "Give partners a premium place to be seen."],
  ["Events", "Promote homecomings, banquets, camps, and alumni nights."],
  ["Campaigns", "Create urgency around equipment, travel, facilities, and special projects."],
  ["CRM + mailer", "Segment, message, and follow up with the people who care."],
];

const audienceCards = [
  "High school football programs",
  "Booster clubs",
  "Alumni associations",
  "Athletic departments",
];

export function PlatformHome() {
  return (
    <main className="min-h-screen bg-[#070b10] text-white">
      <section className="relative isolate min-h-[84svh] overflow-hidden">
        <Image
          alt="Football stadium lights"
          className="object-cover opacity-[0.42] saturate-125"
          fill
          priority
          src="/images/stadium.jpg"
        />
        <div className="absolute inset-0 bg-[linear-gradient(116deg,rgba(16,185,129,0.24)_0%,rgba(7,11,16,0.96)_34%,rgba(7,11,16,0.72)_68%,rgba(7,11,16,0.54)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#070b10] to-transparent" />
        <div className="absolute inset-0 premium-grid opacity-25" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-emerald-300/35 bg-emerald-300/10 text-sm font-black text-emerald-200 shadow-[0_0_34px_rgba(16,185,129,0.22)]">
              TA
            </span>
            <span>
              <span className="block text-[11px] font-black uppercase text-emerald-300">
                TeamAlum
              </span>
              <span className="mt-1 block font-black text-white">
                Alumni growth engine
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.06] px-2 py-2 text-sm font-bold text-slate-300 backdrop-blur md:flex">
            <a className="px-3 py-2 transition hover:text-white" href="#fundraising">
              Fundraising
            </a>
            <a className="px-3 py-2 transition hover:text-white" href="#crm">
              CRM
            </a>
            <a className="px-3 py-2 transition hover:text-white" href="#mailer">
              Mailer
            </a>
            <Link
              className="rounded-[6px] bg-white px-4 py-2 font-black text-slate-950 transition hover:bg-emerald-100"
              href="/studio/start"
            >
              Start
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex max-w-7xl items-center px-6 py-8 md:min-h-[52vh] md:py-10">
          <div className="max-w-5xl">
            <p className="text-sm font-black uppercase text-emerald-300">
              Passive Fundraising For Sports Alumni
            </p>
            <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[0.96] md:text-7xl">
              Your alumni network should be raising money while you sleep.
            </h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-slate-200 md:text-xl md:leading-8">
              TeamAlum gives teams a beautiful website, a practical alumni CRM,
              and a built-in mailer so every story, sponsor, event, and campaign
              keeps supporters connected and quietly moving toward the next gift.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="rounded-[8px] bg-emerald-400 px-6 py-3 text-sm font-black uppercase text-slate-950 shadow-[0_24px_70px_rgba(16,185,129,0.28)] transition hover:bg-emerald-300 md:py-4"
                href="/studio/start"
              >
                Build Your Site
              </Link>
              <a
                className="rounded-[8px] border border-white/15 bg-white/10 px-6 py-3 text-sm font-black uppercase text-white backdrop-blur transition hover:bg-white/15 md:py-4"
                href="#how"
              >
                See How It Works
              </a>
            </div>

          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
          {outcomes.map(([title, body]) => (
            <div
              className="rounded-[8px] border border-white/10 bg-white/[0.07] p-4"
              key={title}
            >
              <p className="text-sm font-black text-white">{title}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">
                {body}
              </p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center justify-center gap-3">
          {audienceCards.map((audience) => (
            <span
              className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black text-slate-200"
              key={audience}
            >
              {audience}
            </span>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase text-emerald-300">
              Built For Small Teams With Big Pride
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Stop treating alumni engagement like a once-a-year scramble.
            </h2>
          </div>
          <p className="text-base font-semibold leading-8 text-slate-300">
            Most programs already have the magic: tradition, stories, sponsors,
            families, and generations of former players. What they do not have
            is a simple system that turns that pride into repeatable engagement,
            clean data, and ongoing support.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {productPillars.map((pillar) => (
            <article
              className="rounded-[8px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
              key={pillar.title}
            >
              <p className="text-xs font-black uppercase text-emerald-300">
                {pillar.eyebrow}
              </p>
              <h3 className="mt-4 text-2xl font-black">{pillar.title}</h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="relative isolate overflow-hidden border-y border-white/10 bg-[#d8ff6a] px-6 py-20 text-slate-950"
        id="fundraising"
      >
        <div className="absolute inset-0 bg-[linear-gradient(142deg,rgba(255,255,255,0.62)_0%,rgba(216,255,106,0)_48%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase text-slate-700">
              Passive Fundraising Loop
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Give alumni more reasons to give than one desperate ask.
            </h2>
            <p className="mt-5 text-base font-bold leading-8 text-slate-700">
              Every alumni spotlight, sponsor mention, event RSVP, email click,
              and campaign update becomes part of a long-term fundraising
              motion. Less pressure. More touchpoints. Better timing.
            </p>
          </div>

          <div className="rounded-[8px] bg-slate-950 p-3 text-white shadow-[0_28px_90px_rgba(7,11,16,0.28)]">
            {fundraisingLoop.map((item, index) => (
              <div
                className="flex items-center gap-4 border-b border-white/10 px-5 py-5 last:border-b-0"
                key={item}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-300 text-sm font-black text-slate-950">
                  {index + 1}
                </span>
                <p className="text-lg font-black">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="crm" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
              <div className="rounded-[6px] bg-[#0d141c] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase text-emerald-300">
                      Alumni CRM
                    </p>
                    <h3 className="mt-2 text-2xl font-black">Supporter pipeline</h3>
                  </div>
                  <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">
                    Live
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Active Members", "164"],
                    ["Email Opt-ins", "489"],
                    ["Sponsor Leads", "23"],
                    ["Campaign Clicks", "1,208"],
                  ].map(([label, value]) => (
                    <div
                      className="flex items-center justify-between rounded-[6px] bg-white/[0.06] px-4 py-3"
                      key={label}
                    >
                      <span className="text-sm font-bold text-slate-300">
                        {label}
                      </span>
                      <span className="text-xl font-black text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-black uppercase text-emerald-300">
              Connect The Alumni You Already Have
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Your next donor is probably already in your story.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-300">
              TeamAlum turns casual supporters into organized contacts. Track
              members, gifts, sponsors, event interest, notes, tags, and opt-ins
              so follow-up becomes simple instead of heroic.
            </p>
          </div>
        </div>
      </section>

      <section
        className="border-y border-white/10 bg-white/[0.04] px-6 py-20"
        id="mailer"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase text-emerald-300">
              Mailer + Campaigns
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Stay in touch without sounding like you only show up to ask.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-300">
              Send clean updates, sponsor announcements, event reminders, alumni
              features, renewal nudges, and campaign pushes from the same system
              that stores the relationship.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Segment alumni by class year, relationship, membership, tags, or giving status.",
              "Share stories that keep the program alive between seasons.",
              "Track who opens, clicks, replies, and comes back to support.",
            ].map((line) => (
              <div
                className="rounded-[8px] border border-white/10 bg-[#101923] px-5 py-5 text-sm font-bold leading-6 text-slate-200"
                key={line}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-black uppercase text-emerald-300">
              Affordable Professional Tools
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Big-program polish without big-program overhead.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-300">
              No clunky donor portal. No stitched-together forms. No random
              spreadsheet that only one person understands. Just a focused
              alumni and booster system built for teams that need results
              without extra staff.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {featureRows.map(([title, body]) => (
              <div
                className="rounded-[8px] border border-white/10 bg-white/[0.055] p-5"
                key={title}
              >
                <h3 className="font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[8px] bg-white p-8 text-slate-950 shadow-[0_32px_120px_rgba(0,0,0,0.34)] md:p-12">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(16,185,129,0)_64%)]" />
          <div className="relative max-w-3xl">
            <p className="text-xs font-black uppercase text-emerald-700">
              Ready When You Are
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Build the alumni machine your program deserves.
            </h2>
            <p className="mt-5 text-base font-bold leading-8 text-slate-600">
              Launch the site, collect supporters, mail the list, and let team
              history start working for the future.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-[8px] bg-slate-950 px-6 py-4 text-sm font-black uppercase text-white transition hover:bg-slate-800"
                href="/studio/start"
              >
                Start Building
              </Link>
              <Link
                className="rounded-[8px] border border-slate-300 px-6 py-4 text-sm font-black uppercase text-slate-900 transition hover:border-emerald-500 hover:text-emerald-700"
                href="/hq"
              >
                TeamAlum HQ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
