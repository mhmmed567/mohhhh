"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-10"
    >
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">

        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-line bg-panel shadow-[0_20px_80px_rgba(0,0,0,0.06)] md:grid-cols-2">

          {/* الجانب التعريفي */}
          <div className="relative hidden min-h-[620px] overflow-hidden bg-ink p-12 text-paper md:flex md:flex-col md:justify-between">

            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/logo.jpg"
                  alt="همار"
                  width={46}
                  height={46}
                  className="rounded-full border border-white/20"
                />

                <span className="font-display text-2xl font-bold">
                  همار
                </span>
              </Link>
            </div>

            <div className="relative z-10 max-w-sm">
              <p className="mb-4 text-sm tracking-[0.25em] text-white/50">
                HEMAR
              </p>

              <h1 className="font-display text-4xl font-bold leading-[1.35]">
                أهلاً بك
                <br />
                في عالم همار
              </h1>

              <p className="mt-6 leading-8 text-white/60">
                سجّل دخولك واستمتع بتجربة تسوق مميزة
                واكتشف مجموعتنا المختارة من العطور
              </p>
            </div>

            <div className="relative z-10 text-xs text-white/40">
              تجربة مصممة بعناية لعشاق العطور
            </div>
          </div>

          {/* نموذج تسجيل الدخول */}
          <div className="flex min-h-[620px] flex-col justify-center p-7 sm:p-12">

            <div className="mb-10 md:hidden">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.jpg"
                  alt="همار"
                  width={42}
                  height={42}
                  className="rounded-full"
                />

                <span className="font-display text-2xl font-bold">
                  همار
                </span>
              </Link>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm text-silver-dark">
                مرحباً بعودتك
              </p>

              <h2 className="font-display text-3xl font-bold text-ink">
                تسجيل الدخول
              </h2>

              <p className="mt-3 text-sm leading-6 text-silver-dark">
                أدخل بياناتك للوصول إلى حسابك
              </p>
            </div>

            <form className="space-y-5">

              {/* البريد */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-ink"
                >
                  البريد الإلكتروني
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="h-14 w-full rounded-2xl border border-lineStrong bg-paper px-4 text-sm outline-none transition-all placeholder:text-silver-dark focus:border-ink focus:ring-2 focus:ring-ink/5"
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink"
                  >
                    كلمة المرور
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-silver-dark transition-colors hover:text-ink"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-14 w-full rounded-2xl border border-lineStrong bg-paper px-4 pl-16 text-sm outline-none transition-all placeholder:text-silver-dark focus:border-ink focus:ring-2 focus:ring-ink/5"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-silver-dark transition-colors hover:text-ink"
                  >
                    {showPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>

              {/* تذكرني */}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-silver-dark">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-lineStrong accent-black"
                />
                تذكرني
              </label>

              {/* تسجيل الدخول */}
              <button
                type="submit"
                className="h-14 w-full rounded-2xl bg-ink text-sm font-semibold text-paper transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
              >
                تسجيل الدخول
              </button>
            </form>

            {/* التسجيل */}
            <div className="mt-8 text-center text-sm text-silver-dark">
              ما عندك حساب؟
              <Link
                href="/register"
                className="mr-1 font-semibold text-ink underline-offset-4 hover:underline"
              >
                إنشاء حساب
              </Link>
            </div>

            {/* العودة */}
            <Link
              href="/"
              className="mt-8 text-center text-xs text-silver-dark transition-colors hover:text-ink"
            >
              ← العودة إلى المتجر
            </Link>

          </div>
        </div>
      </div>
    </main>
  );
}