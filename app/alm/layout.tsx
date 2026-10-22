import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "هدية همّار × ALM",
  description: "ضيافة من همّار في كوفي ALM.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AlmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
