"use client";

import { useMemo, useState } from "react";
import { SiteEvent } from "@/lib/site-content";

export function EventsSlider({ events }: { events: SiteEvent[] }) {
  const [page, setPage] = useState(0);
  const pages = useMemo(() => {
    const chunks: SiteEvent[][] = [];

    for (let index = 0; index < events.length; index += 3) {
      chunks.push(events.slice(index, index + 3));
    }

    return chunks.length ? chunks : [[]];
  }, [events]);
  const currentPage = Math.min(page, pages.length - 1);
  const visibleEvents = pages[currentPage] ?? [];

  function move(direction: -1 | 1) {
    setPage((current) => {
      const next = current + direction;

      if (next < 0) {
        return pages.length - 1;
      }

      if (next >= pages.length) {
        return 0;
      }

      return next;
    });
  }

  return (
    <div className="mt-10">
      <div className="grid gap-6 md:grid-cols-3">
        {visibleEvents.map((event, index) => (
          <div
            className="flex min-h-64 flex-col border border-white/10 bg-[linear-gradient(180deg,rgba(24,24,27,0.86),rgba(9,9,11,0.96))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.28)]"
            key={`${event.title}-${event.date}`}
          >
            <div>
              <p className="mb-5 text-xs font-black uppercase tracking-[4px] text-blue-400">
                0{index + 1}
              </p>
              <h3 className="text-2xl font-black leading-tight">{event.title}</h3>
              {event.date ? (
                <p className="mt-3 border-l-2 border-red-500 pl-3 text-sm font-bold uppercase tracking-[2px] text-gray-300">{event.date}</p>
              ) : null}
            </div>

            <div className="mt-auto flex items-end justify-between gap-4 pt-8">
              <p className="text-sm leading-6 text-gray-400">
                {event.notes || ""}
              </p>
              {event.linkUrl ? (
                <a
                  className="shrink-0 border border-blue-400/40 bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-600"
                  href={event.linkUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {event.linkLabel || "Details"}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {pages.length > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <button
            className="border border-white/15 bg-black/35 px-4 py-3 font-black text-gray-200 transition hover:border-blue-500 hover:text-white"
            onClick={() => move(-1)}
            type="button"
          >
            Previous
          </button>
          <p className="text-sm font-bold text-gray-500">
            {currentPage + 1} / {pages.length}
          </p>
          <button
            className="border border-white/15 bg-black/35 px-4 py-3 font-black text-gray-200 transition hover:border-blue-500 hover:text-white"
            onClick={() => move(1)}
            type="button"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
