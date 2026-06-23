import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  contactStatuses,
  membershipStatuses,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ImportSearchParams = {
  error?: string;
  imported?: string;
};

type CsvRow = Record<string, string>;

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

const requiredColumns = [
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
  const missingColumns = requiredColumns.filter(
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

function getImportErrorHref(message: string) {
  return `/admin/import?error=${encodeURIComponent(message)}`;
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

async function importContacts(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const file = formData.get("csv_file");
  const optInMode = String(formData.get("opt_in_mode") ?? "all_no");

  if (!file || typeof file !== "object" || !("text" in file) || !("size" in file)) {
    redirect(getImportErrorHref("Choose a CSV file before importing."));
  }

  if (!file.size) {
    redirect(getImportErrorHref("Choose a CSV file before importing."));
  }

  try {
    const csvText = await file.text();
    const rows = parseCsv(csvText);
    const contacts = rows.map((row, index) =>
      normalizeRow(row, index, optInMode),
    );
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("contacts")
      .upsert(contacts, { onConflict: "email" });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin");
    redirect(`/admin/import?imported=${contacts.length}`);
  } catch (error) {
    redirect(
      getImportErrorHref(
        error instanceof Error ? error.message : "Unable to import contacts.",
      ),
    );
  }
}

export default async function ContactImportPage({
  searchParams,
}: {
  searchParams: Promise<ImportSearchParams>;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const params = await searchParams;

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[5px] text-red-500">
              CRM Import
            </p>
            <h1 className="mt-3 text-4xl font-black">Import Contacts</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-white/15 bg-black/25 px-5 py-3 text-sm font-bold text-gray-200 transition hover:border-blue-500 hover:bg-blue-950/35 hover:text-white"
              href="/admin"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(29,78,216,0.22)] transition hover:bg-blue-600"
              href="/admin/import/sample"
            >
              Download Sample CSV
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {params.imported ? (
          <section className="rounded-3xl border border-blue-500/30 bg-blue-950/40 p-6 font-bold text-blue-200">
            Imported {params.imported} contact{params.imported === "1" ? "" : "s"}.
          </section>
        ) : null}

        {params.error ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 font-bold text-red-200">
            {params.error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            action={importContacts}
            className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-black">Upload CSV</h2>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Imports update existing contacts by email or create new contacts.
              Download the sample first so the columns match.
            </p>

            <label className="mt-6 block text-sm font-bold text-gray-200">
              CSV file
              <input
                accept=".csv,text/csv"
                className={fieldClass}
                name="csv_file"
                required
                type="file"
              />
            </label>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-black uppercase tracking-[2px] text-gray-400">
                Opt-In Handling
              </p>
              <div className="mt-4 space-y-3 text-sm font-bold text-gray-200">
                <label className="flex gap-3">
                  <input
                    defaultChecked
                    name="opt_in_mode"
                    type="radio"
                    value="all_no"
                  />
                  Set imported contacts to not opted in
                </label>
                <label className="flex gap-3">
                  <input name="opt_in_mode" type="radio" value="from_csv" />
                  Use email_opt_in and sms_opt_in columns from CSV
                </label>
                <label className="flex gap-3">
                  <input name="opt_in_mode" type="radio" value="all_yes" />
                  Set imported contacts to opted in
                </label>
              </div>
              <p className="mt-4 text-xs leading-5 text-red-200">
                Only choose opted in if the club has permission to contact these
                people.
              </p>
            </div>

            <button
              className="mt-6 w-full rounded-md bg-blue-700 px-8 py-4 font-black uppercase tracking-[3px] text-white transition hover:bg-blue-600"
              type="submit"
            >
              Import Contacts
            </button>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Required Columns</h2>
            <ul className="mt-4 space-y-2 text-sm font-bold text-gray-300">
              {requiredColumns.map((column) => (
                <li key={column}>{column}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-gray-400">
              Valid relationship types: {relationshipTypes.join(", ")}.
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Valid sport/program values: {sports.join(", ")}.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
