import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const title = "همار للعطور | HAMMAR Perfumes";
  const description = "اكتشف عطور همار في سلطنة عمان، عطور مختارة بعناية لحضور يترك أثرًا لا يُنسى.";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "ar_OM",
      siteName: "همار للعطور",
      title,
      description,
      url: siteUrl,
    },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${amiri.variable} ${plexArabic.variable}`}>
      <body className="font-body font-light antialiased">{children}</body>
    </html>
  );
}
