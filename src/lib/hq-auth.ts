import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnvValue } from "@/lib/supabase/server";

const hqCookieName = "teamalum_hq_session";
const tokenPayload = "teamalum-hq-admin";

function getHqSecret() {
  return (
    getServerEnvValue("TEAMALUM_HQ_SESSION_SECRET") ??
    getServerEnvValue("ADMIN_SESSION_SECRET") ??
    getServerEnvValue("TEAMALUM_HQ_PASSWORD") ??
    getServerEnvValue("ADMIN_PASSWORD")
  );
}

function getHqPassword() {
  return getServerEnvValue("TEAMALUM_HQ_PASSWORD") ?? getServerEnvValue("ADMIN_PASSWORD");
}

function signToken() {
  const secret = getHqSecret();

  if (!secret) {
    return undefined;
  }

  return createHmac("sha256", secret).update(tokenPayload).digest("hex");
}

function isSameToken(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export function isHqPasswordConfigured() {
  return Boolean(getHqPassword());
}

export function verifyHqPassword(password: string) {
  const configuredPassword = getHqPassword();

  if (!configuredPassword) {
    return false;
  }

  return password === configuredPassword;
}

export async function isHqAuthenticated() {
  const expectedToken = signToken();

  if (!expectedToken) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(hqCookieName)?.value;

  return Boolean(sessionToken && isSameToken(sessionToken, expectedToken));
}

export async function createHqSession() {
  const token = signToken();

  if (!token) {
    throw new Error("Missing TEAMALUM_HQ_PASSWORD or TEAMALUM_HQ_SESSION_SECRET.");
  }

  const cookieStore = await cookies();

  cookieStore.set(hqCookieName, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/hq",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearHqSession() {
  const cookieStore = await cookies();

  cookieStore.delete(hqCookieName);
}
