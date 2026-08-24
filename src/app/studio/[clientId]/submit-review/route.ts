import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessStudioClient, getStudioSession } from "@/lib/studio-auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteParams = {
  clientId: string;
};

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { clientId } = await params;
  const studioPath = `/studio/${encodeURIComponent(clientId)}`;

  if (!(await getStudioSession())) {
    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent("Log in to submit your site for review.")}`,
    );
  }

  if (!(await canAccessStudioClient(clientId))) {
    return redirectTo(
      request,
      `/studio/login?error=${encodeURIComponent("That site is not connected to your login.")}`,
    );
  }

  const supabase = createServerSupabaseClient();
  const requestedAt = new Date().toISOString();
  const { error } = await supabase
    .from("clients")
    .update({
      launch_review_requested_at: requestedAt,
      updated_at: requestedAt,
    })
    .eq("id", clientId);

  if (error) {
    return redirectTo(
      request,
      `${studioPath}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(studioPath);
  revalidatePath("/hq");

  return redirectTo(request, `${studioPath}?review_submitted=1`);
}
