import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: isPlatformApp() ? "TeamAlum" : brand.metaTitle,
  description: isPlatformApp()
    ? "Build alumni, booster, sponsor, and membership sites for sports programs."
    : brand.metaDescription,
};

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
