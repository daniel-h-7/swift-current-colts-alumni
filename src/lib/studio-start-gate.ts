import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnvValue } from "@/lib/supabase/server";

const startGateCookieName = "teamalum_studio_start_gate";
const tokenPayload = "teamalum-studio-start";

function getStartPassword() {
  return (
    getServerEnvValue("TEAMALUM_STUDIO_START_PASSWORD") ??
    getServerEnvValue("TEAMALUM_HQ_PASSWORD") ??
    getServerEnvValue("ADMIN_PASSWORD")
  );
}

function getStartSecret() {
  return (
    getServerEnvValue("TEAMALUM_STUDIO_START_SECRET") ??
    getServerEnvValue("TEAMALUM_STUDIO_SESSION_SECRET") ??
    getServerEnvValue("TEAMALUM_HQ_SESSION_SECRET") ??
    getStartPassword()
  );
}

function signToken() {
  const secret = getStartSecret();

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

export function isStudioStartPasswordConfigured() {
  return Boolean(getStartPassword());
}

export function verifyStudioStartPassword(password: string) {
  const configuredPassword = getStartPassword();

  if (!configuredPassword) {
    return false;
  }

  return password === configuredPassword;
}

export async function isStudioStartUnlocked() {
  const expectedToken = signToken();

  if (!expectedToken) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(startGateCookieName)?.value;

  return Boolean(sessionToken && isSameToken(sessionToken, expectedToken));
}

export async function createStudioStartUnlock() {
  const token = signToken();

  if (!token) {
    throw new Error("Missing TEAMALUM_STUDIO_START_PASSWORD.");
  }

  const cookieStore = await cookies();

  cookieStore.set(startGateCookieName, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/studio",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
