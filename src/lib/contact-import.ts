import "server-only";

import {
  contactStatuses,
  membershipStatuses,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CsvRow = Record<string, string>;

export const requiredImportColumns = [
  "first_name",
  "last_name",
  "email",
  "relationship_type",
  "sport",
];

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one contact.");
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.trim().toLowerCase(),
  );
  const missingColumns = requiredImportColumns.filter(
    (column) => !headers.includes(column),
  );

  if (missingColumns.length) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}.`);
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });
}

function parseBoolean(value: string) {
  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
}

function parseInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseCents(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function getOptIns(row: CsvRow, mode: string) {
  if (mode === "all_yes") {
    return { emailOptIn: true, smsOptIn: true };
  }

  if (mode === "from_csv") {
    return {
      emailOptIn: parseBoolean(row.email_opt_in ?? ""),
      smsOptIn: parseBoolean(row.sms_opt_in ?? ""),
    };
  }

  return { emailOptIn: false, smsOptIn: false };
}

function normalizeRow(row: CsvRow, index: number, optInMode: string) {
  const relationshipType = row.relationship_type;
  const sport = row.sport;
  const status = row.status || "New";
  const membershipStatus = row.membership_status || "Not Started";
  const { emailOptIn, smsOptIn } = getOptIns(row, optInMode);

  if (!row.first_name || !row.last_name || !row.email) {
    throw new Error(`Row ${index + 2} is missing first name, last name, or email.`);
  }

  if (!relationshipTypes.includes(relationshipType as never)) {
    throw new Error(`Row ${index + 2} has an invalid relationship_type.`);
  }

  if (!sports.includes(sport as never)) {
    throw new Error(`Row ${index + 2} has an invalid sport.`);
  }

  if (!contactStatuses.includes(status as never)) {
    throw new Error(`Row ${index + 2} has an invalid status.`);
  }

  if (!membershipStatuses.includes(membershipStatus as never)) {
    throw new Error(`Row ${index + 2} has an invalid membership_status.`);
  }

  return {
    admin_notes: row.admin_notes || null,
    alternate_email: row.alternate_email?.toLowerCase() || null,
    annual_dues_amount_cents: parseCents(row.annual_dues_amount_cents ?? ""),
    email: row.email.toLowerCase(),
    email_opt_in: emailOptIn,
    first_name: row.first_name,
    gift_donation_amount_cents: parseCents(row.gift_donation_amount_cents ?? ""),
    graduation_year: parseInteger(row.graduation_year ?? ""),
    last_name: row.last_name,
    last_payment_at: row.last_payment_at || null,
    membership_status: membershipStatus,
    notes: row.notes || null,
    paid_through: row.paid_through || null,
    phone: row.phone || null,
    relationship_type: relationshipType,
    sms_opt_in: smsOptIn,
    sport,
    status,
    tags: row.tags
      ? row.tags
          .split(";")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  };
}

export async function importContactsFromCsv(csvText: string, optInMode: string) {
  const rows = parseCsv(csvText);
  const contacts = rows.map((row, index) => normalizeRow(row, index, optInMode));
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("contacts")
    .upsert(contacts, { onConflict: "email" });

  if (error) {
    throw new Error(error.message);
  }

  return contacts.length;
}
