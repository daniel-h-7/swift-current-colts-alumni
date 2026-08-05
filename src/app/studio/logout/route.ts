import { redirect } from "next/navigation";
import { clearStudioSession } from "@/lib/studio-auth";

export async function GET() {
  await clearStudioSession();
  redirect("/studio/login");
}
