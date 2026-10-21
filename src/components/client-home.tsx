import { ClientSitePublic } from "@/components/site/client-site-public";
import { getCurrentClientId } from "@/lib/client-context";
export default async function ClientHome() {
  return <ClientSitePublic clientId={getCurrentClientId()} standalone />;
}
