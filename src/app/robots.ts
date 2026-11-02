import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPlatformApp } from "@/lib/app-mode";
import { isMarketingHost, platformUrl } from "@/lib/platform-seo";

export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const marketing = isPlatformApp() && isMarketingHost((await headers()).get("host"));
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/hq", "/studio", "/admin", "/api/", "/preview/", "/demo", "/membership/", "/success", "/unsubscribe"] },
    ...(marketing ? { sitemap: `${platformUrl}/sitemap.xml` } : {}),
  };
}
