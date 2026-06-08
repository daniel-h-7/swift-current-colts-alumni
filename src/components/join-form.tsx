"use client";

import { FormEvent, useState } from "react";
import {
  ContactInsert,
  RelationshipType,
  relationshipTypes,
  Sport,
  sports,
} from "@/lib/contact-options";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type FormStatus = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

const labelClass = "text-sm font-bold text-gray-200";

export function JoinForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const graduationYear = String(
      formData.get("graduation_year") ?? "",
    ).trim();

    const contact: ContactInsert = {
      first_name: String(formData.get("first_name") ?? "").trim(),
      last_name: String(formData.get("last_name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      graduation_year: graduationYear
        ? Number.parseInt(graduationYear, 10)
        : null,
      relationship_type: String(
        formData.get("relationship_type"),
      ) as RelationshipType,
      sport: String(formData.get("sport")) as Sport,
      email_opt_in: formData.get("email_opt_in") === "on",
      sms_opt_in: formData.get("sms_opt_in") === "on",
      notes: String(formData.get("notes") ?? "").trim() || null,
    };

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.from("contacts").insert(contact);

      if (error) {
        throw error;
      }

      form.reset();
      setStatus("success");
      setMessage("You are on the Colts list. We will be in touch soon.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your contact.",
      );
    }
  }

  return (
    <form
      id="join"
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/10 bg-zinc-950/85 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur md:p-8"
    >
      <div>
        <p className="text-sm uppercase tracking-[5px] text-red-500">
          Join the Network
        </p>
        <h2 className="mt-3 text-4xl font-black text-white">
          Stay connected to Colts football.
        </h2>
        <p className="mt-4 text-gray-400">
          Add yourself to the alumni and booster CRM for events, game-night
          updates, volunteer calls, and club news.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          First name
          <input className={fieldClass} name="first_name" required />
        </label>

        <label className={labelClass}>
          Last name
          <input className={fieldClass} name="last_name" required />
        </label>

        <label className={labelClass}>
          Email
          <input className={fieldClass} name="email" required type="email" />
        </label>

        <label className={labelClass}>
          Phone
          <input className={fieldClass} name="phone" type="tel" />
        </label>

        <label className={labelClass}>
          Graduation year
          <input
            className={fieldClass}
            inputMode="numeric"
            max="2100"
            min="1940"
            name="graduation_year"
            placeholder="2009"
            type="number"
          />
        </label>

        <label className={labelClass}>
          Relationship type
          <select className={fieldClass} name="relationship_type" required>
            {relationshipTypes.map((type) => (
              <option className="bg-zinc-950" key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Sport / program
          <select className={fieldClass} name="sport" required>
            {sports.map((sport) => (
              <option className="bg-zinc-950" key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2">
        <label className="flex items-start gap-3 text-sm font-bold text-gray-200">
          <input
            className="mt-1 h-4 w-4 rounded border-white/20 accent-blue-600"
            defaultChecked
            name="email_opt_in"
            type="checkbox"
          />
          Email opt-in
        </label>

        <label className="flex items-start gap-3 text-sm font-bold text-gray-200">
          <input
            className="mt-1 h-4 w-4 rounded border-white/20 accent-red-600"
            name="sms_opt_in"
            type="checkbox"
          />
          SMS opt-in
        </label>
      </div>

      <label className={`mt-5 block ${labelClass}`}>
        Notes
        <textarea
          className={`${fieldClass} min-h-28 resize-y`}
          name="notes"
          placeholder="Tell us how you want to reconnect, volunteer, sponsor, or support."
        />
      </label>

      {message ? (
        <p
          className={`mt-5 rounded-xl border px-4 py-3 text-sm font-bold ${
            status === "error"
              ? "border-red-500/30 bg-red-950/50 text-red-200"
              : "border-blue-500/30 bg-blue-950/50 text-blue-200"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        className="mt-6 w-full rounded-full bg-red-600 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting"}
        type="submit"
      >
        {status === "submitting" ? "Saving..." : "Join the Colts Network"}
      </button>
    </form>
  );
}
