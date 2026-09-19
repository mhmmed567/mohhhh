"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Shop } from "@/components/Shop";
import { Footer } from "@/components/Footer";
import { Story } from "@/components/Story";

export default function Home() {
const [cartCount, setCartCount] = useState(0);

return ( <main> <Nav cartCount={cartCount} /> <Hero />

  <Shop
    onAddToCart={() => setCartCount((count) => count + 1)}
  />

  <Story />
  <Footer />
</main>


);
}
