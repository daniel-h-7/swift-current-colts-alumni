import { NextResponse } from "next/server";
import { Contact } from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  getContactStatus,
  getContactTags,
  getMembershipStatus,
} from "@/lib/contact-format";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ExportFilters = {
  q?: string;
  graduation_year?: string;
  relationship_type?: string;
  sport?: string;
  email_opt_in?: string;
  sms_opt_in?: string;
  status?: string;
  membership_status?: string;
  paid_status?: string;
  sort_by?: string;
  sort_dir?: string;
};

const sortableColumns = [
  "email",
  "phone",
  "graduation_year",
  "relationship_type",
  "sport",
  "status",
  "membership_status",
  "annual_dues_amount_cents",
  "gift_donation_amount_cents",
  "paid_through",
  "last_payment_at",
  "tags",
  "email_opt_in",
  "sms_opt_in",
  "notes",
  "created_at",
] as const;

function escapeCsv(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function row(values: Array<string | number | boolean | null | undefined>) {
  return values.map(escapeCsv).join(",");
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getFilters(request: Request): ExportFilters {
  const params = new URL(request.url).searchParams;

  return Object.fromEntries(params.entries());
}

function applyFilters(filters: ExportFilters) {
  const searchTerm = filters.q?.trim().replaceAll(",", " ");
  const ascending = filters.sort_dir === "asc";
  const supabase = createServerSupabaseClient();
  let query = supabase.from("contacts").select("*");

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`,
    );
  }

  if (filters.graduation_year) {
    query = query.eq(
      "graduation_year",
      Number.parseInt(filters.graduation_year, 10),
    );
  }

  if (filters.relationship_type) {
    query = query.eq("relationship_type", filters.relationship_type);
  }

  if (filters.sport) {
    query = query.eq("sport", filters.sport);
  }

  if (filters.email_opt_in) {
    query = query.eq("email_opt_in", filters.email_opt_in === "true");
  }

  if (filters.sms_opt_in) {
    query = query.eq("sms_opt_in", filters.sms_opt_in === "true");
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.membership_status) {
    query = query.eq("membership_status", filters.membership_status);
  }

  if (filters.paid_status === "active") {
    query = query.gte("paid_through", getTodayDate());
  }

  if (filters.paid_status === "expired") {
    query = query.lt("paid_through", getTodayDate());
  }

  if (filters.paid_status === "missing") {
    query = query.is("paid_through", null);
  }

  if (filters.sort_by === "name") {
    return query
      .order("last_name", { ascending })
      .order("first_name", { ascending });
  }

  if (sortableColumns.includes(filters.sort_by as never)) {
    return query.order(filters.sort_by as string, {
      ascending,
      nullsFirst: false,
    });
  }

  return query.order("created_at", { ascending: false });
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const { data, error } = await applyFilters(getFilters(request));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const contacts = (data ?? []) as Contact[];
  const headers = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "graduation_year",
    "relationship_type",
    "sport",
    "status",
    "membership_status",
    "annual_dues_amount_cents",
    "gift_donation_amount_cents",
    "paid_through",
    "last_payment_at",
    "stripe_customer_id",
    "stripe_checkout_session_id",
    "tags",
    "email_opt_in",
    "sms_opt_in",
    "notes",
    "admin_notes",
    "created_at",
  ];

  const csv = [
    row(headers),
    ...contacts.map((contact) =>
      row([
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.phone,
        contact.graduation_year,
        contact.relationship_type,
        contact.sport,
        getContactStatus(contact),
        getMembershipStatus(contact),
        contact.annual_dues_amount_cents,
        contact.gift_donation_amount_cents,
        contact.paid_through,
        contact.last_payment_at,
        contact.stripe_customer_id,
        contact.stripe_checkout_session_id,
        getContactTags(contact).join("; "),
        contact.email_opt_in,
        contact.sms_opt_in,
        contact.notes,
        contact.admin_notes,
        contact.created_at,
      ]),
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Disposition": 'attachment; filename="colts-contacts.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
