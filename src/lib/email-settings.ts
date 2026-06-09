import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type EmailSettings = {
  id: "default";
  email_from_address: string;
  email_from_name: string;
  email_reply_to: string;
  email_sending_domain: string;
  updated_at?: string;
};

export const defaultEmailSettings: EmailSettings = {
  id: "default",
  email_from_address: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
  email_from_name: "Colts Alumni",
  email_reply_to: process.env.RESEND_REPLY_TO_EMAIL ?? "",
  email_sending_domain: "",
};

export function formatFromEmail(settings: EmailSettings) {
  const name = settings.email_from_name.trim();
  const address = settings.email_from_address.trim();

  return name ? `${name} <${address}>` : address;
}

export async function getEmailSettings() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("crm_settings")
      .select(
        "id, email_from_address, email_from_name, email_reply_to, email_sending_domain, updated_at",
      )
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return defaultEmailSettings;
    }

    return {
      ...defaultEmailSettings,
      ...data,
    } as EmailSettings;
  } catch {
    return defaultEmailSettings;
  }
}
