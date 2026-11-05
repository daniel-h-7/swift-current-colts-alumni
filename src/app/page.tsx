import type { Metadata } from "next";
import { clientPublicMetadata } from "@/lib/client-public-metadata";
import { getCurrentClientId } from "@/lib/client-context";
import { platformHomeMetadata } from "@/lib/platform-seo";
import ClientHome from "@/components/client-home";
import { PlatformHome } from "@/components/platform-home";
import { isPlatformApp } from "@/lib/app-mode";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return isPlatformApp() ? platformHomeMetadata : clientPublicMetadata(getCurrentClientId());
}
export default async function Home() {
  return isPlatformApp() ? <PlatformHome /> : <ClientHome />;
}
