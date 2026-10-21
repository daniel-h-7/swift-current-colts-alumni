import { isBackgroundAuthRequest, ignoredAuthPrefetch } from "@/lib/auth-navigation";
import { redirect } from "next/navigation";
import { clearHqSession } from "@/lib/hq-auth";

export async function GET(request: Request) {
  if (isBackgroundAuthRequest(request)) return ignoredAuthPrefetch();
  await clearHqSession();
  redirect("/hq/login");
}
