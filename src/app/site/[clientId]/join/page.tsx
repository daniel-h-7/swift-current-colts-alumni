import { clientPublicMetadata } from "@/lib/client-public-metadata";
import { ClientSitePublic } from "@/components/site/client-site-public";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

export default async function ClientSiteJoinPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { clientId } = await params;

  return <ClientSitePublic clientId={clientId} showJoin />;
}

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }) { return clientPublicMetadata((await params).clientId, "join"); }
