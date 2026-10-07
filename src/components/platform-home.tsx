import Image from "next/image";
import Link from "next/link";

const proofPoints = [
  ["Alumni CRM", "Every supporter, sponsor, parent, and former player in one clean place."],
  ["Mailer", "Send updates, campaigns, renewals, and alumni stories without rebuilding lists."],
  ["Passive fundraising", "Turn regular engagement into more chances to give, join, sponsor, and show up."],
];

const rhythm = [
  "Publish the site",
  "Grow the list",
  "Tell better stories",
  "Raise money year-round",
];

const tools = [
  "Site builder",
  "Alumni CRM",
  "Email mailer",
  "Campaigns",
  "Memberships",
  "Sponsors",
  "Events",
  "Payments",
];

const campaignStats = [
  ["489", "reachable alumni"],
  ["68%", "opened last mailer"],
  ["23", "warm sponsor leads"],
];

export function PlatformHome() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#17130d]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-10 w-10 items-center justify-center border border-[#c5a45b] bg-[#17130d] text-sm font-black text-[#d9bd72]">
            TA
          </span>
          <span className="text-base font-black">TeamAlum</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-[#62563f] md:flex">
          <a className="transition hover:text-[#17130d]" href="#crm">
            CRM
          </a>
          <a className="transition hover:text-[#17130d]" href="#fundraising">
            Fundraising
          </a>
          <a className="transition hover:text-[#17130d]" href="#mailer">
            Mailer
          </a>
          <Link
            className="rounded-full bg-[#17130d] px-5 py-3 text-[#f8f1df] transition hover:bg-[#2a2114]"
            href="/studio/start"
          >
            Start building
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-12 pt-8 md:gap-12 md:pb-16 md:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase text-[#8b6f2f]">
            Alumni engagement for teams
          </p>
          <h1 className="mt-5 max-w-5xl text-5xl font-black leading-[0.96] md:text-7xl">
            Turn pride into momentum.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-[#665a43]">
            TeamAlum gives every program a polished home to collect alumni
            memberships that boost funds for your program, a practical alumni
            CRM, and a built-in mailer so supporters stay close all year.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[#c5a45b] px-6 py-4 text-sm font-black uppercase text-[#17130d] transition hover:bg-[#d6bb73]"
              href="/studio/start"
            >
              Build your site
            </Link>
            <a
              className="rounded-full border border-[#b7a57b] px-6 py-4 text-sm font-black uppercase text-[#17130d] transition hover:border-[#8b6f2f] hover:text-[#8b6f2f]"
              href="#how"
            >
              See the flow
            </a>
          </div>
        </div>

        <div className="relative min-h-[300px] md:min-h-[420px]">
          <div className="absolute left-2 right-8 top-0 h-64 border border-[#c5a45b]/45 bg-[#17130d] shadow-[0_30px_90px_rgba(23,19,13,0.2)] md:h-80" />
          <div className="absolute left-7 right-0 top-8 overflow-hidden border border-[#c5a45b]/50 shadow-[0_30px_90px_rgba(23,19,13,0.18)] md:left-10 md:top-10">
            <Image
              alt="Football stadium lights"
              className="h-[210px] w-full object-cover opacity-80 saturate-90 md:h-[290px]"
              height={540}
              priority
              src="/images/stadium.jpg"
              width={760}
            />
          </div>

          <div className="absolute bottom-0 right-0 max-w-[260px] border border-[#c5a45b]/50 bg-[#fbf7ed] px-4 py-4 shadow-[0_22px_70px_rgba(23,19,13,0.16)] md:max-w-[310px] md:px-5 md:py-5">
            <p className="text-xs font-black uppercase text-[#8b6f2f]">
              Campaign pulse
            </p>
            <div className="mt-4 space-y-3">
              {campaignStats.map(([value, label]) => (
                <div className="flex items-end justify-between gap-6 border-b border-[#d8caa7] pb-3 last:border-b-0 last:pb-0" key={label}>
                  <span className="text-2xl font-black md:text-3xl">{value}</span>
                  <span className="text-right text-sm font-bold text-[#70644d]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d8caa7] bg-[#17130d] px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-black text-[#d9bd72]">
          {tools.map((tool) => (
            <span key={tool}>{tool}</span>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-4xl">
          <p className="text-sm font-black uppercase text-[#8b6f2f]">
            The product
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            One simple engine for alumni, stories, and support.
          </h2>
        </div>

        <div className="mt-12 grid gap-10 border-t border-[#d8caa7] pt-10 md:grid-cols-3">
          {proofPoints.map(([title, body]) => (
            <div key={title}>
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="mt-3 text-base font-semibold leading-7 text-[#665a43]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="overflow-hidden bg-[#17130d] px-6 py-20 text-[#f8f1df]"
        id="fundraising"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[#d9bd72]">
              Passive fundraising
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              More touchpoints. Better timing. Less begging.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-[#cfc3a7]">
              Give alumni reasons to return before you need them to donate.
              Stories, sponsors, events, memberships, and campaigns all feed the
              same supporter loop.
            </p>
          </div>

          <div className="relative min-h-[300px]">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-[#c5a45b]/35" />
            <div className="grid gap-5 md:grid-cols-4">
              {rhythm.map((item, index) => (
                <div className="relative bg-[#17130d] py-4" key={item}>
                  <span className="flex h-12 w-12 items-center justify-center border border-[#c5a45b] bg-[#c5a45b] text-sm font-black text-[#17130d]">
                    {index + 1}
                  </span>
                  <p className="mt-5 text-2xl font-black leading-tight">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="crm" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="relative">
            <div className="relative border border-[#d8caa7] bg-[#fbf7ed] p-6 shadow-[0_24px_80px_rgba(23,19,13,0.1)]">
              <div className="flex items-center justify-between border-b border-[#d8caa7] pb-4">
                <div>
                  <p className="text-xs font-black uppercase text-[#8b6f2f]">
                    CRM view
                  </p>
                  <h3 className="mt-1 text-2xl font-black">Supporter list</h3>
                </div>
                <span className="rounded-full border border-[#c5a45b]/45 bg-[#efe1bf] px-3 py-1 text-xs font-black text-[#6d551f]">
                  Live
                </span>
              </div>
              {[
                ["Jordan Lee", "Class of 2012", "Member"],
                ["Northside Auto", "Sponsor", "Warm lead"],
                ["Maya Singh", "Parent", "Campaign click"],
                ["Devon Cole", "Class of 2008", "Event RSVP"],
              ].map(([name, detail, status]) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#e6dcc4] py-4 last:border-b-0"
                  key={name}
                >
                  <div>
                    <p className="font-black">{name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#70644d]">
                      {detail}
                    </p>
                  </div>
                  <p className="text-right text-sm font-black text-[#8b6f2f]">
                    {status}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase text-[#8b6f2f]">
              Reach and connect
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              A CRM built for people who love the program.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-[#665a43]">
              Track alumni, sponsors, parents, members, giving history, event
              interest, tags, and notes without turning the program into a
              spreadsheet job.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#fbf7ed] px-6 py-20" id="mailer">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase text-[#8b6f2f]">
              Mailer
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Stay in touch like a program with a plan.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-[#665a43]">
              Send alumni updates, sponsor announcements, event reminders,
              renewal nudges, and SMS-ready campaigns from the same system that
              stores the relationship.
            </p>
          </div>

          <div className="space-y-5 border-l border-[#d8caa7] pl-6">
            {[
              ["Launch", "New season letter to all alumni"],
              ["Warm up", "Homecoming invite to nearby supporters"],
              ["Convert", "Equipment campaign to recent donors"],
            ].map(([label, body]) => (
              <div key={label}>
                <p className="text-sm font-black uppercase text-[#8b6f2f]">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-black text-[#5f523b]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <p className="text-lg font-semibold leading-8 text-[#665a43]">
            TeamAlum is for real programs with real pride, limited time, and no
            appetite for overpriced donor software. Launch fast, look sharp, and
            keep the alumni machine moving.
          </p>
          <div>
            <p className="text-sm font-black uppercase text-[#8b6f2f]">
              Built to be affordable
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
              Professional tools, minus the enterprise mess.
            </h2>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-[#d8caa7] pt-12 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-[#8b6f2f]">
              TeamAlum
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-6xl">
              Fundraise without the frantic ask.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[#17130d] px-6 py-4 text-sm font-black uppercase text-[#f8f1df] transition hover:bg-[#2a2114]"
              href="/studio/start"
            >
              Start building
            </Link>
            <Link
              className="rounded-full border border-[#b7a57b] px-6 py-4 text-sm font-black uppercase text-[#17130d] transition hover:border-[#8b6f2f] hover:text-[#8b6f2f]"
              href="/hq"
            >
              TeamAlum HQ
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
