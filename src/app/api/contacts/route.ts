import { NextResponse } from "next/server";
import { isValidContact } from "@/lib/contact-validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
    const { error } = await supabase
      .from("contacts")
      .upsert(contact, { onConflict: "email" });

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
