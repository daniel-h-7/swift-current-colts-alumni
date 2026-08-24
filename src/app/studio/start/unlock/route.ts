import { NextResponse } from "next/server";
import {
  createStudioStartUnlock,
  verifyStudioStartPassword,
} from "@/lib/studio-start-gate";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (!verifyStudioStartPassword(password)) {
    return redirectTo(
      request,
      "/studio/start?error=That%20password%20does%20not%20unlock%20early%20access.",
    );
  }

  await createStudioStartUnlock();

  return redirectTo(request, "/studio/start");
}
