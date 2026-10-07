import { SiteSponsor } from "@/lib/site-content";

export function SponsorScroll({ sponsors }: { sponsors: SiteSponsor[] }) {
  const sponsorItems = sponsors.length ? sponsors : [];

  return (
    <div className="mb-1 mt-9 overflow-hidden py-2">
      <div className="flex w-max animate-[sponsor-scroll_32s_linear_infinite] gap-5">
        {[...sponsorItems, ...sponsorItems].map((sponsor, index) => {
          const card = (
            <div className="group relative h-48 w-72 overflow-hidden border border-white/15 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/40">
              {sponsor.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`${sponsor.name} logo`}
                    className="h-full w-full object-contain p-8 transition duration-300 group-hover:scale-105 group-hover:opacity-28"
                    src={sponsor.imageUrl}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-6 text-center opacity-0 transition duration-300 group-hover:opacity-100">
                    <span className="text-sm font-black uppercase tracking-[0.18em] text-white">
                      {sponsor.name}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-950 px-6 text-center text-sm font-black uppercase tracking-[0.18em] text-white">
                  {sponsor.name}
                </div>
              )}
            </div>
          );

          return sponsor.linkUrl ? (
            <a
              className="block"
              href={sponsor.linkUrl}
              key={`${sponsor.name || "blank"}-${sponsor.linkUrl}-${index}`}
              rel="noreferrer"
              target="_blank"
            >
              {card}
            </a>
          ) : (
            <div key={`${sponsor.name || "blank"}-${index}`}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
