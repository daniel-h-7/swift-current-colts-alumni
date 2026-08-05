import { NextResponse } from "next/server";
import {
  createStudioSession,
  getStudioClientIdsForUser,
  signInStudioUser,
} from "@/lib/studio-auth";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return redirectTo(
        request,
        "/studio/login?error=Enter%20your%20email%20and%20password.",
      );
    }

    const session = await signInStudioUser(email, password);
    const clientIds = await getStudioClientIdsForUser(session.authUserId);

    if (!clientIds.length) {
      return redirectTo(
        request,
        "/studio/login?error=No%20TeamAlum%20site%20is%20connected%20to%20that%20login.",
      );
    }

    await createStudioSession(session);

    return redirectTo(request, `/studio/${encodeURIComponent(clientIds[0])}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log in.";

    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent(message)}`,
    );
  }
}
