"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type NavProps = {
  cartCount?: number;
};

export function Nav({ cartCount = 0 }: NavProps) {
  const [user, setUser] = useState(auth.currentUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveCartCount, setLiveCartCount] = useState(cartCount);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const saved = localStorage.getItem("hammar-cart");
        const items = saved ? JSON.parse(saved) : [];

        const count = Array.isArray(items)
          ? items.reduce(
              (
                total: number,
                item: { quantity?: number }
              ) =>
                total + Number(item.quantity || 0),
              0
            )
          : 0;

        setLiveCartCount(count);
      } catch {
        setLiveCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener(
      "cart-updated",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        updateCartCount
      );
    };
  }, []);

  // تحديث العدد إذا تغير cartCount من الصفحة
  useEffect(() => {
    setLiveCartCount(cartCount);
  }, [cartCount]);

  const handleLogout = async () => {
    await signOut(auth);

    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        dir="rtl"
        className="sticky top-0 z-50 border-b border-black/[0.06] bg-[#f7f5f0]/95 backdrop-blur-md"
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-8">

          {/* القائمة - الكمبيوتر */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm text-black/60 transition hover:text-black"
            >
              الرئيسية
            </Link>

            <Link
              href="/#shop"
              className="text-sm text-black/60 transition hover:text-black"
            >
              العطور
            </Link>

            {/* صفحة العروض الجديدة */}
            <Link
              href="/offers"
              className="text-sm text-black/60 transition hover:text-black"
            >
              العروض
            </Link>

            <Link
              href="/story"
              className="text-sm text-black/60 transition hover:text-black"
            >
              قصتنا
            </Link>
          </nav>

          {/* زر القائمة للجوال */}
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((value) => !value)
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black md:hidden"
            aria-label="القائمة"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            ) : (
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            )}
          </button>

          {/* الشعار */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="همار"
          >
            <div className="text-center leading-none">
              <div className="text-[22px] font-black tracking-[0.14em] sm:text-[25px]">
                HAMMAR
              </div>

              <div className="mt-1 text-[7px] tracking-[0.42em] text-black/35 sm:text-[8px]">
                PERFUMES
              </div>
            </div>
          </Link>

          {/* اليمين */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* الحساب */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen((value) => !value)
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-bold transition hover:border-black/30"
                  aria-label="الحساب"
                >
                  {user.email
                    ?.charAt(0)
                    .toUpperCase() || "ح"}
                </button>

                {menuOpen && (
                  <div className="absolute left-0 top-12 w-44 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-xl">
                    <Link
                      href="/account"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      className="block rounded-xl px-4 py-3 text-sm transition hover:bg-black/[0.04]"
                    >
                      حسابي
                    </Link>

                    <Link
                      href="/orders"
                      onClick={() =>
                        setMenuOpen(false)
                      }
                      className="block rounded-xl px-4 py-3 text-sm transition hover:bg-black/[0.04]"
                    >
                      طلباتي
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-xl px-4 py-3 text-right text-sm text-red-600 transition hover:bg-red-50"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition hover:border-black hover:bg-black hover:text-white sm:block"
              >
                تسجيل الدخول
              </Link>
            )}

            {/* سلة الكمبيوتر */}
            <Link
              href="/cart"
              className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white transition hover:border-black sm:flex"
              aria-label={`السلة ${liveCartCount} منتجات`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M6 8h12l1 12H5L6 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>

              {liveCartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
                  {liveCartCount}
                </span>
              )}
            </Link>

            {/* دخول الجوال */}
            {!user && (
              <Link
                href="/login"
                className="flex h-9 items-center rounded-full border border-black/10 bg-white px-3.5 text-[11px] font-medium transition hover:border-black sm:hidden"
              >
                دخول
              </Link>
            )}
          </div>
        </div>

        {/* قائمة الجوال */}
        <div
          className={`overflow-hidden border-t border-black/[0.05] bg-[#f7f5f0] transition-all duration-300 md:hidden ${
            mobileMenuOpen
              ? "max-h-[420px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <nav className="px-4 py-4" dir="rtl">

            <Link
              href="/"
              onClick={closeMobileMenu}
              className="flex items-center justify-between border-b border-black/[0.06] px-2 py-4 text-sm font-medium"
            >
              <span>الرئيسية</span>
              <span className="text-black/30">
                ←
              </span>
            </Link>

            <Link
              href="/#shop"
              onClick={closeMobileMenu}
              className="flex items-center justify-between border-b border-black/[0.06] px-2 py-4 text-sm font-medium"
            >
              <span>العطور</span>
              <span className="text-black/30">
                ←
              </span>
            </Link>

            {/* صفحة العروض الجديدة */}
            <Link
              href="/offers"
              onClick={closeMobileMenu}
              className="flex items-center justify-between border-b border-black/[0.06] px-2 py-4 text-sm font-medium"
            >
              <span>العروض</span>
              <span className="text-black/30">
                ←
              </span>
            </Link>

            <Link
              href="/story"
              onClick={closeMobileMenu}
              className="flex items-center justify-between px-2 py-4 text-sm font-medium"
            >
              <span>قصتنا</span>
              <span className="text-black/30">
                ←
              </span>
            </Link>

            {user && (
              <div className="mt-3 border-t border-black/[0.06] pt-3">
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-xl px-2 py-3 text-sm"
                >
                  <span>حسابي</span>
                  <span className="text-black/30">
                    ←
                  </span>
                </Link>

                <Link
                  href="/orders"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-xl px-2 py-3 text-sm"
                >
                  <span>طلباتي</span>
                  <span className="text-black/30">
                    ←
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl px-2 py-3 text-right text-sm text-red-600"
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* سلة عائمة للجوال */}
      {liveCartCount > 0 && (
        <Link
          href="/cart"
          aria-label={`فتح السلة ${liveCartCount} منتجات`}
          className="fixed bottom-6 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-xl transition-all duration-300 hover:scale-110 active:scale-90 sm:hidden"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M6 8h12l1 12H5L6 8Z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
          </svg>

          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-black text-black shadow-md">
            {liveCartCount}
          </span>
        </Link>
      )}
    </>
  );
}
