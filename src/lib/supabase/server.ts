import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const checkedEnvPaths = new Set<string>();

function findLocalEnvFile() {
  const startPaths = [
    process.cwd(),
    dirname(fileURLToPath(import.meta.url)),
    "/Users/danherick/gridiron-alumni/gridiron-alumni",
  ];

  for (const startPath of startPaths) {
    let currentPath = startPath;

    for (let depth = 0; depth < 8; depth += 1) {
      const envPath = join(currentPath, ".env.local");
      checkedEnvPaths.add(envPath);

      if (existsSync(envPath)) {
        return envPath;
      }

      const parentPath = dirname(currentPath);

      if (parentPath === currentPath) {
        break;
      }

      currentPath = parentPath;
    }
  }

  return undefined;
}

function readLocalEnvValue(key: string) {
  try {
    const envPath = findLocalEnvFile();

    if (!envPath) {
      return undefined;
    }

    const envFile = readFileSync(envPath, "utf8");
    const line = envFile
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));

    return line?.split("=").slice(1).join("=").trim();
  } catch {
    return undefined;
  }
}

export function getServerEnvValue(key: string) {
  return process.env[key] || readLocalEnvValue(key);
}

export function createServerSupabaseClient() {
  const supabaseUrl = getServerEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey =
    getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY") ??
    getServerEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    getServerEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing NEXT_PUBLIC_SUPABASE_URL and a Supabase key. Checked: ${Array.from(
        checkedEnvPaths,
      ).join(", ")}`,
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}
