import { NextResponse } from "next/server";
import {
  ContactInsert,
  relationshipTypes,
  sports,
} from "@/lib/contact-options";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function isValidContact(value: unknown): value is ContactInsert {
  if (!value || typeof value !== "object") {
    return false;
  }

  const contact = value as Partial<ContactInsert>;

  return (
    typeof contact.first_name === "string" &&
    typeof contact.last_name === "string" &&
    typeof contact.email === "string" &&
    typeof contact.email_opt_in === "boolean" &&
    typeof contact.sms_opt_in === "boolean" &&
    relationshipTypes.includes(contact.relationship_type as never) &&
    sports.includes(contact.sport as never) &&
    (typeof contact.phone === "string" || contact.phone === null) &&
    (typeof contact.graduation_year === "number" ||
      contact.graduation_year === null) &&
    (typeof contact.notes === "string" || contact.notes === null)
  );
}

export async function POST(request: Request) {
  try {
    const contact = await request.json();

    if (!isValidContact(contact)) {
      return NextResponse.json(
        { error: "Please check the contact form fields and try again." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("contacts").insert(contact);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save your contact.",
      },
      { status: 500 },
    );
  }
}
