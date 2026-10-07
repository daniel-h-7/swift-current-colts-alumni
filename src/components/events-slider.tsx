"use client";

import { SiteEvent } from "@/lib/site-content";

export function EventsSlider({
  events,
  fallbackImage = "/images/stadium.jpg",
  placeholderImage = "",
}: {
  events: SiteEvent[];
  fallbackImage?: string;
  placeholderImage?: string;
}) {
  const visibleEvents = events.length ? events : [];
  const showImages = visibleEvents.some((event) => event.imageUrl);

  return (
    <div className="mt-9 overflow-hidden py-2">
      <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
        {visibleEvents.map((event) => {
          const imageUrl = event.imageUrl || placeholderImage || fallbackImage;
          const isPlaceholder = !event.imageUrl && Boolean(placeholderImage);

          return (
            <article
              className="group w-[19rem] shrink-0 snap-start bg-white text-zinc-950 shadow-[0_20px_52px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 md:w-[22rem]"
              key={`${event.title}-${event.date}`}
            >
              {showImages ? (
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`${event.title} event image`}
                    className={
                      isPlaceholder
                        ? "h-full w-full bg-white object-contain p-8 transition duration-500 group-hover:scale-105 group-hover:opacity-80"
                        : "h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-80"
                    }
                    src={imageUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-transparent" />
                </div>
              ) : null}

              <div className="min-h-44 border-x border-b border-zinc-200 px-5 py-5">
                {event.date ? (
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    {event.date}
                  </p>
                ) : null}
                <h3 className="mt-2 text-xl font-black leading-tight text-zinc-950">
                  {event.title}
                </h3>
                {event.notes ? (
                  <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-zinc-600">
                    {event.notes}
                  </p>
                ) : null}
                {event.linkUrl ? (
                  <a
                    className="mt-5 inline-flex border border-zinc-950 bg-zinc-950 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-zinc-800"
                    href={event.linkUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {event.linkLabel || "Details"}
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
