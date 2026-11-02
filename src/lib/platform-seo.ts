import type { Metadata } from "next";

export const platformUrl = "https://www.teamalum.com";
export const platformTitle = "TeamAlum | Alumni Websites, CRM & Team Fundraising";
export const platformDescription =
  "TeamAlum (Team Alum) helps sports teams and booster clubs build alumni websites, manage supporters and donors, send email campaigns, and grow fundraising.";

export function isMarketingHost(host: string | null) {
  const hostname = (host ?? "").split(":")[0].toLowerCase();
  return ["teamalum.com", "www.teamalum.com", "localhost", "127.0.0.1"].includes(hostname);
}

export const platformHomeMetadata: Metadata = {
  title: platformTitle,
  description: platformDescription,
  alternates: { canonical: `${platformUrl}/` },
  openGraph: {
    type: "website",
    url: `${platformUrl}/`,
    siteName: "TeamAlum",
    title: platformTitle,
    description: platformDescription,
    images: [{ url: `${platformUrl}/opengraph-image`, width: 1200, height: 630, alt: "TeamAlum — alumni websites, CRM and team fundraising" }],
  },
  twitter: { card: "summary_large_image", title: platformTitle, description: platformDescription, images: [`${platformUrl}/opengraph-image`] },
};

export const platformStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${platformUrl}/#organization`, name: "TeamAlum", alternateName: "Team Alum", url: `${platformUrl}/`, logo: { "@type": "ImageObject", url: `${platformUrl}/images/teamalum-monogram.png`, width: 512, height: 512 }, description: platformDescription },
    { "@type": "WebSite", "@id": `${platformUrl}/#website`, name: "TeamAlum", alternateName: ["Team Alum"], url: `${platformUrl}/`, publisher: { "@id": `${platformUrl}/#organization` } },
  ],
};
