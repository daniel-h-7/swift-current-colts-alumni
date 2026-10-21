import { ClientSiteSuccess } from "@/components/site/client-site-public";
export const dynamic = "force-dynamic";
export default async function ClientMembershipSuccessPage({params}: {params: Promise<{clientId: string}>}) {
  const {clientId} = await params;
  return <ClientSiteSuccess clientId={clientId} />;
}
