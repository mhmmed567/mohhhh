"use client";

import Link from "next/link";
import { Suspense, useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#f7f5f0] px-5"
    >
      <div className="w-full max-w-lg rounded-[30px] border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black text-3xl text-white">
          ✓
        </div>

        <p className="mt-6 text-xs font-medium tracking-[0.25em] text-black/35">
          HAMMAR
        </p>

        <h1 className="mt-3 text-3xl font-black">
          تم إرسال طلبك بنجاح
        </h1>

        <p className="mt-4 leading-7 text-black/50">
          شكرًا لك على طلبك من همار
          <br />
          سيتم التواصل معك لتأكيد الطلب والتوصيل
        </p>

        {orderId && (
          <div className="mt-6 rounded-2xl bg-[#f7f5f0] p-4">
            <p className="text-xs text-black/40">
              رقم الطلب
            </p>

            <p
              className="mt-2 break-all text-sm font-bold"
              dir="ltr"
            >
              {orderId}
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-7 block w-full rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-80"
        >
          العودة للمتجر
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-[#f7f5f0]"
        >
          <div className="text-sm text-black/50">
            جاري تحميل الطلب...
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}