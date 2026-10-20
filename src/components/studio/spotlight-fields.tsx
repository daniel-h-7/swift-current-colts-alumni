"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/studio/image-upload-field";
import { SiteSpotlight } from "@/lib/site-content";

const fieldClass =
  "mt-2 w-full rounded-[8px] border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25";

const areaClass = `${fieldClass} min-h-28`;

const blankSpotlight: SiteSpotlight = {
  classYear: "",
  descriptor: "",
  imageClass: "object-center",
  imageUrl: "",
  name: "",
};

function getSpotlight(items: SiteSpotlight[], index: number) {
  return items[index] ?? blankSpotlight;
}

export function SpotlightFields({
  initialSpotlights,
}: {
  initialSpotlights: SiteSpotlight[];
}) {
  const initialCount = Math.max(1, Math.min(4, initialSpotlights.length || 1));
  const [count, setCount] = useState(initialCount);
  const spotlights = Array.from({ length: count }, (_, index) =>
    getSpotlight(initialSpotlights, index),
  );

  return (
    <div className="space-y-5">
      {spotlights.map((spotlight, index) => (
        <div className="border border-slate-200 bg-slate-50 p-4" key={index}>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            Spotlight {index + 1}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              className={fieldClass}
              defaultValue={spotlight.name}
              name={`spotlight_${index + 1}_name`}
              placeholder="Name"
            />
            <input
              className={fieldClass}
              defaultValue={spotlight.classYear}
              name={`spotlight_${index + 1}_class_year`}
              placeholder="Class year or role"
            />
            <textarea
              className={`${areaClass} md:col-span-2`}
              defaultValue={spotlight.descriptor}
              name={`spotlight_${index + 1}_descriptor`}
              placeholder="Short description"
            />
            <ImageUploadField
              help="Upload a spotlight photo, crop it for the homepage card, or paste an image URL."
              label={`Spotlight ${index + 1} Photo`}
              name={`spotlight_${index + 1}_image_file`}
              previewMode="event"
              urlName={`spotlight_${index + 1}_image_url`}
              urlValue={spotlight.imageUrl}
            />
          </div>
        </div>
      ))}

      {count < 4 ? (
        <button
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black uppercase text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
          onClick={() => setCount((current) => Math.min(4, current + 1))}
          type="button"
        >
          Add Another Alumni Spotlight
        </button>
      ) : null}
    </div>
  );
}
