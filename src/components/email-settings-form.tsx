"use client";

import { AdminForm } from "@/components/admin-navigation";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmailSettings } from "@/lib/email-settings";

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#dedfd7] bg-white px-4 py-3 text-[#171917] outline-none transition focus:border-[#785d25] focus:ring-2 focus:ring-[#c5a45b]/25";

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
    <AdminForm
      action="/admin/settings/email"
      className="space-y-5"
      method="post"
      onSubmit={handleSubmit}
    >
      {status === "saved" ? (
        <div className="border-l-2 border-[#c5a45b] pl-4 text-sm font-bold text-[#785d25]">
          {message}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="text-sm font-bold text-red-800">
          {message}
        </div>
      ) : null}

      <label className="block text-sm font-bold text-[#171917]">
        Sender name
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_from_name}
          name="email_from_name"
          placeholder="Your Team"
          required
        />
      </label>

      <label className="block text-sm font-bold text-[#171917]">
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

      <label className="block text-sm font-bold text-[#171917]">
        Reply-to email
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_reply_to}
          name="email_reply_to"
          placeholder="alumni@yourteam.com"
          type="email"
        />
      </label>

      <label className="block text-sm font-bold text-[#171917]">
        Sending domain
        <input
          className={fieldClass}
          defaultValue={defaultSettings.email_sending_domain}
          name="email_sending_domain"
          placeholder="updates.yourdomain.com"
        />
      </label>

      <div className="border-l-2 border-[#c5a45b] pl-4 text-sm leading-6 text-[#62675e]">
        The from email must belong to a domain verified with your email
        provider. Use the TeamAlum sender supplied by HQ unless your team has
        configured its own verified sending domain.
      </div>

      <button
        className="rounded-full bg-[#171917] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#785d25] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Save Email Settings"}
      </button>
    </AdminForm>
  );
}
