import type { Metadata } from "next";
import { headers } from "next/headers";
import { isMarketingHost, platformUrl } from "@/lib/platform-seo";
import { Geist, Geist_Mono } from "next/font/google";
import { isPlatformApp } from "@/lib/app-mode";
import { getSiteBrand } from "@/lib/site-brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const brand = getSiteBrand();
const title = isPlatformApp() ? "TeamAlum" : brand.metaTitle;
const description = isPlatformApp()
  ? "Alumni CRM, mailer, and passive fundraising tools for sports programs."
  : brand.metaDescription;

const baseMetadata: Metadata = {
  description,
  openGraph: {
    description,
    images: [
      {
        alt: title,
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    title,
    type: "website",
  },
  title,
  twitter: {
    card: "summary_large_image",
    description,
    images: ["/opengraph-image"],
    title,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const marketing = isPlatformApp() && isMarketingHost((await headers()).get("host"));
  return {
    ...baseMetadata,
    ...(marketing ? {
      metadataBase: new URL(platformUrl),
      applicationName: "TeamAlum",
      icons: {
        icon: [{ url: "/images/teamalum-icon-96.png", sizes: "96x96", type: "image/png" }],
        apple: [{ url: "/images/teamalum-apple-icon.png", sizes: "180x180", type: "image/png" }],
      },
    } : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
