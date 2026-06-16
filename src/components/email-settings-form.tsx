"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmailSettings } from "@/lib/email-settings";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

type EmailSettingsFormProps = {
  defaultSettings: EmailSettings;
  saved?: boolean;
};

export function EmailSettingsForm({
  defaultSettings,
  saved = false,
}: EmailSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">(
    saved ? "saved" : "idle",
  );
  const [message, setMessage] = useState(
    saved ? "Email settings saved." : "",
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    const form = event.currentTarget;
    const response = await fetch(form.action, {
      body: new FormData(form),
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
      method: "POST",
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as
      | { error?: string; ok?: boolean }
      | null;

    if (!response?.ok) {
      setStatus("error");
      setMessage(
        result?.error || "Unable to save email settings. Please try again.",
      );
      return;
    }

    setStatus("saved");
    setMessage("Email settings saved.");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form
      action="/admin/settings/email"
      className="mt-6 space-y-5"
      method="post"
      onSubmit={handleSubmit}
    >
      {status === "saved" ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/40 p-4 text-sm font-bold text-blue-200">
          {message}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm font-bold text-red-200">
          {message}
        </div>
      ) : null}

      <label className="block text-sm font-bold text-gray-200">
        Sender name
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_from_name}
          name="email_from_name"
          placeholder="Colts Alumni"
          required
        />
      </label>

      <label className="block text-sm font-bold text-gray-200">
        From email
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_from_address}
          name="email_from_address"
          placeholder="updates@your-sending-domain.com"
          required
          type="email"
        />
      </label>

      <label className="block text-sm font-bold text-gray-200">
        Reply-to email
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_reply_to}
          name="email_reply_to"
          placeholder="alumni@coltsfootball.ca"
          type="email"
        />
      </label>

      <label className="block text-sm font-bold text-gray-200">
        Sending domain
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_sending_domain}
          name="email_sending_domain"
          placeholder="updates.yourdomain.com"
        />
      </label>

      <div className="rounded-2xl border border-red-500/25 bg-red-950/25 p-4 text-sm leading-6 text-red-100">
        The from email must belong to a domain verified with your email
        provider. If Wix blocks DNS access, use a separate sending domain with
        DNS you control.
      </div>

      <button
        className="w-full rounded-full bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Save Email Settings"}
      </button>
    </form>
  );
}
