"use client";

import { useState } from "react";

export type HqClientUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

export function HqClientUserEditor({ clientId, user }: { clientId: string; user: HqClientUser }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <div className="rounded-2xl border border-[#e9e1d1] bg-[#faf7ef] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#785d25]">{user.role}</p>
          {user.full_name ? <p className="mt-1 font-bold">{user.full_name}</p> : null}
          <p className="mt-1 break-all font-semibold text-slate-700">{user.email}</p>
        </div>
        {!editing ? <button className="rounded-full border border-[#dfcc9a] bg-white px-4 py-2 text-sm font-bold text-[#785d25] hover:bg-[#f1e7ce]" onClick={() => setEditing(true)} type="button" aria-label={`Edit email for ${user.email}`}>Edit email</button> : null}
      </div>
      {editing ? (
        <form action={`/hq/clients/${encodeURIComponent(clientId)}/users/email`} method="post" className="mt-5" onSubmit={() => setSaving(true)}>
          <input type="hidden" name="client_user_id" value={user.id} />
          <input type="hidden" name="expected_email" value={user.email} />
          <label className="block text-sm font-bold">Account / login email
            <input className="mt-2 w-full rounded-xl border border-[#dfcc9a] bg-white px-4 py-3 outline-none focus:border-[#785d25] focus:ring-2 focus:ring-[#c5a45b]/25" type="email" name="email" defaultValue={user.email} autoComplete="off" maxLength={254} required />
          </label>
          <p className="mt-3 text-sm leading-6 text-slate-600">This becomes the email used to log in and reset the password. Other sites using this same login will also show the updated address. The password stays the same.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-full bg-[#17130d] px-5 py-3 text-sm font-bold text-white hover:bg-[#362b19] disabled:opacity-50" type="submit" disabled={saving}>{saving ? "Saving…" : "Save email"}</button>
            <button className="rounded-full px-5 py-3 text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-50" onClick={() => setEditing(false)} type="button" disabled={saving}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
