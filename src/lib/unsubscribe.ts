import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getServerEnvValue } from "@/lib/supabase/server";

function getUnsubscribeSecret() {
  return (
    getServerEnvValue("UNSUBSCRIBE_SECRET") ??
    getServerEnvValue("ADMIN_SESSION_SECRET") ??
    getServerEnvValue("ADMIN_PASSWORD")
  );
}

function getSiteUrl() {
  return getServerEnvValue("NEXT_PUBLIC_SITE_URL")?.replace(/\/$/, "");
}

function signUnsubscribeToken(contactId: string) {
  const secret = getUnsubscribeSecret();

  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret)
    .update(`unsubscribe:${contactId}`)
    .digest("hex");
}

function isSameToken(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return (
    valueBuffer.length === expectedBuffer.length &&
    timingSafeEqual(valueBuffer, expectedBuffer)
  );
}

export function createUnsubscribeUrl(contactId: string) {
  const siteUrl = getSiteUrl();
  const token = signUnsubscribeToken(contactId);

  if (!siteUrl || !token) {
    return null;
  }

  const url = new URL("/unsubscribe", siteUrl);
  url.searchParams.set("contact", contactId);
  url.searchParams.set("token", token);

  return url.toString();
}

export function verifyUnsubscribeToken(contactId: string, token: string) {
  const expectedToken = signUnsubscribeToken(contactId);

  return Boolean(expectedToken && token && isSameToken(token, expectedToken));
}
