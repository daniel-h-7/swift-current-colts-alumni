import { ClientSitePublic } from "@/components/site/client-site-public";
export const dynamic = "force-dynamic";
export default async function ClientPreviewJoinPage({params}: {params: Promise<{clientId: string}>}) {
  const {clientId} = await params;
  return <ClientSitePublic clientId={clientId} preview showJoin />;
}
