"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlmAdminGate } from "@/components/alm/AlmAdminGate";
import { CupIcon, QrIcon } from "@/components/alm/AlmIcons";
import { almRequest } from "@/lib/alm-client";
import { almRedeemPath, isAlmToken, type AlmVoucher } from "@/lib/alm-rewards";

function RedeemContent({ token }: { token: string }) {
  const [voucher, setVoucher] = useState<AlmVoucher | null>(null);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<"" | "redeemed" | "already_used">("");
  const [confirmed, setConfirmed] = useState(false);
  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const result = await almRequest<{
        voucher: AlmVoucher;
        eligible: boolean;
      }>("/redeem/" + token);
      setVoucher(result.voucher);
      setEligible(result.eligible);
      if (result.voucher.status === "used") setOutcome("already_used");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر التحقق من الهدية.");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);

  async function redeem() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await almRequest<{
        outcome: "redeemed" | "already_used";
        voucher: AlmVoucher;
      }>("/redeem/" + token, { confirmed: true });
      setVoucher(result.voucher);
      setOutcome(result.outcome);
      setConfirmed(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر صرف الهدية. حدّث حالتها قبل المحاولة.",
      );
    } finally {
      setBusy(false);
    }
  }
  const used = voucher?.status === "used";
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-paper px-5 py-10"
    >
      <div className="w-full max-w-lg">
        <Link
          href="/admin/alm"
          className="mb-6 inline-flex min-h-11 items-center text-xs text-silver-dark"
        >
          ← العودة إلى هدايا ALM
        </Link>
        <section className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_20px_80px_-50px_rgba(16,16,18,.4)]">
          <div className="flex items-center justify-between bg-ink px-7 py-6 text-paper">
            <span dir="ltr" className="text-xs tracking-[0.22em]">
              HAMMAR × ALM
            </span>
            <QrIcon className="h-6 w-6 text-white/60" />
          </div>
          <div className="p-7 sm:p-9">
            {loading ? (
              <p
                role="status"
                className="py-14 text-center text-sm text-silver-dark"
              >
                جارٍ التحقق من الكود…
              </p>
            ) : (
              voucher && (
                <>
                  <div
                    className={
                      "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl " +
                      (used
                        ? outcome === "redeemed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                        : "bg-[#f4ece2] text-[#642B36]")
                    }
                  >
                    <CupIcon className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] tracking-widest text-silver-dim">
                    ضيافة همّار في ALM
                  </p>
                  <h1 className="mt-3 text-2xl font-semibold">
                    {used
                      ? outcome === "redeemed"
                        ? "تم تسجيل استخدام الهدية"
                        : "تم استخدام هذا الكود سابقًا"
                      : eligible
                        ? "الهدية جاهزة للصرف"
                        : "الهدية غير متاحة للصرف"}
                  </h1>
                  <p className="mt-3 text-sm leading-8 text-silver-dark">
                    {used
                      ? outcome === "redeemed"
                        ? "قم بتحضير طلب الضيافة من كوفي ALM. تم إغلاق الكود ولا يمكن صرفه مرة أخرى."
                        : "لا تحضّر طلبًا آخر بهذا الكود؛ سبق تسجيل استخدام الهدية."
                      : eligible
                        ? "تحقق من حضور صاحب الهدية، ثم أكد صرفها قبل تحضير الطلب."
                        : "الطلب غير مدفوع أو ملغي أو مسترجع. راجع الطلب من لوحة الإدارة."}
                  </p>
                  <dl className="my-7 space-y-4 rounded-2xl bg-paper p-5 text-sm">
                    <div>
                      <dt className="text-[10px] text-silver-dark">الهدية</dt>
                      <dd className="mt-1 font-semibold">
                        {voucher.rewardTitle}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-silver-dark">الضيف</dt>
                      <dd className="mt-1">{voucher.customerName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-xs text-silver-dark">رمز الهدية</dt>
                      <dd dir="ltr" className="text-xs font-medium">
                        {voucher.code}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-xs text-silver-dark">
                        رقم الطلب
                      </dt>
                      <dd dir="ltr" className="break-all text-xs">
                        {voucher.orderId}
                      </dd>
                    </div>
                    {voucher.usedAt && (
                      <div>
                        <dt className="text-[10px] text-silver-dark">
                          وقت الاستخدام
                        </dt>
                        <dd className="mt-1 text-xs">
                          {new Intl.DateTimeFormat("ar-OM", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "Asia/Muscat",
                          }).format(new Date(voucher.usedAt))}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {!used && eligible && (
                    <>
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-7">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          disabled={busy}
                          onChange={(e) => setConfirmed(e.target.checked)}
                          className="mt-1 h-5 w-5 shrink-0 accent-ink"
                        />
                        تحققت من الهدية وأرغب في تسجيل صرفها الآن.
                      </label>
                      <button
                        type="button"
                        onClick={() => void redeem()}
                        disabled={!confirmed || busy}
                        className="mt-6 min-h-12 w-full rounded-full bg-ink px-6 text-sm text-white transition hover:bg-ink/85 disabled:opacity-35"
                      >
                        {busy
                          ? "جارٍ تسجيل الاستخدام…"
                          : "تأكيد الاستخدام وتحضير الطلب"}
                      </button>
                      <p className="mt-3 text-center text-[10px] text-silver-dim">
                        تأكيد الصرف نهائي لهذا الكود.
                      </p>
                    </>
                  )}
                </>
              )
            )}
            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-800"
              >
                {error}
              </p>
            )}
            {!loading && (
              <button
                type="button"
                onClick={() => void load()}
                disabled={busy}
                className="mt-6 min-h-11 w-full rounded-full border border-lineStrong text-xs disabled:opacity-40"
              >
                تحديث حالة الهدية
              </button>
            )}
          </div>
        </section>
        <p className="mt-6 text-center text-[10px] text-silver-dim">
          صرف الهدايا متاح للأدمن فقط.
        </p>
      </div>
    </main>
  );
}

export default function RedeemPage({ params }: { params: { token: string } }) {
  const valid = isAlmToken(params.token);
  return (
    <AlmAdminGate
      returnPath={valid ? almRedeemPath(params.token) : "/admin/alm"}
    >
      {valid ? (
        <RedeemContent token={params.token} />
      ) : (
        <main dir="rtl" className="p-10 text-center">
          <h1>رمز الهدية غير صحيح.</h1>
          <Link href="/admin/alm" className="mt-5 inline-block underline">
            العودة للهدايا
          </Link>
        </main>
      )}
    </AlmAdminGate>
  );
}
