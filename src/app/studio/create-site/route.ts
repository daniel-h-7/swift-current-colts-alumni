import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createTeamAlumClient,
  normalizeClientId,
} from "@/lib/client-create";
import {
  addStudioClientUser,
  createStudioSession,
  createStudioUser,
} from "@/lib/studio-auth";
import { isStudioStartUnlocked } from "@/lib/studio-start-gate";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  try {
    if (!(await isStudioStartUnlocked())) {
      return redirectTo(
        request,
        "/studio/start?error=This%20feature%20is%20coming%20soon.",
      );
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const subdomain = normalizeClientId(String(formData.get("subdomain") ?? ""));
    const amount = String(formData.get("annual_membership_amount") ?? "").trim();
    const parsedAmount = amount ? Number.parseFloat(amount) : 0;
    const template = String(formData.get("template") ?? "football").trim();
    const adminEmail = String(formData.get("admin_email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") ?? "");
    const clientId = subdomain;

    if (!name || !subdomain || !adminEmail || !password) {
      return redirectTo(
        request,
        `/studio/start?error=${encodeURIComponent("Add a program name, site URL, owner email, and password.")}`,
      );
    }

    if (password.length < 8) {
      return redirectTo(
        request,
        "/studio/start?error=Password%20must%20be%20at%20least%208%20characters.",
      );
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return redirectTo(
        request,
        "/studio/start?error=Enter%20a%20valid%20membership%20amount.",
      );
    }

    const studioUser = await createStudioUser(adminEmail, password);

    await createTeamAlumClient({
      annualMembershipAmountCents: Math.round(parsedAmount * 100),
      clientId,
      membershipYearLabel: String(
        formData.get("membership_year_label") ?? "",
      ).trim(),
      name,
      siteVariant: template === "demo" ? "demo" : clientId,
      status: "trial",
      subdomain,
    });
    await addStudioClientUser({
      authUserId: studioUser.authUserId,
      clientId,
      email: studioUser.email,
      fullName: name,
      role: "owner",
    });
    await createStudioSession(studioUser);

    revalidatePath("/hq");
    revalidatePath("/studio");

    return redirectTo(
      request,
      `/studio/${encodeURIComponent(clientId)}?created=1`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create your site.";

    return redirectTo(
      request,
      `/studio/start?error=${encodeURIComponent(message)}`,
    );
  }
}
