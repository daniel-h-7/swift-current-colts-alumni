import type { Metadata } from "next";
import { ClientSitePublic } from "@/components/site/client-site-public";
import { getCurrentClientId } from "@/lib/client-context";
import { getSiteBrand } from "@/lib/site-brand";

const brand = getSiteBrand();
const shareDescription = brand.shareDescription;

export const metadata: Metadata = {
  description: shareDescription,
  openGraph: {
    description: shareDescription,
    images: [
      {
        alt: `Support ${brand.programName}`,
        height: 630,
        url: "/join/opengraph-image",
        width: 1200,
      },
    ],
    title: `Support ${brand.programName}`,
    type: "website",
  },
  title: `Support ${brand.programName}`,
  twitter: {
    card: "summary_large_image",
    description: shareDescription,
    images: ["/join/opengraph-image"],
    title: `Support ${brand.programName}`,
  },
};

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  return <ClientSitePublic clientId={getCurrentClientId()} showJoin standalone />;
}
