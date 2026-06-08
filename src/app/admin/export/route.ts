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

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

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
