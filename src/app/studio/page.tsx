import { notFound } from "next/navigation";
import { StudioDashboard } from "@/components/studio/studio-dashboard";
import { getCurrentClientId } from "@/lib/client-context";
import { getPlatformClient } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const client = await getPlatformClient(getCurrentClientId());

  if (!client) {
    notFound();
  }

  return <StudioDashboard client={client} />;
}
