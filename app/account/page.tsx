"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/");
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-paper"
      >
        <p className="text-sm text-silver-dark">
          جاري تحميل الحساب...
        </p>
      </main>
    );
  }

  if (!user) return null;

  const letter =
    user.displayName?.charAt(0)?.toUpperCase() ||
    user.email?.charAt(0)?.toUpperCase() ||
    "؟";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-8 md:px-8"
    >
      <div className="mx-auto max-w-5xl">

        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-2 text-sm text-silver-dark">
              حسابك في همار
            </p>

            <h1 className="font-display text-3xl font-bold md:text-4xl">
              أهلاً بك 👋
            </h1>
          </div>

          <Link
            href="/"
            className="hidden rounded-full border border-lineStrong px-5 py-2.5 text-sm transition hover:border-ink hover:bg-panel md:block"
          >
            العودة للمتجر
          </Link>
        </div>

        <section className="mb-6 border border-line bg-panel p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">

            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-3xl font-bold text-paper">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="صورة الحساب"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                letter
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xl font-semibold">
                {user.displayName || "عميل همار"}
              </p>

              <p className="mt-2 truncate text-sm text-silver-dark">
                {user.email}
              </p>

              <p className="mt-3 text-xs text-silver-dark">
                حسابك مفعل ويمكنك متابعة طلباتك من هنا
              </p>
            </div>

          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">

          <Link
            href="/orders"
            className="group border border-line bg-panel p-6 transition hover:border-ink hover:shadow-lg"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper">
              ✓
            </div>

            <h2 className="text-lg font-semibold">
              طلباتي
            </h2>

            <p className="mt-2 text-sm leading-6 text-silver-dark">
              تابع طلباتك وحالة كل طلب
            </p>

            <span className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
              عرض الطلبات
            </span>
          </Link>

          <Link
            href="/cart"
            className="group border border-line bg-panel p-6 transition hover:border-ink hover:shadow-lg"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-paper">
              🛒
            </div>

            <h2 className="text-lg font-semibold">
              السلة
            </h2>

            <p className="mt-2 text-sm leading-6 text-silver-dark">
              راجع المنتجات الموجودة في سلتك
            </p>

            <span className="mt-5 inline-block text-sm font-medium underline underline-offset-4">
              الذهاب للسلة
            </span>
          </Link>

        </div>

        <section className="mt-6 border border-line bg-panel p-6 md:p-8">

          <h2 className="mb-6 text-lg font-semibold">
            معلومات الحساب
          </h2>

          <div className="divide-y divide-line">

            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-silver-dark">
                البريد الإلكتروني
              </span>

              <span className="max-w-[60%] truncate text-sm font-medium">
                {user.email}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-silver-dark">
                حالة الحساب
              </span>

              <span className="text-sm font-medium text-green-600">
                مفعل
              </span>
            </div>

          </div>
        </section>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full border border-red-200 bg-red-50 px-6 py-4 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            تسجيل الخروج
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-silver-dark">
          © {new Date().getFullYear()} همار
        </p>

      </div>
    </main>
  );
}