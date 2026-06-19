"use client";

import { useMemo, useState } from "react";

const shareText =
  "I invite you to join me in supporting Swift Current Colts Football. As an alumni or booster, our gift can make a lasting impact on our young student-athletes!";

const buttonClass =
  "rounded-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-black text-gray-100 transition hover:border-red-500 hover:bg-red-950/40 hover:text-white";

type SharePlatform = {
  label: string;
  url: (shareUrl: string) => string;
};

const sharePlatforms: SharePlatform[] = [
  {
    label: "Facebook",
    url: (shareUrl) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl,
      )}`,
  },
  {
    label: "Messenger",
    url: (shareUrl) =>
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(
        shareUrl,
      )}&redirect_uri=${encodeURIComponent(shareUrl)}`,
  },
  {
    label: "Twitter",
    url: (shareUrl) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText,
      )}&url=${encodeURIComponent(shareUrl)}`,
  },
  {
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

  async function copyCaption() {
    await navigator.clipboard.writeText(caption);
    setCopyMessage("Caption copied.");
    window.setTimeout(() => setCopyMessage(""), 2400);
  }

  async function openInstagram(path: "profile" | "messages") {
    await copyCaption();
    window.open(
      path === "messages"
        ? "https://www.instagram.com/direct/inbox/"
        : "https://www.instagram.com/",
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs font-black uppercase tracking-[3px] text-red-400">
        Amplify the Legacy
      </p>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-400">
        Invite another alumni, family member, or supporter to join you.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sharePlatforms.map((platform) => (
          <a
            className={buttonClass}
            href={platform.url(resolvedShareUrl)}
            key={platform.label}
            rel="noopener noreferrer"
            target="_blank"
          >
            {platform.label}
          </a>
        ))}

        <button
          className={buttonClass}
          onClick={() => openInstagram("profile")}
          type="button"
        >
          Instagram
        </button>
        <button
          className={buttonClass}
          onClick={() => openInstagram("messages")}
          type="button"
        >
          IG Messenger
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
