import ClientHome from "@/components/client-home";
import { PlatformHome } from "@/components/platform-home";
import { SiteNotLaunched } from "@/components/site-not-launched";
import { isPlatformApp } from "@/lib/app-mode";
import { getCurrentClientLaunchState } from "@/lib/launch-approval";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (isPlatformApp()) {
    return <PlatformHome />;
  }

  const launchState = await getCurrentClientLaunchState();

  if (!launchState.isApproved) {
    return <SiteNotLaunched siteName={launchState.client?.name} />;
  }

  return <ClientHome />;
}
