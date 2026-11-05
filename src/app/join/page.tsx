import { ClientSitePublic } from "@/components/site/client-site-public";
import { getCurrentClientId } from "@/lib/client-context";
import { clientPublicMetadata } from "@/lib/client-public-metadata";
export const dynamic = "force-dynamic";
export async function generateMetadata() { return clientPublicMetadata(getCurrentClientId(), "join"); }
export default async function JoinPage() { return <ClientSitePublic clientId={getCurrentClientId()} showJoin standalone />; }
