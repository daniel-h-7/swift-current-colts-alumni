import { ClientSiteSuccess } from "@/components/site/client-site-public";
import { getCurrentClientId } from "@/lib/client-context";
export const dynamic = "force-dynamic";
export default async function MembershipSuccessPage() {
  return <ClientSiteSuccess clientId={getCurrentClientId()} standalone />;
}
