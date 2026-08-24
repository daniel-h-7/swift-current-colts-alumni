import { ClientSitePublic } from "@/components/site/client-site-public";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

export default async function ClientSiteHomePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { clientId } = await params;

  return <ClientSitePublic clientId={clientId} />;
}
