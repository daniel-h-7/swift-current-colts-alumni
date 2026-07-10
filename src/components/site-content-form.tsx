"use client";

import { useMemo, useState } from "react";
import {
  SiteContent,
  SiteEvent,
  SiteFundraisingCampaign,
  SiteImpactStat,
  SiteSponsor,
  SiteSpotlight,
} from "@/lib/site-content";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

function blankEvent(): SiteEvent {
  return {
    date: "",
    linkLabel: "Details",
    linkUrl: "",
    notes: "",
    title: "",
  };
}

function blankSpotlight(): SiteSpotlight {
  return {
    classYear: "",
    descriptor: "",
    imageClass: "object-center",
    imageUrl: "",
    name: "",
  };
}

function blankSponsor(): SiteSponsor {
  return {
    imageUrl: "",
    linkUrl: "",
    name: "",
  };
}

function blankImpactStat(): SiteImpactStat {
  return {
    label: "",
    value: "",
  };
}

function blankFundraisingCampaign(): SiteFundraisingCampaign {
  return {
    buttonLabel: "Support the Project",
    buttonUrl: "/join",
    description: "",
    eyebrow: "Campaign Example",
    goalLabel: "",
    progressPercent: 0,
    raisedLabel: "",
    title: "",
  };
}

export function SiteContentForm({
  content,
  saved,
}: {
  content: SiteContent;
  saved: boolean;
}) {
  const [spotlights, setSpotlights] = useState(content.spotlights);
  const [sponsors, setSponsors] = useState(content.sponsors);
  const [events, setEvents] = useState(content.events);
  const [impactStats, setImpactStats] = useState(content.impactStats);
  const [fundraisingCampaigns, setFundraisingCampaigns] = useState(
    content.fundraisingCampaigns,
  );
  const serializedContent = useMemo(
    () =>
      JSON.stringify({
        events,
        fundraisingCampaigns,
        impactStats,
        sponsors,
        spotlights,
      }),
    [events, fundraisingCampaigns, impactStats, sponsors, spotlights],
  );

  function updateSpotlight(index: number, updates: Partial<SiteSpotlight>) {
    setSpotlights((current) =>
      current.map((spotlight, currentIndex) =>
        currentIndex === index ? { ...spotlight, ...updates } : spotlight,
      ),
    );
  }

  function updateEvent(index: number, updates: Partial<SiteEvent>) {
    setEvents((current) =>
      current.map((event, currentIndex) =>
        currentIndex === index ? { ...event, ...updates } : event,
      ),
    );
  }

  function updateSponsor(index: number, updates: Partial<SiteSponsor>) {
    setSponsors((current) =>
      current.map((sponsor, currentIndex) =>
        currentIndex === index ? { ...sponsor, ...updates } : sponsor,
      ),
    );
  }

  function updateImpactStat(index: number, updates: Partial<SiteImpactStat>) {
    setImpactStats((current) =>
      current.map((stat, currentIndex) =>
        currentIndex === index ? { ...stat, ...updates } : stat,
      ),
    );
  }

  function updateFundraisingCampaign(
    index: number,
    updates: Partial<SiteFundraisingCampaign>,
  ) {
    setFundraisingCampaigns((current) =>
      current.map((campaign, currentIndex) =>
        currentIndex === index ? { ...campaign, ...updates } : campaign,
      ),
    );
  }

  function moveImpactStat(index: number, direction: -1 | 1) {
    setImpactStats((current) => {
      const next = [...current];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function moveFundraisingCampaign(index: number, direction: -1 | 1) {
    setFundraisingCampaigns((current) => {
      const next = [...current];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function moveSponsor(index: number, direction: -1 | 1) {
    setSponsors((current) => {
      const next = [...current];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function moveEvent(index: number, direction: -1 | 1) {
    setEvents((current) => {
      const next = [...current];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current;
      }

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  return (
    <form action="/admin/settings/site-content/save" className="space-y-6" method="post">
      <input name="site_content" type="hidden" value={serializedContent} />

      {saved ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
          Site content saved.
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Alumni Spotlights</h2>
            <p className="mt-2 text-gray-400">
              Manage the people featured on the homepage.
            </p>
          </div>
          <button
            className="rounded-md border border-white/15 px-4 py-3 text-sm font-black text-gray-200 hover:border-blue-500 hover:text-white"
            onClick={() => setSpotlights((current) => [...current, blankSpotlight()])}
            type="button"
          >
            Add Spotlight
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {spotlights.map((spotlight, index) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              key={index}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Spotlight {index + 1}
                </p>
                <button
                  className="rounded-md px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40"
                  onClick={() =>
                    setSpotlights((current) =>
                      current.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                  type="button"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-gray-200">
                  Name
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateSpotlight(index, { name: event.target.value })
                    }
                    value={spotlight.name}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Class of
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateSpotlight(index, { classYear: event.target.value })
                    }
                    placeholder="Class of '21"
                    value={spotlight.classYear}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200 md:col-span-2">
                  Photo path
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateSpotlight(index, { imageUrl: event.target.value })
                    }
                    placeholder="/images/example.webp"
                    value={spotlight.imageUrl}
                  />
                  <span className="mt-2 block text-xs leading-5 text-gray-500">
                    Use images saved in the site, such as /images/example.webp.
                  </span>
                </label>
                <label className="block text-sm font-bold text-gray-200 md:col-span-2">
                  Descriptor
                  <textarea
                    className={`${fieldClass} min-h-24 resize-y`}
                    onChange={(event) =>
                      updateSpotlight(index, { descriptor: event.target.value })
                    }
                    value={spotlight.descriptor}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Impact Stats</h2>
            <p className="mt-2 text-gray-400">
              Demo homepage stat boxes shown near the fundraising campaign.
            </p>
          </div>
          <button
            className="rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-600"
            onClick={() => setImpactStats((current) => [...current, blankImpactStat()])}
            type="button"
          >
            Add Stat
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {impactStats.map((stat, index) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              key={index}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Stat {index + 1}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => moveImpactStat(index, -1)}
                    type="button"
                  >
                    Move Up
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500 disabled:opacity-40"
                    disabled={index === impactStats.length - 1}
                    onClick={() => moveImpactStat(index, 1)}
                    type="button"
                  >
                    Move Down
                  </button>
                  <button
                    className="rounded-md px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40"
                    onClick={() =>
                      setImpactStats((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-gray-200">
                  Number / value
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateImpactStat(index, { value: event.target.value })
                    }
                    placeholder="146"
                    value={stat.value}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Label
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateImpactStat(index, { label: event.target.value })
                    }
                    placeholder="Student Athletes"
                    value={stat.label}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Fundraising Campaign Slider</h2>
            <p className="mt-2 text-gray-400">
              Demo homepage campaign cards with a goal, progress, and support
              button.
            </p>
          </div>
          <button
            className="rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-600"
            onClick={() =>
              setFundraisingCampaigns((current) => [
                ...current,
                blankFundraisingCampaign(),
              ])
            }
            type="button"
          >
            Add Campaign
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {fundraisingCampaigns.map((campaign, index) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              key={index}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Campaign {index + 1}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => moveFundraisingCampaign(index, -1)}
                    type="button"
                  >
                    Move Up
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500 disabled:opacity-40"
                    disabled={index === fundraisingCampaigns.length - 1}
                    onClick={() => moveFundraisingCampaign(index, 1)}
                    type="button"
                  >
                    Move Down
                  </button>
                  <button
                    className="rounded-md px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40"
                    onClick={() =>
                      setFundraisingCampaigns((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-gray-200">
                  Eyebrow
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        eyebrow: event.target.value,
                      })
                    }
                    placeholder="Campaign Example"
                    value={campaign.eyebrow}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Campaign title
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, { title: event.target.value })
                    }
                    placeholder="New Team Rooms"
                    value={campaign.title}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200 md:col-span-2">
                  Description
                  <textarea
                    className={`${fieldClass} min-h-24 resize-y`}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        description: event.target.value,
                      })
                    }
                    value={campaign.description}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Raised label
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        raisedLabel: event.target.value,
                      })
                    }
                    placeholder="$78,450"
                    value={campaign.raisedLabel}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Goal label
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        goalLabel: event.target.value,
                      })
                    }
                    placeholder="Raised of $125,000"
                    value={campaign.goalLabel}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Progress percent
                  <input
                    className={fieldClass}
                    max={100}
                    min={0}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        progressPercent: Number(event.target.value),
                      })
                    }
                    type="number"
                    value={campaign.progressPercent}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Button text
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        buttonLabel: event.target.value,
                      })
                    }
                    placeholder="Support the Project"
                    value={campaign.buttonLabel}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200 md:col-span-2">
                  Button URL
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateFundraisingCampaign(index, {
                        buttonUrl: event.target.value,
                      })
                    }
                    placeholder="/join"
                    value={campaign.buttonUrl}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Sponsor Scroll</h2>
            <p className="mt-2 text-gray-400">
              Edit the sponsor labels and optional click-through links shown on
              the homepage.
            </p>
          </div>
          <button
            className="rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-600"
            onClick={() => setSponsors((current) => [...current, blankSponsor()])}
            type="button"
          >
            Add Sponsor
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {sponsors.map((sponsor, index) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              key={index}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Sponsor {index + 1}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => moveSponsor(index, -1)}
                    type="button"
                  >
                    Move Up
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500 disabled:opacity-40"
                    disabled={index === sponsors.length - 1}
                    onClick={() => moveSponsor(index, 1)}
                    type="button"
                  >
                    Move Down
                  </button>
                  <button
                    className="rounded-md px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40"
                    onClick={() =>
                      setSponsors((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-gray-200">
                  Sponsor text
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateSponsor(index, { name: event.target.value })
                    }
                    placeholder="Leave blank if needed"
                    value={sponsor.name}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Link URL
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateSponsor(index, { linkUrl: event.target.value })
                    }
                    placeholder="https://..."
                    value={sponsor.linkUrl}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Events</h2>
            <p className="mt-2 text-gray-400">
              The homepage shows three at a time and slides through additional
              listings.
            </p>
          </div>
          <button
            className="rounded-md bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-600"
            onClick={() => setEvents((current) => [...current, blankEvent()])}
            type="button"
          >
            Add Event
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {events.map((eventItem, index) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              key={index}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[3px] text-gray-500">
                  Event {index + 1}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500"
                    disabled={index === 0}
                    onClick={() => moveEvent(index, -1)}
                    type="button"
                  >
                    Move Up
                  </button>
                  <button
                    className="rounded-md border border-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:border-blue-500"
                    disabled={index === events.length - 1}
                    onClick={() => moveEvent(index, 1)}
                    type="button"
                  >
                    Move Down
                  </button>
                  <button
                    className="rounded-md px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40"
                    onClick={() =>
                      setEvents((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-bold text-gray-200">
                  Event Title
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateEvent(index, { title: event.target.value })
                    }
                    value={eventItem.title}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Date
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateEvent(index, { date: event.target.value })
                    }
                    placeholder="September 18, 2026"
                    value={eventItem.date}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Link button text
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateEvent(index, { linkLabel: event.target.value })
                    }
                    placeholder="Details"
                    value={eventItem.linkLabel}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200">
                  Link URL
                  <input
                    className={fieldClass}
                    onChange={(event) =>
                      updateEvent(index, { linkUrl: event.target.value })
                    }
                    placeholder="https://..."
                    value={eventItem.linkUrl}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-200 md:col-span-2">
                  Notes
                  <textarea
                    className={`${fieldClass} min-h-24 resize-y`}
                    onChange={(event) =>
                      updateEvent(index, { notes: event.target.value })
                    }
                    value={eventItem.notes}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button
        className="w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
        type="submit"
      >
        Save Site Content
      </button>
    </form>
  );
}
