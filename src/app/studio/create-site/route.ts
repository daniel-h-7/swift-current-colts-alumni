import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createTeamAlumClient,
  normalizeClientId,
} from "@/lib/client-create";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const subdomain = normalizeClientId(String(formData.get("subdomain") ?? ""));
    const amount = String(formData.get("annual_membership_amount") ?? "").trim();
    const parsedAmount = amount ? Number.parseFloat(amount) : 0;
    const template = String(formData.get("template") ?? "football").trim();
    const clientId = subdomain;

    if (!name || !subdomain) {
      return redirectTo(
        request,
        `/studio/start?error=${encodeURIComponent("Add a program name and site URL.")}`,
      );
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return redirectTo(
        request,
        "/studio/start?error=Enter%20a%20valid%20membership%20amount.",
      );
    }

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

    revalidatePath("/hq");
    revalidatePath("/studio");

    return redirectTo(request, `/studio?created=${encodeURIComponent(clientId)}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create your site.";

    return redirectTo(
      request,
      `/studio/start?error=${encodeURIComponent(message)}`,
    );
  }
}
