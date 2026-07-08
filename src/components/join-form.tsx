"use client";

import { FormEvent, useState } from "react";
import {
  ContactInsert,
  RelationshipType,
  relationshipTypes,
  Sport,
} from "@/lib/contact-options";

type FormStatus = "idle" | "submitting" | "success" | "error";
type GiftOption = "none" | "100" | "200" | "other";

const fieldClass =
  "mt-2 w-full border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

const labelClass = "text-sm font-bold text-gray-200";

function getGiftAmountCents(formData: FormData) {
  const giftOption = String(formData.get("additional_gift_option") ?? "none");

  if (giftOption === "100" || giftOption === "200") {
    return Number(giftOption) * 100;
  }

  if (giftOption !== "other") {
    return 0;
  }

  const customAmount = Number.parseFloat(
    String(formData.get("additional_gift_amount") ?? "0"),
  );

  return Number.isFinite(customAmount)
    ? Math.max(0, Math.round(customAmount * 100))
    : 0;
}

export function JoinForm({
  headline = "Support Colts Football",
  isOpen = true,
  programName = "the Colts",
  subtext = "Your gift today helps ensure our student-athletes have the necessary tools to succeed on and off the football field.",
}: {
  headline?: string;
  isOpen?: boolean;
  programName?: string;
  subtext?: string;
}) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [giftOption, setGiftOption] = useState<GiftOption>("none");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isOpen) {
      setStatus("error");
      setMessage("Membership signups are currently closed.");
      return;
    }

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
    const checkoutPayload = {
      ...contact,
      additional_gift_amount_cents: getGiftAmountCents(formData),
    };

    try {
      const response = await fetch("/api/membership/checkout", {
        body: JSON.stringify(checkoutPayload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = "Unable to start membership checkout.";

        if (responseText) {
          try {
            const result = JSON.parse(responseText) as { error?: string };
            errorMessage = result.error ?? errorMessage;
          } catch {
            errorMessage = responseText;
          }
        }

        throw new Error(errorMessage);
      }

      const result = (await response.json()) as { checkoutUrl?: string };

      if (!result.checkoutUrl) {
        throw new Error("Membership checkout did not return a destination.");
      }

      window.location.href = result.checkoutUrl;
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
      className="border border-white/10 bg-zinc-950/90 p-6 shadow-[0_28px_90px_rgba(37,99,235,0.16)] backdrop-blur md:p-8"
    >
      <div>
        <p className="program-kicker">
          Help Build the Legacy
        </p>
        <h2 className="mt-3 text-4xl font-black text-blue-400">
          {headline}
        </h2>
        <p className="mt-4 text-gray-400">
          {subtext}
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
            <option className="bg-zinc-950" value="Football">
              Football
            </option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 border border-white/10 bg-white/[0.04] p-4 md:grid-cols-2">
        <label className="flex items-start gap-3 text-sm font-bold text-gray-200">
          <input
            className="mt-1 h-4 w-4 border-white/20 accent-blue-600"
            defaultChecked
            name="email_opt_in"
            type="checkbox"
          />
          Email opt-in
        </label>

        <label className="flex items-start gap-3 text-sm font-bold text-gray-200">
          <input
            className="mt-1 h-4 w-4 border-white/20 accent-red-600"
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

      <div className="mt-5 border border-white/10 bg-white/[0.04] p-4">
        <p className="text-lg font-black text-white">
          Looking to support in a bigger way?
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Support {programName} with an additional one-time gift. This will be
          added to the first annual membership checkout.
        </p>

        <input name="additional_gift_option" type="hidden" value={giftOption} />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["100", "$100"],
            ["200", "$200"],
            ["other", "Other"],
          ].map(([value, label]) => (
            <button
              className={`rounded-xl border px-4 py-4 font-black transition ${
                giftOption === value
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-white/10 bg-black/35 text-gray-200 hover:border-red-500/60"
              }`}
              key={value}
              onClick={() =>
                setGiftOption(giftOption === value ? "none" : (value as GiftOption))
              }
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {giftOption === "other" ? (
          <label className={`mt-4 block ${labelClass}`}>
            One-time gift amount
            <input
              className={fieldClass}
              min="1"
              name="additional_gift_amount"
              placeholder="Enter amount"
              step="1"
              type="number"
            />
          </label>
        ) : null}
      </div>

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
        className="premium-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "submitting" || !isOpen}
        type="submit"
      >
        {status === "submitting"
          ? "Saving..."
          : isOpen
            ? "Continue to Membership"
            : "Signups Closed"}
      </button>
    </form>
  );
}
