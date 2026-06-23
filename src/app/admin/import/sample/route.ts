import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const sampleCsv = [
  [
    "first_name",
    "last_name",
    "email",
    "alternate_email",
    "phone",
    "graduation_year",
    "relationship_type",
    "sport",
    "email_opt_in",
    "sms_opt_in",
    "notes",
    "status",
    "membership_status",
    "tags",
    "admin_notes",
    "annual_dues_amount_cents",
    "gift_donation_amount_cents",
    "paid_through",
    "last_payment_at",
  ],
  [
    "Jane",
    "Colt",
    "jane@example.com",
    "family@example.com",
    "306-555-0101",
    "2012",
    "Alumni",
    "Football",
    "no",
    "no",
    "Interested in homecoming.",
    "New",
    "Not Started",
    "Volunteer; Homecoming",
    "Imported from legacy spreadsheet.",
    "0",
    "0",
    "",
    "",
  ],
]
  .map((row) =>
    row
      .map((value) =>
        /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value,
      )
      .join(","),
  )
  .join("\n");

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new Response(sampleCsv, {
    headers: {
      "Content-Disposition": 'attachment; filename="teamalum-contact-import-sample.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
