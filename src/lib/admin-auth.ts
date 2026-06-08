import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnvValue } from "@/lib/supabase/server";

const adminCookieName = "colts_admin_session";
const tokenPayload = "colts-admin";

function getAdminSecret() {
  return (
    getServerEnvValue("ADMIN_SESSION_SECRET") ??
    getServerEnvValue("ADMIN_PASSWORD")
  );
}

function signToken() {
  const secret = getAdminSecret();

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

export function isAdminPasswordConfigured() {
  return Boolean(getServerEnvValue("ADMIN_PASSWORD"));
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = getServerEnvValue("ADMIN_PASSWORD");

  if (!configuredPassword) {
    return false;
  }

  return password === configuredPassword;
}

export async function isAdminAuthenticated() {
  const expectedToken = signToken();

  if (!expectedToken) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(adminCookieName)?.value;

  return Boolean(sessionToken && isSameToken(sessionToken, expectedToken));
}

export async function createAdminSession() {
  const token = signToken();

  if (!token) {
    throw new Error("Missing ADMIN_PASSWORD or ADMIN_SESSION_SECRET.");
  }

  const cookieStore = await cookies();

  cookieStore.set(adminCookieName, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/admin",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.delete(adminCookieName);
}
