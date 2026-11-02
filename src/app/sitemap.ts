import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPlatformApp } from "@/lib/app-mode";
import { isMarketingHost, platformUrl } from "@/lib/platform-seo";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isPlatformApp() || !isMarketingHost((await headers()).get("host"))) return [];
  // Only index the public marketing page; workspaces and beta signup are private.
  return [{ url: `${platformUrl}/`, changeFrequency: "monthly", priority: 1 }];
}
