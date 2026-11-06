"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/studio/image-upload-field";
import type { SiteEvent, SiteSponsor } from "@/lib/site-content";

const fieldClass = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:border-[#a18442]";
const buttonClass = "mt-5 rounded-full border border-slate-300 px-5 py-3 text-sm font-bold hover:border-[#a18442]";

export function HomepageListFields({ initialSponsors, initialEvents }: {
  initialSponsors: SiteSponsor[];
  initialEvents: SiteEvent[];
}) {
  const [sponsorCount, setSponsorCount] = useState(Math.max(3, initialSponsors.length));
  const [eventCount, setEventCount] = useState(Math.max(2, initialEvents.length));
  return <div className="mt-6 space-y-8">
    <input type="hidden" name="sponsor_count" value={sponsorCount} />
    <input type="hidden" name="event_count" value={eventCount} />
    <section>
      <h3 className="font-black">Sponsors</h3>
      <p className="mt-2 text-sm text-slate-500">Add as many partners as you need. Clear a sponsor’s name to remove it when saving.</p>
      <div className="mt-4 space-y-5">
        {Array.from({ length: sponsorCount }, (_, index) => {
          const sponsor = initialSponsors[index];
          const prefix = `sponsor_${index + 1}`;
          return <fieldset className="border-b border-slate-200 pb-5" key={index}>
            <legend className="font-bold">Sponsor {index + 1}</legend>
            <div className="grid gap-3 md:grid-cols-2">
              <label>Name<input className={fieldClass} defaultValue={sponsor?.name} name={`${prefix}_name`} /></label>
              <label>Website<input className={fieldClass} defaultValue={sponsor?.linkUrl} name={`${prefix}_link_url`} /></label>
              <label>Logo URL<input className={fieldClass} defaultValue={sponsor?.imageUrl} name={`${prefix}_image_url`} /></label>
              <label>Logo upload<input accept="image/png,image/jpeg,image/webp,image/svg+xml" className={fieldClass} name={`${prefix}_image_file`} type="file" /></label>
            </div>
          </fieldset>;
        })}
      </div>
      {sponsorCount < 1000 && <button type="button" className={buttonClass} onClick={() => setSponsorCount((n) => n + 1)}>Add Another Sponsor</button>}
    </section>
    <section>
      <h3 className="font-black">Events</h3>
      <p className="mt-2 text-sm text-slate-500">Clear an event’s title to remove it when saving.</p>
      <div className="mt-4 space-y-5">
        {Array.from({ length: eventCount }, (_, index) => {
          const event = initialEvents[index];
          const prefix = `event_${index + 1}`;
          return <fieldset className="border-b border-slate-200 pb-5" key={index}>
            <legend className="font-bold">Event {index + 1}</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label>Title<input className={fieldClass} defaultValue={event?.title} name={`${prefix}_title`} /></label>
              <label>Date<input className={fieldClass} defaultValue={event?.date} name={`${prefix}_date`} placeholder="Date or season" /></label>
              <label className="md:col-span-2">Description<textarea className={`${fieldClass} min-h-28`} defaultValue={event?.notes} name={`${prefix}_notes`} /></label>
              <ImageUploadField help="Upload and crop an event image, or paste its URL." label={`Event ${index + 1} Image`} name={`${prefix}_image_file`} previewMode="event" urlName={`${prefix}_image_url`} urlValue={event?.imageUrl ?? ""} />
              <div>
                <label>Registration URL<input className={fieldClass} defaultValue={event?.linkUrl} name={`${prefix}_link_url`} /></label>
                <label>Link text<input className={fieldClass} defaultValue={event?.linkLabel ?? "Details"} name={`${prefix}_link_label`} /></label>
              </div>
            </div>
          </fieldset>;
        })}
      </div>
      {eventCount < 1000 && <button type="button" className={buttonClass} onClick={() => setEventCount((n) => n + 1)}>Add Another Event</button>}
    </section>
  </div>;
}
