import type { Metadata } from "next";
import { getPlatformClientByStudioSlug } from "@/lib/platform-data";
import { getSiteContentForClient } from "@/lib/site-content";
import { clientHostname } from "@/lib/client-address";

export async function clientPublicMetadata(clientId: string, page: "home" | "join" | "manage" | "success" = "home"): Promise<Metadata> {
  const client = await getPlatformClientByStudioSlug(clientId);
  if (!client?.launch_approved_at) return { title: "Site unavailable", robots: { index: false } };
  const content = await getSiteContentForClient(client.id);
  const host = client.custom_domain || client.primary_domain || clientHostname(client, process.env.TEAMALUM_ROOT_DOMAIN || "teamalum.com");
  let origin: URL;
  try { origin = new URL(host.startsWith("https://") ? host : `https://${host}`); } catch { origin = new URL(`https://${clientHostname(client)}`); }
  const suffix = {home: "", join: "/join", manage: "/membership/manage", success: "/membership/success"}[page];
  const title = page === "home" ? `${client.name} Alumni & Supporters` : `${page === "join" ? "Support" : page === "manage" ? "Manage membership |" : "Membership status |"} ${client.name}`;
  const description = (content.brand.heroBody || `Connect with ${client.name} alumni, families and supporters. Support the team and stay part of its next chapter.`).replace(/<[^>]*>/g, "").slice(0, 180);
  const images = content.brand.logoUrl ? [{ url: new URL(content.brand.logoUrl, origin).href, alt: `${client.name} logo` }] : [];
  return { title, description, metadataBase: origin, alternates: { canonical: new URL(suffix || "/", origin).href },
    openGraph: { type: "website", siteName: client.name, title, description, url: new URL(suffix || "/", origin).href, images },
    twitter: { card: "summary", title, description, images: images.map(i => i.url) },
    ...(["manage", "success"].includes(page) ? { robots: { index: false, follow: false } } : {}),
  };
}
