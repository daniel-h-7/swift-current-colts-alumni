import { clearHqSession } from "@/lib/hq-auth";
import { redirect } from "next/navigation";
import { clearStudioSession } from "@/lib/studio-auth";

export async function GET() {
  await clearStudioSession();
  await clearHqSession();
  redirect("/studio/login");
}
