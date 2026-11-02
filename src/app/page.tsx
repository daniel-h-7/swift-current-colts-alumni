import type { Metadata } from "next";
import { platformHomeMetadata } from "@/lib/platform-seo";
import ClientHome from "@/components/client-home";
import { PlatformHome } from "@/components/platform-home";
import { isPlatformApp } from "@/lib/app-mode";
export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  return isPlatformApp() ? platformHomeMetadata : {};
}
export default async function Home() {
  return isPlatformApp() ? <PlatformHome /> : <ClientHome />;
}
