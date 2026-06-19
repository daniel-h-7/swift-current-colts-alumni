"use client";

import { useMemo, useState } from "react";

const shareText =
  "I invite you to join me in supporting Swift Current Colts Football. As an alumni or booster, our gift can make a lasting impact on our young student-athletes!";

const iconButtonClass =
  "flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-950/40 focus:outline-none focus:ring-2 focus:ring-red-500/50";
const copyButtonClass =
  "shrink-0 rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[2px] text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50";

type SharePlatform = {
  icon: React.ReactNode;
  label: string;
  url: (shareUrl: string) => string;
};

const sharePlatforms: SharePlatform[] = [
  {
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M14 8.3V6.7c0-.8.5-1 1-1h1.7V2.8c-.8-.1-1.6-.2-2.4-.2-2.5 0-4.2 1.5-4.2 4.2v1.5H7.4v3.3h2.7v8.6h3.4v-8.6h2.7l.4-3.3H14Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Facebook",
    url: (shareUrl) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl,
      )}`,
  },
  {
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M14.4 10.6 22.8 1h-2l-7.3 8.3L7.7 1H1l8.8 12.6L1 23h2l7.6-8.6L16.7 23h6.7l-9-12.4Zm-2.7 3.1-.9-1.2L3.7 2.5h3l5.7 8 .9 1.2 7.5 10.7h-3l-6.1-8.7Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Twitter / X",
    url: (shareUrl) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText,
      )}&url=${encodeURIComponent(shareUrl)}`,
  },
  {
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M5.1 7.8H1.7V22h3.4V7.8ZM3.4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm19 12.1c0-4-2.1-6.6-5.4-6.6-1.9 0-3.1 1-3.6 1.9h-.1V7.8H10V22h3.4v-7.1c0-1.9.9-3.2 2.7-3.2 1.6 0 2.4 1.1 2.4 3.1V22h3.4v-7.9Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "LinkedIn",
    url: (shareUrl) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl,
      )}`,
  },
];

export function SupportShareBar({ shareUrl }: { shareUrl?: string }) {
  const [copyMessage, setCopyMessage] = useState("");
  const resolvedShareUrl = useMemo(() => {
    if (shareUrl) {
      return shareUrl;
    }

    if (typeof window === "undefined") {
      return "/join";
    }

    return `${window.location.origin}/join`;
  }, [shareUrl]);
  const caption = `${shareText} ${resolvedShareUrl}`;

  async function copyText(text: string, message: string) {
    await navigator.clipboard.writeText(text);
    setCopyMessage(message);
    window.setTimeout(() => setCopyMessage(""), 2400);
  }

  async function openInstagram() {
    await copyText(caption, "Caption copied for Instagram.");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs font-black uppercase tracking-[3px] text-red-400">
        Amplify the Legacy
      </p>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-400">
        Invite another alumni, family member, or supporter to join you.
      </p>

      <div className="mx-auto mt-5 flex max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-black/35 p-3 text-left sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[2px] text-gray-500">
            Share Link
          </p>
          <p className="mt-1 truncate text-sm font-bold text-gray-200">
            {resolvedShareUrl}
          </p>
        </div>
        <button
          className={copyButtonClass}
          onClick={() => copyText(resolvedShareUrl, "Share link copied.")}
          type="button"
        >
          Copy Link
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {sharePlatforms.map((platform) => (
          <a
            aria-label={`Share on ${platform.label}`}
            className={iconButtonClass}
            href={platform.url(resolvedShareUrl)}
            key={platform.label}
            rel="noopener noreferrer"
            title={platform.label}
            target="_blank"
          >
            {platform.icon}
          </a>
        ))}

        <button
          aria-label="Share on Instagram"
          className={iconButtonClass}
          onClick={openInstagram}
          title="Instagram"
          type="button"
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M7.2 2.5h9.6a4.7 4.7 0 0 1 4.7 4.7v9.6a4.7 4.7 0 0 1-4.7 4.7H7.2a4.7 4.7 0 0 1-4.7-4.7V7.2a4.7 4.7 0 0 1 4.7-4.7Zm0 1.8a2.9 2.9 0 0 0-2.9 2.9v9.6a2.9 2.9 0 0 0 2.9 2.9h9.6a2.9 2.9 0 0 0 2.9-2.9V7.2a2.9 2.9 0 0 0-2.9-2.9H7.2Zm4.8 3.4a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Zm0 1.8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm4.5-2.1a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {copyMessage ? (
        <p className="mt-4 rounded-2xl border border-blue-500/25 bg-blue-950/40 px-4 py-3 text-sm font-bold text-blue-200">
          {copyMessage}
        </p>
      ) : null}
    </div>
  );
}
