import ClientHome from "@/components/client-home";
import { PlatformHome } from "@/components/platform-home";
import { isPlatformApp } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (isPlatformApp()) {
    return <PlatformHome />;
  }

  return <ClientHome />;
}
