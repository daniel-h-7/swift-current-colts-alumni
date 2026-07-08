import { SiteSponsor } from "@/lib/site-content";

export function SponsorScroll({ sponsors }: { sponsors: SiteSponsor[] }) {
  const sponsorItems = sponsors.length ? sponsors : [];

  return (
    <div className="mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-[sponsor-scroll_28s_linear_infinite] gap-4">
        {[...sponsorItems, ...sponsorItems].map((sponsor, index) => {
          const card = (
            <div className="flex h-20 min-w-56 items-center justify-center border border-blue-100/20 bg-black/42 px-6 text-center text-sm font-black uppercase tracking-[2px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-blue-100/45 hover:bg-black/60">
              {sponsor.name}
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
