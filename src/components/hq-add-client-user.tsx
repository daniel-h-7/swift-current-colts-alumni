"use client";
import { useState } from "react";
export function HqAddClientUser({clientId}:{clientId:string}){
  const [open,setOpen]=useState(false);const [saving,setSaving]=useState(false);
  const input="mt-2 w-full rounded-xl border border-[#dfcc9a] bg-white px-4 py-3 text-slate-950";
  return <div className="mt-5">
    {!open?<button type="button" onClick={()=>setOpen(true)} className="rounded-full bg-[#17130d] px-5 py-3 text-sm font-bold text-white">+ Add account</button>:<form action={`/hq/clients/${encodeURIComponent(clientId)}/users/add`} method="post" onSubmit={()=>setSaving(true)} className="rounded-2xl bg-[#faf7ef] p-5">
      <h3 className="text-lg font-black">Add a Studio account</h3><p className="mt-2 text-sm leading-6 text-slate-600">An existing login will be linked to this client. A new user will receive an email invitation to set their password.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3"><label className="text-sm font-bold">Account email<input className={input} name="email" type="email" required maxLength={254}/></label><label className="text-sm font-bold">Name (optional)<input className={input} name="full_name"/></label><label className="text-sm font-bold">Role<select name="role" className={input} defaultValue="owner"><option value="owner">Owner</option><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></label></div>
      <div className="mt-5 flex gap-3"><button type="submit" disabled={saving} className="rounded-full bg-[#17130d] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving?"Adding…":"Add account / send invitation"}</button><button type="button" disabled={saving} onClick={()=>setOpen(false)} className="rounded-full px-5 py-3 text-sm font-bold">Cancel</button></div>
    </form>}
  </div>;
}
