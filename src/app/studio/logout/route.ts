import { isBackgroundAuthRequest, ignoredAuthPrefetch } from "@/lib/auth-navigation";
import { clearHqSession } from "@/lib/hq-auth";
import { redirect } from "next/navigation";
import { clearStudioSession } from "@/lib/studio-auth";

export async function GET(request: Request) {
  if (isBackgroundAuthRequest(request)) return ignoredAuthPrefetch();
  await clearStudioSession();
  await clearHqSession();
  redirect("/studio/login");
}
