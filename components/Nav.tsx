"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type StoreSettings = {
  name?: string;
  logo?: string;
  description?: string;
};

export function Nav({ cartCount }: { cartCount: number }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [store, setStore] = useState<StoreSettings>({
    name: "همار",
    logo: "/logo.jpg",
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setRole(null);
          return;
        }

        try {
          const tokenResult =
            await currentUser.getIdTokenResult(true);

          const userRole = tokenResult.claims.role;

          setRole(
            typeof userRole === "string"
              ? userRole
              : null
          );
        } catch (error) {
          console.error(
            "Error reading role:",
            error
          );

          setRole(null);
        }
      }
    );

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const settingsRef = doc(
      db,
      "settings",
      "store"
    );

    const unsubscribeStore = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setStore({
          name: data.name || "همار",
          logo: data.logo || "/logo.jpg",
          description:
            data.description || "",
        });
      },
      (error) => {
        console.error(
          "Store settings error:",
          error
        );
      }
    );

    return () => unsubscribeStore();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  const userLetter =
    user?.displayName
      ?.charAt(0)
      ?.toUpperCase() ||
    user?.email
      ?.charAt(0)
      ?.toUpperCase() ||
    "؟";

  return (
    <nav
      dir="rtl"
      className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/80 px-7 py-4 backdrop-blur-md"
    >
      <Link
        href="/"
        className="flex items-center gap-3"
      >
        <Image
          src={store.logo || "/logo.jpg"}
          alt={store.name || "المتجر"}
          width={34}
          height={34}
          className="rounded-full object-cover"
          unoptimized
        />

        <span className="font-display text-xl font-bold tracking-wide">
          {store.name || "همار"}
        </span>
      </Link>

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

      <div className="flex items-center gap-2">
        {!user ? (
          <Link
            href="/login"
            className="rounded-full border border-lineStrong px-4 py-2 text-sm font-medium transition-all hover:border-ink hover:bg-panel"
          >
            تسجيل الدخول
          </Link>
        ) : (
          <div
            className="relative"
            ref={menuRef}
          >
            <button
              type="button"
              onClick={() =>
                setOpen(!open)
              }
              aria-label="حسابي"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-lineStrong bg-ink text-sm font-bold text-paper transition-all hover:scale-105"
            >
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="حسابي"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                userLetter
              )}
            </button>

            {open && (
              <div className="absolute left-0 top-12 w-64 overflow-hidden rounded-2xl border border-line bg-panel shadow-xl">
                <div className="border-b border-line px-4 py-4">
                  <p className="text-sm font-semibold">
                    {user.displayName ||
                      "حسابي"}
                  </p>

                  <p className="mt-1 truncate text-xs text-silver-dark">
                    {user.email}
                  </p>
                </div>

                <div className="p-2">
                  <Link
                    href="/account"
                    onClick={() =>
                      setOpen(false)
                    }
                    className="block rounded-xl px-3 py-3 text-sm transition hover:bg-paper"
                  >
                    👤 حسابي
                  </Link>

                  <Link
                    href="/orders"
                    onClick={() =>
                      setOpen(false)
                    }
                    className="block rounded-xl px-3 py-3 text-sm transition hover:bg-paper"
                  >
                    📦 طلباتي
                  </Link>

                  {role === "admin" && (
                    <>
                      <Link
                        href="/admin"
                        onClick={() =>
                          setOpen(false)
                        }
                        className="block rounded-xl px-3 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                      >
                        👑 لوحة التحكم
                      </Link>

                      <Link
                        href="/admin/products"
                        onClick={() =>
                          setOpen(false)
                        }
                        className="block rounded-xl px-3 py-3 text-sm font-semibold text-green-600 transition hover:bg-green-50"
                      >
                        📦 إدارة المنتجات
                      </Link>

                      <Link
                        href="/admin/settings"
                        onClick={() =>
                          setOpen(false)
                        }
                        className="block rounded-xl px-3 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        ⚙️ إعدادات المتجر
                      </Link>
                    </>
                  )}

                  {role === "staff" && (
                    <Link
                      href="/admin/orders"
                      onClick={() =>
                        setOpen(false)
                      }
                      className="block rounded-xl px-3 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      🛠️ إدارة الطلبات
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl px-3 py-3 text-right text-sm text-red-600 transition hover:bg-red-50"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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