import { redirect } from "next/navigation";
import { getStudioClientIdsForUser, getStudioSession } from "@/lib/studio-auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await getStudioSession();

  if (!session) {
    redirect("/studio/login");
  }

  const clientIds = await getStudioClientIdsForUser(session.authUserId);

  if (!clientIds.length) {
    redirect("/studio/login?error=No%20TeamAlum%20site%20is%20connected%20to%20that%20login.");
  }

  redirect(`/studio/${encodeURIComponent(clientIds[0])}`);
}
