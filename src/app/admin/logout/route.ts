import { clearHqSession } from "@/lib/hq-auth";
import { adminPath } from "@/lib/team-admin";
import { redirect } from "next/navigation";
import { getTeamAdminClientId } from "@/lib/team-admin";
import { clearStudioSession } from "@/lib/studio-auth";
import { clearAdminSession } from "@/lib/admin-auth";

export async function GET() {
  if (await getTeamAdminClientId()) {
    await clearStudioSession();
    await clearHqSession();
    redirect("/studio/login");
  }
  await clearAdminSession();
  redirect(await adminPath("/admin/login"));
}
