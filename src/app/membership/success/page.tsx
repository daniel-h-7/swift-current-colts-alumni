import { ClientSiteSuccess } from "@/components/site/client-site-public";
import { getCurrentClientId } from "@/lib/client-context";
export const dynamic = "force-dynamic";
export default async function MembershipSuccessPage({searchParams}: {searchParams: Promise<{session_id?: string}>}) {
  return <ClientSiteSuccess clientId={getCurrentClientId()} standalone sessionId={(await searchParams).session_id} />;
}
