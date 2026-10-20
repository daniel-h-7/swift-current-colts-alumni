"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { parsePasswordRecoveryFragment, validateNewPassword } from "@/lib/password-recovery";

const fieldClass = "mt-2 w-full rounded-xl border border-[#dfcc9a] bg-white px-4 py-3 text-[#17130d] outline-none focus:border-[#785d25] focus:ring-2 focus:ring-[#c5a45b]/25";
const buttonClass = "mt-6 w-full rounded-full bg-[#17130d] px-6 py-4 font-bold text-white transition hover:bg-[#362b19] disabled:cursor-not-allowed disabled:opacity-50";

export function PasswordRecoveryForm({ mode }: { mode: "request" | "reset" }) {
  const client = useRef<ReturnType<typeof createBrowserSupabaseClient> | null>(null);
  const initialization = useRef<Promise<void> | null>(null);
  const [ready, setReady] = useState(mode === "request");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "reset") return;
    let active = true;
    // Keep a single verification promise across React's development effect replay.
    if (!initialization.current) {
      initialization.current = (async () => {
        const hash = window.location.hash;
        // Remove credentials from the address bar, including malformed/expired links.
        window.history.replaceState(null, "", window.location.pathname);
        const tokens = parsePasswordRecoveryFragment(hash);
        client.current = createBrowserSupabaseClient({ recovery: true });
        const { error: sessionError } = await client.current.auth.setSession(tokens);
        if (sessionError) throw new Error("This reset link has expired or is invalid. Request a new one.");
        const { data, error: userError } = await client.current.auth.getUser();
        if (userError || !data.user) throw new Error("Unable to verify this reset link. Request a new one.");
      })();
    }
    initialization.current.then(() => {
      if (active) setReady(true);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to verify this reset link.");
    });
    return () => { active = false; };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready) return;
    setError("");
    const data = new FormData(event.currentTarget);
    if (mode === "reset") {
      const validation = validateNewPassword(String(data.get("password") ?? ""), String(data.get("confirmation") ?? ""));
      if (validation) { setError(validation); return; }
    }
    setBusy(true);
    try {
      if (mode === "request") {
        const supabase = createBrowserSupabaseClient({ recovery: true });
        const { error: sendError } = await supabase.auth.resetPasswordForEmail(String(data.get("email") ?? "").trim(), {
          redirectTo: `${window.location.origin}/studio/reset-password`,
        });
        if (sendError) throw new Error("We couldn't send a reset link right now. Please wait a moment and try again.");
        setSent(true);
      } else {
        if (!client.current) throw new Error("Request a new password reset link.");
        const { error: updateError } = await client.current.auth.updateUser({ password: String(data.get("password") ?? "") });
        if (updateError) throw new Error(updateError.message);
        // Studio uses its own server cookie; require normal login with the new password.
        await client.current.auth.signOut({ scope: "local" });
        window.location.assign("/studio/login?reset=success");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[2rem] border border-[#e9e1d1] bg-white p-8 shadow-[0_16px_50px_rgba(23,19,13,0.06)]">
      <h2 className="text-3xl font-black tracking-tight">{mode === "request" ? "Let's get you back in." : "A fresh start."}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "request" ? "Enter your Studio email and we’ll send you a link to choose a new password." : "Choose a new password for your Studio account. Use at least 8 characters."}</p>
      {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      {sent ? <p role="status" className="mt-5 rounded-xl bg-[#faf7ef] p-4 text-sm leading-6">If an account exists for that email, you’ll receive a reset link. Check your inbox and spam folder.</p> : mode === "request" ? (
        <><label className="mt-6 block text-sm font-bold">Email<input className={fieldClass} name="email" type="email" autoComplete="email" required /></label><button className={buttonClass} disabled={busy} type="submit">{busy ? "Sending…" : "Send reset link"}</button></>
      ) : ready ? (
        <><label className="mt-6 block text-sm font-bold">New password<input className={fieldClass} name="password" type="password" autoComplete="new-password" minLength={8} required /></label><label className="mt-5 block text-sm font-bold">Confirm new password<input className={fieldClass} name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label><button className={buttonClass} disabled={busy} type="submit">{busy ? "Saving…" : "Save new password"}</button></>
      ) : !error ? <p role="status" className="mt-5 text-sm">Checking your reset link…</p> : null}
      <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-[#785d25]">
        <Link className="underline underline-offset-4" href="/studio/login">Back to login</Link>
        {mode === "reset" && error ? <Link className="underline underline-offset-4" href="/studio/forgot-password">Request a new link</Link> : null}
      </div>
    </form>
  );
}
