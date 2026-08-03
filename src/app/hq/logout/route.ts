import { redirect } from "next/navigation";
import { clearHqSession } from "@/lib/hq-auth";

export async function GET() {
  await clearHqSession();
  redirect("/hq/login");
}
