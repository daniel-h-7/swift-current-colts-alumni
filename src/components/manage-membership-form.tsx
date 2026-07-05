"use client";

import { FormEvent, useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export function ManageMembershipForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/membership/portal", {
        body: JSON.stringify({
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(result?.error ?? "Unable to send the management link.");
      }

      setStatus("success");
      setMessage(
        "If that email has an active Stripe membership, a secure management link has been sent.",
      );
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the management link.",
      );
    }
  }

  return (
    <form
      className="mt-8 rounded-3xl border border-white/10 bg-zinc-950/85 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur md:p-8"
      onSubmit={handleSubmit}
    >
      <label className="block text-sm font-bold text-gray-200">
        Membership email
        <input
          className={fieldClass}
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>

      <button
        className="mt-6 w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-70"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Sending Link..." : "Email Management Link"}
      </button>

      {message ? (
        <div
          className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${
            status === "error"
              ? "border-red-500/30 bg-red-950/40 text-red-200"
              : "border-blue-500/30 bg-blue-950/40 text-blue-200"
          }`}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
