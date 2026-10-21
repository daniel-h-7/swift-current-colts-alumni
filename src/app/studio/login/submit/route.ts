import { safeStudioNext, studioLoginPath } from "@/lib/studio-navigation";
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
  let next = "/studio";
  try {
    const formData = await request.formData();
    next = safeStudioNext(formData.get("next"));
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return redirectTo(
        request,
        studioLoginPath(next, "Enter your email and password."),
      );
    }

    const session = await signInStudioUser(email, password);
    const clientIds = await getStudioClientIdsForUser(session.authUserId);

    if (!clientIds.length) {
      return redirectTo(
        request,
        studioLoginPath(next, "No TeamAlum site is connected to that login. Contact HQ to link your account."),
      );
    }

    await createStudioSession(session);

    return redirectTo(request, next);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log in.";

    return redirectTo(
      request,
      studioLoginPath(next, message),
    );
  }
}
