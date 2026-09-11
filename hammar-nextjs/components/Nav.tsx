"use client";

import Image from "next/image";
import Link from "next/link";

export function Nav({ cartCount }: { cartCount: number }) {
  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/80 px-7 py-4 backdrop-blur-md"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        <Image
          src="/logo.jpg"
          alt="همار"
          width={34}
          height={34}
          className="rounded-full"
        />

        <span className="font-display text-xl font-bold tracking-wide">
          همار
        </span>
      </Link>

      {/* Navigation */}
      <div className="hidden gap-9 text-[15px] text-silver-dark md:flex">
        <a
          href="#story"
          className="transition-colors hover:text-ink"
        >
          قصتنا
        </a>

        <a
          href="#shop"
          className="transition-colors hover:text-ink"
        >
          العطور
        </a>

        <a
          href="#contact"
          className="transition-colors hover:text-ink"
        >
          تواصل معنا
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Login */}
        <Link
          href="/login"
          className="rounded-full border border-lineStrong px-4 py-2 text-sm font-medium transition-all hover:border-ink hover:bg-panel"
        >
          تسجيل الدخول
        </Link>

        {/* Cart */}
        <Link
          href="/cart"
          className="flex items-center gap-2 rounded-full border border-lineStrong px-4 py-2 text-sm font-medium transition-all hover:border-ink hover:bg-panel"
        >
          <span>السلة</span>

          <span
            key={cartCount}
            className="bump inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-paper"
          >
            {cartCount}
          </span>
        </Link>
      </div>
    </nav>
  );
}