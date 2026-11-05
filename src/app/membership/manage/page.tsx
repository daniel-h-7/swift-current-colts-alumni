import { ClientSiteManage } from "@/components/site/client-site-public";
import { getCurrentClientId } from "@/lib/client-context";
export const dynamic = "force-dynamic";
export default function Page() { return <ClientSiteManage clientId={getCurrentClientId()} />; }
