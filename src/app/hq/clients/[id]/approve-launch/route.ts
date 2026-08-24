import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isHqAuthenticated } from "@/lib/hq-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const approvedAt = new Date().toISOString();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("clients")
    .update({
      launch_approved_at: approvedAt,
      published_at: approvedAt,
      updated_at: approvedAt,
    })
    .eq("id", id);

  if (error) {
    return redirectTo(
      request,
      `${clientPath}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath("/hq");
  revalidatePath(clientPath);
  revalidatePath("/");
  revalidatePath("/join");

  return redirectTo(request, `${clientPath}?saved=1`);
}
