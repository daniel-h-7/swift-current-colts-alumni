import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { updateClientAccountEmail } from "@/lib/client-account-email";
import { getServerEnvValue } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isHqAuthenticated())) return NextResponse.redirect(new URL("/hq/login", request.url), 303);
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Please submit account changes from TeamAlum HQ." }, { status: 403 });
  }
  const { id } = await params;
  const clientPath = `/hq/clients/${encodeURIComponent(id)}`;
  try {
    if (!getServerEnvValue("SUPABASE_SERVICE_ROLE_KEY")) {
      throw new Error("Account editing requires the server's Supabase service-role configuration. Contact your TeamAlum administrator.");
    }
    const data = await request.formData();
    await updateClientAccountEmail({
      clientId: id,
      clientUserId: String(data.get("client_user_id") ?? ""),
      email: String(data.get("email") ?? ""),
      expectedEmail: String(data.get("expected_email") ?? ""),
    });
    revalidatePath("/hq");
    revalidatePath("/hq/clients", "layout");
    return NextResponse.redirect(new URL(`${clientPath}?account_saved=1#account-access`, request.url), 303);
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Unable to update the account email.";
    return NextResponse.redirect(new URL(`${clientPath}?account_error=${encodeURIComponent(error)}#account-access`, request.url), 303);
  }
}
