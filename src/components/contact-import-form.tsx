"use client";

import { useState } from "react";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-black file:text-white hover:file:bg-blue-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export function ContactImportForm() {
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action="/admin/import/upload"
      className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
      encType="multipart/form-data"
      method="post"
      onSubmit={() => {
        setIsSubmitting(true);
      }}
    >
      <h2 className="text-2xl font-black">Upload CSV</h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        Imports update existing contacts by email or create new contacts.
        Download the sample first so the columns match.
      </p>

      <label className="mt-6 block text-sm font-bold text-gray-200">
        CSV file
        <input
          accept=".csv,text/csv"
          className={fieldClass}
          name="csv_file"
          onChange={(event) => {
            setFileName(event.currentTarget.files?.[0]?.name ?? "");
            setIsSubmitting(false);
          }}
          required
          type="file"
        />
      </label>

      {fileName ? (
        <div className="mt-3 rounded-md border border-blue-500/35 bg-blue-950/45 px-4 py-3 text-sm font-black text-blue-200">
          Selected file: <span className="text-white">{fileName}</span>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-black uppercase tracking-[2px] text-gray-400">
          Opt-In Handling
        </p>
        <div className="mt-4 space-y-3 text-sm font-bold text-gray-200">
          <label className="flex gap-3">
            <input
              defaultChecked
              name="opt_in_mode"
              type="radio"
              value="all_no"
            />
            Set imported contacts to not opted in
          </label>
          <label className="flex gap-3">
            <input name="opt_in_mode" type="radio" value="from_csv" />
            Use email_opt_in and sms_opt_in columns from CSV
          </label>
          <label className="flex gap-3">
            <input name="opt_in_mode" type="radio" value="all_yes" />
            Set imported contacts to opted in
          </label>
        </div>
        <p className="mt-4 text-xs leading-5 text-red-200">
          Only choose opted in if the club has permission to contact these
          people.
        </p>
      </div>

      <button
        className="mt-6 w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600 disabled:cursor-wait disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Importing Contacts..." : "Import Contacts"}
      </button>
    </form>
  );
}
