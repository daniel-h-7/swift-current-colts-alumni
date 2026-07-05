# Hidden Content Parking Lot

This file stores public-facing sections that are temporarily removed from the site but may be restored later.

## Home Page Stat Boxes

Removed from `src/app/page.tsx` on 2026-07-04.

```tsx
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
```

## Home Page Current Campaign Section

Removed from `src/app/page.tsx` on 2026-07-04.

```tsx
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
```
