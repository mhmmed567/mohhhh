import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عروض العطور | همار",
  description: "اكتشف عروض عطور همار الحالية وأسعارها الخاصة.",
  alternates: { canonical: "/offers" },
  openGraph: {
    title: "عروض العطور | همار",
    description: "اكتشف عروض عطور همار الحالية وأسعارها الخاصة.",
    url: "/offers",
  },
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
