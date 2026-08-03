import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  createTeamAlumClient,
  normalizeClientId,
} from "@/lib/client-create";
import { isHqAuthenticated } from "@/lib/hq-auth";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function cleanNullable(value: FormDataEntryValue | null) {
  const cleaned = String(value ?? "").trim();

  return cleaned || null;
}

export async function POST(request: Request) {
  try {
    if (!(await isHqAuthenticated())) {
      return redirectTo(request, "/hq/login");
    }

    const formData = await request.formData();
    const id = normalizeClientId(String(formData.get("id") ?? ""));
    const name = String(formData.get("name") ?? "").trim();
    const siteVariant = String(formData.get("site_variant") ?? "").trim();
    const amount = String(formData.get("annual_membership_amount") ?? "").trim();
    const parsedAmount = amount ? Number.parseFloat(amount) : 0;
    const membershipYearLabel = String(
      formData.get("membership_year_label") ?? "",
    ).trim();
    const joinHeadline = String(formData.get("join_headline") ?? "").trim();
    const joinBody = String(formData.get("join_body") ?? "").trim();

    if (!id || !name || !siteVariant) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent("Fill in the client identity fields.")}`,
      );
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return redirectTo(
        request,
        "/hq/clients/new?error=Enter%20a%20valid%20membership%20amount.",
      );
    }

    if (!membershipYearLabel || !joinHeadline || !joinBody) {
      return redirectTo(
        request,
        `/hq/clients/new?error=${encodeURIComponent("Fill in the membership defaults.")}`,
      );
    }

    await createTeamAlumClient({
      annualMembershipAmountCents: Math.round(parsedAmount * 100),
      clientId: id,
      customDomain: cleanNullable(formData.get("custom_domain")),
      joinBody,
      joinHeadline,
      membershipYearLabel,
      name,
      planKey: String(formData.get("plan_key") ?? "starter").trim(),
      siteVariant,
      status: String(formData.get("status") ?? "trial").trim(),
      subdomain: cleanNullable(formData.get("subdomain")),
    });

    revalidatePath("/hq");
    return redirectTo(request, `/hq/clients/${encodeURIComponent(id)}?saved=1`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create client.";

    return redirectTo(
      request,
      `/hq/clients/new?error=${encodeURIComponent(message)}`,
    );
  }
}
