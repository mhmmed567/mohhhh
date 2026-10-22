"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CupIcon } from "@/components/alm/AlmIcons";
import { isAlmToken } from "@/lib/alm-rewards";

type Gift = {
  code: string;
  rewardTitle: string;
  status: "ready" | "used";
  eligible: boolean;
  qr: string;
};

export default function GiftPage({ params }: { params: { token: string } }) {
  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      setGift(null);
      try {
        if (!isAlmToken(params.token)) throw new Error("رابط الهدية غير صحيح.");
        const response = await fetch("/api/alm/gift/" + params.token, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر تحميل الهدية.");
        setGift(data);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : "تعذر تحميل الهدية.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [params.token, retry]);
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#f1e9df] px-5 py-10 text-[#642B36]"
    >
      <div className="w-full max-w-sm">
        <div
          dir="ltr"
          className="mb-7 flex items-center justify-center gap-4 text-[10px] tracking-[0.25em]"
        >
          <span>HAMMAR</span>
          <span className="text-[#642B36]/35">×</span>
          <span>ALM</span>
        </div>
        <article className="overflow-hidden rounded-[1.7rem] bg-[#fcf8f2] shadow-[0_20px_70px_-35px_rgba(77,35,45,.25)]">
          <div className="px-8 pb-7 pt-9 text-center">
            <CupIcon className="mx-auto mb-5 h-10 w-10" />
            <p className="text-[9px] tracking-[0.23em] text-[#642B36]/55">
              A LITTLE THANK YOU
            </p>
            <h1 className="mt-3 font-display text-4xl">ضيافتك علينا.</h1>
            <p className="mx-auto mt-4 max-w-xs text-xs leading-7 text-[#642B36]/65">
              من أثر العطر إلى أول رشفة.
              <br />
              هدية من همّار، تنتظرك في كوفي ALM.
            </p>
          </div>
          <div className="relative mx-6 border-t border-dashed border-[#642B36]/20">
            <span className="absolute -right-9 -top-3 h-6 w-6 rounded-full bg-[#f1e9df]" />
            <span className="absolute -left-9 -top-3 h-6 w-6 rounded-full bg-[#f1e9df]" />
          </div>
          <div className="px-7 py-7 text-center">
            {loading && (
              <p role="status" className="py-20 text-xs">
                جارٍ تجهيز بطاقة هديتك…
              </p>
            )}
            {error && (
              <div role="alert">
                <p className="text-sm leading-7">{error}</p>
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                  className="mt-5 min-h-11 rounded-full border border-[#642B36]/20 px-6 text-xs"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}
            {gift && (
              <>
                <p className="text-base font-semibold">{gift.rewardTitle}</p>
                {gift.status === "used" ? (
                  <div className="my-7 rounded-2xl bg-[#642B36]/5 px-4 py-8">
                    <p className="text-lg font-semibold">تم استخدام الهدية</p>
                    <p className="mt-3 text-xs leading-7 text-[#642B36]/65">
                      سعدنا بضيافتك في ALM.
                      <br />
                      هذا الكود صالح للاستخدام مرة واحدة.
                    </p>
                  </div>
                ) : !gift.eligible ? (
                  <p className="my-7 rounded-xl bg-[#642B36]/5 p-6 text-sm leading-7">
                    الهدية غير متاحة حاليًا. تواصل مع همّار للتحقق من الطلب.
                  </p>
                ) : (
                  <>
                    <div className="mx-auto my-6 w-60 max-w-full rounded-2xl border border-[#642B36]/10 bg-white p-3">
                      <img
                        src={gift.qr}
                        alt="QR هدية ALM، اعرضه للمشرف في الكوفي"
                        width={640}
                        height={640}
                        className="h-auto w-full"
                      />
                    </div>
                    <p
                      dir="ltr"
                      className="text-xs font-medium tracking-[0.2em]"
                    >
                      {gift.code}
                    </p>
                    <p className="mt-4 text-xs leading-7 text-[#642B36]/65">
                      اعرض الكود للمشرف في كوفي ALM.
                      <br />
                      تُصرف الهدية مرة واحدة بعد تأكيده.
                    </p>
                    <a
                      href={"/api/alm/gift/" + params.token + "?download=1"}
                      download
                      className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#642B36] px-6 text-xs font-medium text-white"
                    >
                      حفظ صورة QR
                    </a>
                  </>
                )}
                <p className="mt-5 text-[10px] leading-6 text-[#642B36]/45">
                  احتفظ برابطك؛ لا تشاركه مع الآخرين.
                </p>
              </>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[#642B36]/10 px-7 py-5">
            <span className="text-[9px] text-[#642B36]/50">
              هدية تترك أثرًا.
            </span>
            <span dir="ltr" className="font-display text-2xl tracking-wide">
              ALM
            </span>
          </div>
        </article>
        <Link
          href="/"
          className="mt-7 block text-center text-[11px] text-[#642B36]/60"
        >
          العودة إلى همّار ←
        </Link>
      </div>
    </main>
  );
}
