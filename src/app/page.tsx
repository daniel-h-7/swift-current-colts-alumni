import Image from "next/image";
import Link from "next/link";

const events = [
  ["Alumni Golf Classic", "June 21, 2026"],
  ["Friday Night Homecoming", "September 18, 2026"],
  ["Hall of Fame Banquet", "November 7, 2026"],
];

const spotlights = [
  ["Tyler McLeod", "Class of 2009", "Former captain. Local business owner. Monthly donor."],
  ["Jordan Hayes", "Class of 2014", "Volunteer coach helping build the next generation."],
  ["Ryan Campbell", "Class of 1998", "Hall of Fame nominee and longtime Colts supporter."],
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
          className="object-cover object-center opacity-85 saturate-125 contrast-110 md:scale-110 md:object-[center_42%]"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-blue-950/28 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.64)_0%,rgba(0,0,0,0.36)_36%,rgba(0,0,0,0.18)_62%,rgba(0,0,0,0.34)_100%)] md:bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.28)_34%,rgba(0,0,0,0.08)_62%,rgba(0,0,0,0.18)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.42),transparent_68%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_42%,rgba(37,99,235,0.24),transparent_24%),radial-gradient(circle_at_78%_43%,rgba(220,38,38,0.22),transparent_26%)]" />

        <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div>
            <p className="text-xs tracking-[4px] uppercase text-red-500">
              Swift Current
            </p>
            <h1 className="text-xl font-black">
              Colts Alumni
            </h1>
          </div>

          <div className="hidden md:flex gap-8 text-sm uppercase tracking-widest text-gray-300">
            <a href="#impact">Impact</a>
            <a href="#donate">Donate</a>
            <a href="#alumni">Alumni</a>
            <a href="#events">Events</a>
            <Link href="/admin">Admin</Link>
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
              <Link href="/join" className="rounded-full bg-blue-700 px-8 py-4 font-bold hover:bg-blue-600">
                Join the Alumni Network
              </Link>
              <a href="#donate" className="rounded-full bg-red-600 px-8 py-4 font-bold hover:bg-red-500">
                Become a Monthly Booster
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            ["847", "Alumni Reconnected"],
            ["$48K", "Raised This Year"],
            ["224", "Monthly Boosters"],
            ["42", "Years of Colts Tradition"],
          ].map(([number, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
              <h3 className="text-5xl font-black text-white">{number}</h3>
              <p className="mt-3 text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="donate" className="bg-gradient-to-r from-blue-950 via-black to-red-950 px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-black/50 p-8 md:p-12">
          <p className="text-sm uppercase tracking-[5px] text-red-500">Current Campaign</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-black">2026 Equipment Fund</h2>
          <p className="mt-4 text-gray-300">
            Help fund helmets, pads, travel, training equipment, and player development.
          </p>

          <div className="mt-8 h-8 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-[72%] rounded-full bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.7)]" />
          </div>

          <div className="mt-4 flex justify-between text-gray-300">
            <span>$36,000 raised</span>
            <span>$50,000 goal</span>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {["$10/month", "$25/month", "$50/month"].map((tier) => (
              <button key={tier} className="rounded-xl border border-blue-500/40 bg-blue-950/60 p-5 font-bold hover:bg-blue-800">
                {tier}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="alumni" className="max-w-7xl mx-auto px-6 py-20">
        <p className="text-sm uppercase tracking-[5px] text-red-500">Colts Family</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-black">Alumni Spotlights</h2>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {spotlights.map(([name, year, bio]) => (
            <div key={name} className="rounded-2xl bg-zinc-900 p-8 border border-white/10">
              <div className="mb-6 h-32 rounded-xl bg-gradient-to-br from-blue-800 to-red-700" />
              <h3 className="text-2xl font-black">{name}</h3>
              <p className="text-red-500 font-bold">{year}</p>
              <p className="mt-4 text-gray-400">{bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-zinc-950 px-6 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">Hall of Fame</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-black">Honouring the Colts who built the standard.</h2>
            <p className="mt-6 text-gray-400">
              Celebrate former players, coaches, builders, and supporters who helped shape Colts football.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-950 to-red-950 p-8">
            <p className="text-gray-300">Class of 2026 nominations opening soon.</p>
            <button className="mt-6 rounded-full bg-red-600 px-6 py-3 font-bold hover:bg-red-500">
              Nominate a Colt
            </button>
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
