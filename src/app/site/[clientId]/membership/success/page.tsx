import { clientPublicMetadata } from "@/lib/client-public-metadata";
import { ClientSiteSuccess } from "@/components/site/client-site-public";
export const dynamic = "force-dynamic";
export default async function ClientMembershipSuccessPage({params, searchParams}: {params: Promise<{clientId: string}>; searchParams: Promise<{session_id?: string}>}) {
  const {clientId} = await params;
  return <ClientSiteSuccess clientId={clientId} sessionId={(await searchParams).session_id} />;
}

export async function generateMetadata({ params }: { params: Promise<{ clientId: string }> }) { return clientPublicMetadata((await params).clientId, "success"); }
