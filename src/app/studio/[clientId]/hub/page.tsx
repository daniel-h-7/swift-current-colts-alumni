import { redirect } from "next/navigation";
import { TeamHubView } from "@/components/studio/team-hub";
import { getPlatformClientByStudioSlug } from "@/lib/platform-data";
import { canAccessStudioClient, hasStudioOrHqSession } from "@/lib/studio-auth";
import { canManageTeamOperations } from "@/lib/team-admin";
import { studioLoginPath } from "@/lib/studio-navigation";
export const metadata = { title: "Team Hub | TeamAlum", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function TeamHub({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const requested = `/studio/${encodeURIComponent(clientId)}/hub`;
  if (!(await hasStudioOrHqSession())) redirect(studioLoginPath(requested));
  const client = await getPlatformClientByStudioSlug(clientId);
  if (!client || !(await canAccessStudioClient(client.id)))
    redirect(
      studioLoginPath("/studio", "This team is not connected to your account."),
    );
  const base = `/studio/${encodeURIComponent(client.id)}`;
  if (client.id !== clientId) redirect(`${base}/hub`);
  const operations = await canManageTeamOperations(client.id);
  return <TeamHubView client={client} operations={operations} />;
}
