import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { approveClientLaunch } from "@/lib/launch-review";

type RouteParams = {
  id: string;
};

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { id } = await params;
  const clientPath = `/hq/clients/${encodeURIComponent(id)}`;

  if (!(await isHqAuthenticated())) {
    return redirectTo(request, "/hq/login");
  }

  try {
    if (request.headers.get("origin") !== new URL(request.url).origin) throw new Error("Submit launch approval from HQ.");
    const form = await request.formData();
    await approveClientLaunch(id, form.get("override_launch") === "on" ? String(form.get("override_reason") ?? "") : undefined);
  } catch (error) {
    return redirectTo(request, `${clientPath}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to approve launch.")}`);
  }

  revalidatePath("/hq");
  revalidatePath(clientPath);
  revalidatePath("/");
  revalidatePath("/join");

  return redirectTo(request, `${clientPath}?saved=1`);
}
