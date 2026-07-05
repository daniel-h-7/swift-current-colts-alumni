import Image from "next/image";
import Link from "next/link";

const events = [
  ["Alumni Golf Classic", "June 21, 2026"],
  ["Friday Night Homecoming", "September 18, 2026"],
  ["Hall of Fame Banquet", "November 7, 2026"],
];

const spotlights = [
  {
    image: "/images/rhett-vavra.webp",
    imageClass: "object-[center_28%]",
    name: "Rhett Vavra",
    source: "University of Saskatchewan Huskies",
    year: "Class of '21",
  },
  {
    image: "/images/gerry-inglis.webp",
    imageClass: "origin-[18%_24%] object-[18%_24%] scale-[2.15]",
    name: "Gerry Inglis",
    source: "University of Alberta Golden Bears",
    year: "",
  },
];

const sponsors = [
  "Pioneer Co-op",
  "Innovation Credit Union",
  "Great Plains College",
  "Swift Current Broncos",
  "S3 Group",
  "Southwest Terminal",
  "Standard Motors",
  "RBC Swift Current",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/images/stadium.jpg"
          alt="Football stadium under Friday night lights"
          fill
          priority
          className="object-cover object-center opacity-95 saturate-125 contrast-110 md:scale-110 md:object-[center_42%]"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-blue-950/18 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.48)_0%,rgba(0,0,0,0.25)_36%,rgba(0,0,0,0.1)_62%,rgba(0,0,0,0.24)_100%)] md:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0.2)_34%,rgba(0,0,0,0.04)_62%,rgba(0,0,0,0.14)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.42),transparent_68%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_42%,rgba(37,99,235,0.24),transparent_24%),radial-gradient(circle_at_78%_43%,rgba(220,38,38,0.22),transparent_26%)]" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-xs tracking-[4px] uppercase text-red-500">
              Swift Current
            </p>
            <h1 className="text-xl font-black">
              Colts Football
            </h1>
          </div>

          <div className="hidden items-center overflow-hidden rounded-lg border border-white/10 bg-black/35 text-xs font-black uppercase tracking-[2px] text-gray-300 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur md:flex">
            <a className="border-r border-white/10 px-4 py-3 transition hover:bg-white/10 hover:text-white" href="#sponsors">Sponsors</a>
            <a className="border-r border-white/10 px-4 py-3 transition hover:bg-white/10 hover:text-white" href="#alumni">Alumni</a>
            <a className="border-r border-white/10 px-4 py-3 transition hover:bg-white/10 hover:text-white" href="#events">Events</a>
            <Link className="px-4 py-3 transition hover:bg-blue-950/50 hover:text-white" href="/admin">Admin</Link>
          </div>
        </nav>

        <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-6 text-center">
          <div className="max-w-5xl">
            <p className="mb-5 text-sm font-black uppercase tracking-[8px] text-red-400 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Colts Football Alumni and Booster Club
            </p>

            <h2 className="text-6xl md:text-8xl font-black leading-none text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)]">
              THE LEGACY
              <span className="block text-blue-400 drop-shadow-[0_0_26px_rgba(37,99,235,0.55)]">LIVES ON.</span>
            </h2>

            <p className="mx-auto mt-8 max-w-2xl text-lg font-semibold leading-8 text-gray-100 drop-shadow-[0_3px_18px_rgba(0,0,0,0.95)] md:text-2xl">
              Connecting generations of Colts football while supporting the athletes who wear the jersey today.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/join" className="rounded-md bg-red-600 px-8 py-4 font-bold uppercase tracking-[2px] shadow-[0_16px_44px_rgba(220,38,38,0.32)] transition hover:bg-red-500">
                Support the Program Today!
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="sponsors" className="max-w-7xl mx-auto px-6 py-20">
        <div className="overflow-hidden rounded-2xl border border-blue-300/25 bg-[linear-gradient(135deg,rgba(37,99,235,0.96)_0%,rgba(30,64,175,0.82)_34%,rgba(10,15,28,0.96)_72%,rgba(0,0,0,0.98)_100%)] p-8 shadow-[0_28px_90px_rgba(37,99,235,0.22)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[5px] text-blue-100/80">Backed By Community</p>
              <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">Legacy Sponsors</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-blue-50/85">
              Thank you to our amazing sponsors for your continued support of Swift Current Colts Football!
            </p>
          </div>

          <div className="mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-[sponsor-scroll_28s_linear_infinite] gap-4">
              {[...sponsors, ...sponsors].map((sponsor, index) => (
                <div
                  className="flex h-20 min-w-56 items-center justify-center rounded-lg border border-blue-100/20 bg-black/40 px-6 text-center text-sm font-black uppercase tracking-[2px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  key={`${sponsor}-${index}`}
                >
                  {sponsor}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="alumni" className="relative isolate overflow-hidden px-6 py-20">
        <div
          aria-hidden="true"
          className="alumni-logo-mask alumni-logo-sc absolute left-[-2rem] top-8 hidden h-72 w-72 bg-red-600/30 md:block"
        />
        <div
          aria-hidden="true"
          className="alumni-logo-mask alumni-logo-horseshoe absolute right-[-3rem] top-10 hidden h-72 w-72 bg-red-600/30 md:block"
        />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-red-950/20 to-transparent" />
        <div className="absolute left-0 top-0 hidden h-full w-64 bg-gradient-to-r from-black via-black/80 to-transparent md:block" />
        <div className="absolute right-0 top-0 hidden h-full w-64 bg-gradient-to-l from-black via-black/80 to-transparent md:block" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm uppercase tracking-[5px] text-red-500">Colts Family</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-black">Alumni Spotlights</h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {spotlights.map((spotlight) => (
              <div key={spotlight.name} className="rounded-2xl bg-zinc-900/90 p-8 border border-white/10">
                <div className="relative mb-6 h-56 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-950 to-red-950">
                  <Image
                    src={spotlight.image}
                    alt={`${spotlight.name} headshot`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={`object-cover ${spotlight.imageClass} grayscale-[25%]`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <p className="absolute bottom-3 left-4 text-xs font-bold uppercase tracking-[2px] text-gray-300">
                    {spotlight.source}
                  </p>
                </div>
                <h3 className="text-2xl font-black">{spotlight.name}</h3>
                {spotlight.year ? (
                  <p className="mt-1 text-sm font-semibold italic text-red-400">{spotlight.year}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-sm uppercase tracking-[5px] text-red-500">Gather Again</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-black">Upcoming Events</h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {events.map(([title, date]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="mt-3 text-gray-400">{date}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-12 text-center text-gray-500">
        <p className="font-bold text-white">Colts Football Alumni and Booster Club</p>
        <p className="mt-2">Swift Current, Saskatchewan</p>
      </footer>
    </main>
  );
}
