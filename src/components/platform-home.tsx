import Image from "next/image";
import Link from "next/link";

const platformSteps = [
  {
    label: "Create",
    text: "A program starts an organization, chooses a template, and sets the basics.",
  },
  {
    label: "Build",
    text: "They add sponsors, events, photos, campaigns, and homepage copy in Studio.",
  },
  {
    label: "Launch",
    text: "They connect payments, publish the site, and manage supporters from one place.",
  },
];

const platformModules = [
  "Site Builder",
  "Memberships",
  "Sponsors",
  "Events",
  "Campaigns",
  "Stripe Connect",
];

const workspaceCards = [
  {
    eyebrow: "Internal",
    href: "/hq",
    label: "TeamAlum HQ",
    text: "Manage clients, domains, feature availability, tenant settings, and support workflows.",
  },
  {
    eyebrow: "Client",
    href: "/studio",
    label: "TeamAlum Studio",
    text: "Let each organization edit content, choose modules, connect payments, and prepare to publish.",
  },
  {
    eyebrow: "Published",
    href: "/",
    label: "Client Sites",
    text: "The existing template pages remain the public output for each team, driven by tenant data.",
  },
];

const builderBlocks = [
  "Hero copy and site title",
  "Sponsor rail and sponsor links",
  "Events and registration links",
  "Alumni spotlights and photos",
  "Membership amount and join page",
  "Campaign goals and donation CTAs",
];

export function PlatformHome() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          alt="Football stadium lights"
          className="object-cover opacity-35 saturate-125"
          fill
          priority
          src="/images/stadium.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/86 to-slate-950" />
        <div className="absolute inset-0 premium-grid opacity-35" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center border border-emerald-300/40 bg-emerald-500/12 text-sm font-black text-emerald-200">
              TA
            </span>
            <span>
              <span className="block text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300">
                TeamAlum
              </span>
              <span className="mt-1 block font-black">HQ + Studio</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 text-sm font-bold text-slate-300 md:flex">
            <Link className="px-3 py-2 transition hover:text-white" href="/studio">
              Studio
            </Link>
            <Link className="px-3 py-2 transition hover:text-white" href="/hq">
              HQ
            </Link>
            <Link
              className="border border-white/15 bg-white/10 px-4 py-2 text-white transition hover:bg-white/15"
              href="/studio"
            >
              Start Building
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[68vh] max-w-7xl items-center px-6 py-12">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.36em] text-emerald-300">
              Alumni and Booster Sites
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Launch a team site that can take payments, collect supporters,
              and keep the program moving.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 text-slate-300">
              TeamAlum gives programs a polished public site, a client-friendly
              content builder, and an internal HQ for managing every tenant in
              the shared platform.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                className="border border-emerald-400/50 bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-emerald-500"
                href="/studio"
              >
                Open Studio
              </Link>
              <Link
                className="border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
                href="/hq"
              >
                Open HQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-6 py-8">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-6">
          {platformModules.map((module) => (
            <div
              className="border border-white/10 bg-slate-900/80 px-4 py-4 text-center text-sm font-black text-slate-200"
              key={module}
            >
              {module}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
            Two Workspaces
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Internal control for you. A clean builder for clients.
          </h2>
          <p className="mt-5 text-sm font-semibold leading-7 text-slate-400">
            The platform Vercel project should own TeamAlum.com, signup,
            authentication, HQ, and Studio. Published client sites can continue
            to be served from the same codebase using tenant-aware routing.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {platformSteps.map((step) => (
            <article
              className="border border-white/10 bg-slate-900 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
              key={step.label}
            >
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                {step.label}
              </p>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/70 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
                Routes
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight">
                The pages are parked in the right lanes.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-7 text-slate-400">
              The platform root introduces TeamAlum, HQ manages the business,
              Studio manages the client experience, and client sites stay as
              the public-facing output.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workspaceCards.map((workspace) => (
              <Link
                className="group border border-white/10 bg-slate-950 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 hover:border-emerald-300/40"
                href={workspace.href}
                key={workspace.label}
              >
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500 group-hover:text-emerald-300">
                  {workspace.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-black">{workspace.label}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-400">
                  {workspace.text}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-white/10 bg-slate-900 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
            Builder Blocks
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Start with content blocks, then wire the account system behind them.
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {builderBlocks.map((block) => (
              <div
                className="border border-white/10 bg-slate-950 px-4 py-4 text-sm font-bold text-slate-300"
                key={block}
              >
                {block}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-emerald-300/20 bg-emerald-950/20 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">
            Next Build Stream
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">
            Turn Studio into the client onboarding path.
          </h2>
          <ol className="mt-6 space-y-4">
            {[
              "Create client account and organization",
              "Pick enabled features",
              "Edit template content",
              "Upload brand assets and photos",
              "Connect Stripe",
              "Publish the site",
            ].map((item, index) => (
              <li className="flex gap-4" key={item}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-emerald-300/30 bg-emerald-400/10 text-sm font-black text-emerald-200">
                  {index + 1}
                </span>
                <span className="pt-1 text-sm font-bold leading-6 text-slate-200">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
