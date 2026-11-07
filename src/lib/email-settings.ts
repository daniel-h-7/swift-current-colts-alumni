import "server-only";

import { getWorkspaceClientId } from "@/lib/team-admin";
import { getPlatformClient } from "@/lib/platform-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type EmailSettings = {
  id: "default";
  email_from_address: string;
  email_from_name: string;
  email_reply_to: string;
  email_sending_domain: string;
  updated_at?: string;
};

export function getDefaultEmailSettings(clientName?: string): EmailSettings {
  return {
    id: "default",
    email_from_address: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    email_from_name: clientName || "Your Team",
    email_reply_to: process.env.RESEND_REPLY_TO_EMAIL ?? "",
    email_sending_domain: "",
  };
}

export function resolveEmailSettings(defaults: EmailSettings, saved: Partial<EmailSettings>): EmailSettings {
  const savedAddress = saved.email_from_address?.trim() || "";
  const defaultAddress = defaults.email_from_address.trim();
  const staleTestSender = /@resend\.dev$/i.test(savedAddress) &&
    defaultAddress && !/@resend\.dev$/i.test(defaultAddress);

  return {
    ...defaults,
    ...saved,
    email_from_address: !savedAddress || staleTestSender ? defaultAddress : savedAddress,
    email_from_name: saved.email_from_name ?? defaults.email_from_name,
    email_reply_to: saved.email_reply_to ?? defaults.email_reply_to,
    email_sending_domain: saved.email_sending_domain ?? defaults.email_sending_domain,
  };
}

export function formatFromEmail(settings: EmailSettings) {
  const name = settings.email_from_name.trim();
  const address = settings.email_from_address.trim();

  return name ? `${name} <${address}>` : address;
}

export async function getEmailSettings() {
  return getEmailSettingsForClient(await getWorkspaceClientId());
}

export async function getEmailSettingsForClient(clientId: string) {
  const client = await getPlatformClient(clientId);
  const defaultEmailSettings = getDefaultEmailSettings(client?.name || "TeamAlum");

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("crm_settings")
      .select(
        "id, email_from_address, email_from_name, email_reply_to, email_sending_domain, updated_at",
      )
      .eq("client_id", clientId)
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) {
      return defaultEmailSettings;
    }

    return resolveEmailSettings(defaultEmailSettings, data);
  } catch {
    return defaultEmailSettings;
  }
}
