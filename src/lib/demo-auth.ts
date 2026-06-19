import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnvValue } from "@/lib/supabase/server";

export const demoCookieName = "teamalum_demo_session";

function getDemoPassword() {
  return getServerEnvValue("DEMO_PASSWORD");
}

function getDemoSecret() {
  return getServerEnvValue("DEMO_SESSION_SECRET") ?? getDemoPassword();
}

function createDemoToken() {
  const password = getDemoPassword();
  const secret = getDemoSecret();

  if (!password || !secret) {
    return undefined;
  }

  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export function isDemoPasswordConfigured() {
  return Boolean(getDemoPassword());
}

export function verifyDemoPassword(password: string) {
  const configuredPassword = getDemoPassword();

  return Boolean(configuredPassword && password === configuredPassword);
}

export async function createDemoSession() {
  const token = createDemoToken();

  if (!token) {
    throw new Error("Missing DEMO_PASSWORD.");
  }

  const cookieStore = await cookies();

  cookieStore.set(demoCookieName, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
