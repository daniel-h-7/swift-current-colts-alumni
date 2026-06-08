import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readLocalEnvValue(key: string) {
  try {
    const envFile = readFileSync(join(projectRoot, ".env.local"), "utf8");
    const line = envFile
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));

    return line?.split("=").slice(1).join("=").trim();
  } catch {
    return undefined;
  }
}

function getEnvValue(key: string) {
  return process.env[key] || readLocalEnvValue(key);
}

export function createServerSupabaseClient() {
  const supabaseUrl = getEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey =
    getEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    getEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and a public Supabase key.",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
