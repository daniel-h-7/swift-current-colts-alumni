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
        {visibleEvents.map((event) => (
          <div
            className="flex min-h-56 flex-col rounded-2xl border border-white/10 bg-white/5 p-8"
            key={`${event.title}-${event.date}`}
          >
            <div>
              <h3 className="text-2xl font-black">{event.title}</h3>
              {event.date ? (
                <p className="mt-3 text-gray-400">{event.date}</p>
              ) : null}
            </div>

            <div className="mt-auto flex items-end justify-between gap-4 pt-8">
              <p className="text-sm leading-6 text-gray-400">
                {event.notes || ""}
              </p>
              {event.linkUrl ? (
                <a
                  className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-600"
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
            className="rounded-md border border-white/15 bg-black/35 px-4 py-3 font-black text-gray-200 transition hover:border-blue-500 hover:text-white"
            onClick={() => move(-1)}
            type="button"
          >
            Previous
          </button>
          <p className="text-sm font-bold text-gray-500">
            {currentPage + 1} / {pages.length}
          </p>
          <button
            className="rounded-md border border-white/15 bg-black/35 px-4 py-3 font-black text-gray-200 transition hover:border-blue-500 hover:text-white"
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
