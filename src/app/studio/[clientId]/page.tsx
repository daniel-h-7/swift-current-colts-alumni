import { notFound } from "next/navigation";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { getPlatformClient } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

type PageParams = {
  clientId: string;
};

type PageSearchParams = {
  created?: string;
};

export default async function ClientStudioPage({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const [{ clientId }, query] = await Promise.all([params, searchParams]);
  const client = await getPlatformClient(clientId);

  if (!client) {
    notFound();
  }

  return <StudioDashboard client={client} isCreated={query.created === "1"} />;
}
