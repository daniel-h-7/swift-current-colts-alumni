export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-black to-black opacity-90" />

        <div className="relative z-10 text-center px-6 max-w-4xl">

          <p className="uppercase tracking-[6px] text-red-500 mb-4">
            Swift Current Colts Football Alumni
          </p>

          <h1 className="text-6xl md:text-8xl font-black mb-6">
            Once A Colt.
            <br />
            Always A Colt.
          </h1>

          <p className="text-xl text-gray-300 mb-10">
            Preserving our legacy, supporting future athletes,
            and keeping the Colts family connected.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">

            <button className="bg-blue-700 hover:bg-blue-600 px-8 py-4 rounded-lg font-bold">
              Join Alumni Network
            </button>

            <button className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded-lg font-bold">
              Donate Today
            </button>

          </div>

        </div>
      </section>

      {/* IMPACT SECTION */}

      <section className="max-w-7xl mx-auto px-8 py-20">

        <div className="text-center mb-12">

          <h2 className="text-4xl font-bold">
            Our Impact
          </h2>

        </div>

        <div className="grid md:grid-cols-4 gap-6">

          <div className="bg-blue-950 p-8 rounded-xl text-center">
            <h3 className="text-5xl font-bold">847</h3>
            <p className="text-gray-300 mt-2">Registered Alumni</p>
          </div>

          <div className="bg-red-900 p-8 rounded-xl text-center">
            <h3 className="text-5xl font-bold">$48K</h3>
            <p className="text-gray-300 mt-2">Raised This Year</p>
          </div>

          <div className="bg-blue-950 p-8 rounded-xl text-center">
            <h3 className="text-5xl font-bold">224</h3>
            <p className="text-gray-300 mt-2">Monthly Donors</p>
          </div>

          <div className="bg-red-900 p-8 rounded-xl text-center">
            <h3 className="text-5xl font-bold">42</h3>
            <p className="text-gray-300 mt-2">Years of Tradition</p>
          </div>

        </div>

      </section>

      {/* CURRENT CAMPAIGN */}

      <section className="bg-zinc-950 py-20 px-8">

        <div className="max-w-4xl mx-auto">

          <h2 className="text-4xl font-bold mb-6 text-center">
            2026 Equipment Fund
          </h2>

          <div className="bg-zinc-800 rounded-full h-8 overflow-hidden">

            <div className="bg-red-600 h-full w-[72%]" />

          </div>

          <div className="flex justify-between mt-4 text-gray-300">
            <span>$36,000 Raised</span>
            <span>$50,000 Goal</span>
          </div>

        </div>

      </section>

      {/* UPCOMING EVENTS */}

      <section className="max-w-7xl mx-auto py-20 px-8">

        <h2 className="text-4xl font-bold mb-12 text-center">
          Upcoming Alumni Events
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-zinc-900 p-8 rounded-xl">
            <h3 className="font-bold text-xl mb-2">
              Alumni Golf Tournament
            </h3>

            <p className="text-gray-400">
              June 21, 2026
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-xl">
            <h3 className="font-bold text-xl mb-2">
              Homecoming Weekend
            </h3>

            <p className="text-gray-400">
              September 18, 2026
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-xl">
            <h3 className="font-bold text-xl mb-2">
              Hall of Fame Banquet
            </h3>

            <p className="text-gray-400">
              November 7, 2026
            </p>
          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-zinc-800 py-10 text-center text-gray-500">

        Swift Current Colts Football Alumni Association

      </footer>

    </main>
  );
}