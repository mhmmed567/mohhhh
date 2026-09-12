"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Story } from "@/components/Story";
import { Shop } from "@/components/Shop";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <main>
      <Nav cartCount={cartCount} />
      <Hero />
      <Story />
      <Shop onAddToCart={() => setCartCount((c) => c + 1)} />
      <Footer />
    </main>
  );
}