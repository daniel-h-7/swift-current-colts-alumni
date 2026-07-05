import { NextResponse } from "next/server";
import { runRenewalReminderAutomation } from "@/lib/renewal-reminder-automation";
import { getServerEnvValue } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = getServerEnvValue("CRON_SECRET");

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runRenewalReminderAutomation();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
