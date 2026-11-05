import { clientPublicMetadata } from "@/lib/client-public-metadata";
import { ClientSiteManage } from "@/components/site/client-site-public";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  return <ClientSiteManage clientId={(await params).clientId} />;
}

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }) { return clientPublicMetadata((await params).clientId, "manage"); }
