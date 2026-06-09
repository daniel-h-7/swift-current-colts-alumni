import "server-only";

import { Contact } from "@/lib/contact-options";
import { BlastAudienceFilter, parseAudienceFilter } from "@/lib/campaign-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function applyAudienceFilter(filter: BlastAudienceFilter) {
  const supabase = createServerSupabaseClient();
  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (filter.email_opt_in !== undefined) {
    query = query.eq("email_opt_in", filter.email_opt_in);
  }

  if (filter.sms_opt_in !== undefined) {
    query = query.eq("sms_opt_in", filter.sms_opt_in);
  }

  if (filter.graduation_year) {
    query = query.eq("graduation_year", Number.parseInt(filter.graduation_year, 10));
  }

  if (filter.relationship_type) {
    query = query.eq("relationship_type", filter.relationship_type);
  }

  if (filter.sport) {
    query = query.eq("sport", filter.sport);
  }

  if (filter.status) {
    query = query.eq("status", filter.status);
  }

  if (filter.membership_status) {
    query = query.eq("membership_status", filter.membership_status);
  }

  if (filter.paid_status === "current") {
    query = query.gte("paid_through", getTodayDate());
  }

  if (filter.paid_status === "expired") {
    query = query.lt("paid_through", getTodayDate());
  }

  if (filter.paid_status === "missing") {
    query = query.is("paid_through", null);
  }

  if (filter.tag) {
    query = query.contains("tags", [filter.tag]);
  }

  return query;
}

export async function getAudiencePreview(audienceFilter: string | null | undefined) {
  const filter = parseAudienceFilter(audienceFilter);
  const { count, data, error } = await applyAudienceFilter(filter).limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: count ?? 0,
    contacts: (data ?? []) as Contact[],
    filter,
  };
}
