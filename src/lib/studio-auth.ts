import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerSupabaseClient, getServerEnvValue } from "@/lib/supabase/server";

const studioCookieName = "teamalum_studio_session";

export type StudioSession = {
  authUserId: string;
  email: string;
};

function getStudioSecret() {
  return (
    getServerEnvValue("TEAMALUM_STUDIO_SESSION_SECRET") ??
    getServerEnvValue("TEAMALUM_HQ_SESSION_SECRET") ??
    getServerEnvValue("ADMIN_SESSION_SECRET")
  );
}

function createAuthSupabaseClient() {
  const supabaseUrl = getServerEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey =
    getServerEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    getServerEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase public auth configuration.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

function signPayload(payload: string) {
  const secret = getStudioSecret();

  if (!secret) {
    throw new Error("Missing TEAMALUM_STUDIO_SESSION_SECRET.");
  }

  return createHmac("sha256", secret).update(payload).digest("hex");
}

function encodeSession(session: StudioSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(value: string): StudioSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());

    if (
      typeof parsed.authUserId !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null;
    }

    return {
      authUserId: parsed.authUserId,
      email: parsed.email,
    };
  } catch {
    return null;
  }
}

export async function getStudioSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(studioCookieName)?.value;

  if (!sessionToken) {
    return null;
  }

  return decodeSession(sessionToken);
}

export async function createStudioSession(session: StudioSession) {
  const cookieStore = await cookies();

  cookieStore.set(studioCookieName, encodeSession(session), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/studio",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearStudioSession() {
  const cookieStore = await cookies();

  cookieStore.delete(studioCookieName);
}

export async function signInStudioUser(email: string, password: string) {
  const supabase = createAuthSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.id || !data.user.email) {
    throw new Error(error?.message || "Unable to sign in.");
  }

  return {
    authUserId: data.user.id,
    email: data.user.email,
  };
}

export async function createStudioUser(email: string, password: string) {
  const supabase = createServerSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password,
  });

  if (error || !data.user?.id) {
    throw new Error(error?.message || "Unable to create your login.");
  }

  return {
    authUserId: data.user.id,
    email: data.user.email ?? normalizedEmail,
  };
}

export async function addStudioClientUser({
  authUserId,
  clientId,
  email,
  fullName,
  role = "owner",
}: {
  authUserId: string;
  clientId: string;
  email: string;
  fullName?: string;
  role?: "owner" | "admin" | "editor" | "viewer";
}) {
  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("client_users").upsert(
    {
      auth_user_id: authUserId,
      client_id: clientId,
      email: email.trim().toLowerCase(),
      full_name: fullName?.trim() || null,
      role,
      updated_at: now,
    },
    {
      onConflict: "client_id,auth_user_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getStudioClientIdsForUser(authUserId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => row.client_id)
    .filter((clientId): clientId is string => typeof clientId === "string");
}

export async function canUserAccessStudioClient(
  authUserId: string,
  clientId: string,
) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("auth_user_id", authUserId)
    .eq("client_id", clientId)
    .maybeSingle();

  return Boolean(!error && data);
}

export async function canAccessStudioClient(clientId: string) {
  const session = await getStudioSession();

  if (!session) {
    return false;
  }

  return canUserAccessStudioClient(session.authUserId, clientId);
}
