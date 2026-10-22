"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlmAdminGate } from "@/components/alm/AlmAdminGate";
import { CupIcon, QrIcon } from "@/components/alm/AlmIcons";
import { almRequest } from "@/lib/alm-client";
import {
  almGiftMessage,
  isAlmToken,
  type AlmCampaign,
  type AlmVoucher,
  type AlmAllocation,
} from "@/lib/alm-rewards";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Dashboard = {
  campaign: AlmCampaign;
  vouchers: AlmVoucher[];
  nextCursor: string | null;
};
const field =
  "min-h-12 w-full rounded-xl border border-lineStrong bg-paper px-4 text-sm focus:border-ink";
const reasons: Record<string, string> = {
  unpaid: "أكد وصول تحويل الطلب أولًا، ثم امنح الهدية.",
  closed: "لا يمكن منح هدية لطلب ملغي أو مسترجع.",
  duplicate_customer:
    "هذا العميل حصل على هدية بالفعل. تُمنح هدية واحدة لكل رقم هاتف.",
  limit_reached: "اكتمل عدد الهدايا. ارفع الحد من إعدادات الحملة إذا رغبت.",
  disabled: "خدمة الهدايا لم تُفعّل بعد.",
};
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ar-OM", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Muscat",
      }).format(new Date(value))
    : "—";

function DashboardContent() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [form, setForm] = useState<AlmCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [orderId, setOrderId] = useState("");
  const [search, setSearch] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [scanError, setScanError] = useState("");
  const [selected, setSelected] = useState<AlmVoucher | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const result = await almRequest<Dashboard>("");
      setData(result);
      setForm(result.campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الهدايا.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (selected)
      document
        .getElementById("alm-selected-gift")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy("save");
    setError("");
    setNotice("");
    try {
      const result = await almRequest<{ campaign: AlmCampaign }>(
        "",
        form,
        "PUT",
      );
      setForm(result.campaign);
      setData(
        (current) => current && { ...current, campaign: result.campaign },
      );
      setNotice("تم حفظ إعدادات الحملة.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ الإعدادات.");
    } finally {
      setBusy("");
    }
  }

  async function grant(event: FormEvent) {
    event.preventDefault();
    setBusy("grant");
    setError("");
    setNotice("");
    setSelected(null);
    try {
      const result = await almRequest<AlmAllocation>("/allocate", {
        orderId: orderId.trim(),
        mode: "manual",
      });
      if (!result.voucher) {
        setError(reasons[result.reason || ""] || "تعذر منح الهدية لهذا الطلب.");
        return;
      }
      setSelected(result.voucher);
      const updated = await almRequest<Dashboard>("");
      setData(updated);
      setForm(updated.campaign);
      setNotice(
        "هدية الطلب جاهزة. يمكنك الآن معاينة الرسالة وإرسالها من واتساب.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر منح الهدية.");
    } finally {
      setBusy("");
    }
  }

  async function searchOrder(event: FormEvent) {
    event.preventDefault();
    setBusy("search");
    setError("");
    try {
      const result = await almRequest<Dashboard>(
        search.trim() ? "?orderId=" + encodeURIComponent(search.trim()) : "",
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر البحث.");
    } finally {
      setBusy("");
    }
  }

  async function more() {
    if (!data?.nextCursor) return;
    setBusy("more");
    setError("");
    try {
      const result = await almRequest<Dashboard>(
        "?cursor=" + encodeURIComponent(data.nextCursor),
      );
      setData({ ...result, vouchers: [...data.vouchers, ...result.vouchers] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل المزيد.");
    } finally {
      setBusy("");
    }
  }

  function openScan(event: FormEvent) {
    event.preventDefault();
    setScanError("");
    let token = scanValue.trim();
    try {
      const url = new URL(token, window.location.origin);
      if (
        url.origin !== window.location.origin ||
        !/^\/(?:alm\/gift|admin\/alm\/redeem)\/[a-f0-9]{64}$/.test(url.pathname)
      ) {
        if (!isAlmToken(token)) throw new Error();
      } else token = url.pathname.split("/").pop() || "";
      if (!isAlmToken(token)) throw new Error();
      window.location.assign("/admin/alm/redeem/" + token);
    } catch {
      setScanError("الصق رابط هدية همّار أو رمزها الكامل الصحيح.");
    }
  }

  function whatsapp(voucher: AlmVoucher) {
    return buildWhatsAppUrl(
      voucher.customerPhone,
      "السلام عليكم " +
        voucher.customerName +
        "،" +
        almGiftMessage(voucher, window.location.origin),
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    );
  }

  const campaign = data?.campaign;
  const displayed = (data?.vouchers || []).filter(
    (voucher) => filter === "all" || voucher.status === filter,
  );

  return (
    <main dir="rtl" className="min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-paper/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-lg text-paper">
              هـ
            </span>
            <span>
              <span className="block text-sm font-semibold">همّار للعطور</span>
              <span className="text-[11px] text-silver-dark">
                لوحة الإدارة / هدايا ALM
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={loading || !!busy}
              onClick={() => void load()}
              className="min-h-11 rounded-full border border-lineStrong px-4 text-xs disabled:opacity-40"
            >
              تحديث البيانات
            </button>
            <Link
              href="/admin"
              className="min-h-11 rounded-full bg-ink px-5 py-3 text-xs text-white"
            >
              العودة للإدارة ←
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-ink p-7 text-paper sm:p-10">
          <div
            className="absolute -left-12 -top-16 h-80 w-80 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-28 left-20 h-80 w-80 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span
                  dir="ltr"
                  className="text-[10px] font-medium tracking-[0.3em] text-white/55"
                >
                  HAMMAR × ALM
                </span>
                <span className="h-px w-10 bg-white/20" />
              </div>
              <h1 className="font-display text-4xl leading-snug sm:text-5xl">
                أثر العطر،
                <br />
                وضيافة القهوة.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/60">
                لفتة من همّار لعملائك. اختر المستفيدين، أرسل هديتهم، وتابع صرفها
                في كوفي ALM من مكان واحد.
              </p>
              <span
                className={
                  "mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] " +
                  (campaign?.active
                    ? "border-emerald-200/20 text-emerald-100"
                    : "border-white/15 text-white/60")
                }
              >
                <span
                  className={
                    "h-1.5 w-1.5 rounded-full " +
                    (campaign?.active ? "bg-emerald-300" : "bg-white/40")
                  }
                />
                {campaign
                  ? campaign.active
                    ? "الاختيار العشوائي مفعّل"
                    : "الاختيار العشوائي متوقف"
                  : loading
                    ? "جارٍ تحميل الحملة"
                    : "الخدمة غير متاحة"}
              </span>
            </div>
            <div className="hidden w-56 rotate-3 rounded-2xl bg-[#f4ece2] p-6 text-[#642B36] shadow-2xl md:block">
              <span dir="ltr" className="block text-[9px] tracking-[0.25em]">
                A LITTLE THANK YOU
              </span>
              <div className="my-6 flex items-center justify-between">
                <span dir="ltr" className="font-display text-5xl">
                  ALM
                </span>
                <CupIcon className="h-11 w-11" />
              </div>
              <div className="-mx-6 border-t border-dashed border-[#642B36]/25" />
              <p className="mt-5 font-display text-xl">ضيافتك علينا.</p>
              <p className="mt-2 text-[10px] text-[#642B36]/65">
                هدية واحدة، ولحظة تستحق.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-800"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-800"
          >
            {notice}
          </div>
        )}
        {loading && !data && (
          <div role="status" className="grid gap-4 py-6 sm:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-28 animate-pulse rounded-2xl bg-ink/5"
              />
            ))}
            <span className="sr-only">جارٍ تحميل الهدايا…</span>
          </div>
        )}

        {campaign && form && (
          <>
            <section
              aria-label="إحصائيات الهدايا"
              className="my-6 grid grid-cols-3 gap-3 sm:gap-5"
            >
              {[
                [
                  "الهدايا الممنوحة",
                  campaign.issuedCount,
                  "من أصل " + campaign.limit,
                ],
                [
                  "بانتظار الزيارة",
                  campaign.issuedCount - campaign.redeemedCount,
                  "هدايا لم تُصرف بعد",
                ],
                ["تمت ضيافتهم", campaign.redeemedCount, "هدايا صُرفت في ALM"],
              ].map(([label, value, note]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl border border-line bg-white p-4 sm:p-6"
                >
                  <p className="text-[10px] text-silver-dark sm:text-sm">
                    {label}
                  </p>
                  <p className="my-3 text-3xl font-semibold tabular-nums sm:text-4xl">
                    {value}
                  </p>
                  <p className="text-[9px] text-silver-dim sm:text-xs">
                    {note}
                  </p>
                </div>
              ))}
            </section>
            <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
              <aside className="space-y-5">
                <form
                  onSubmit={save}
                  className="rounded-3xl border border-line bg-white p-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">إعدادات الحملة</h2>
                    <CupIcon className="h-6 w-6 text-silver-dim" />
                  </div>
                  <p className="mt-2 text-xs leading-6 text-silver-dark">
                    أنت تحدد العدد، والاختيار يكون بين الطلبات المدفوعة عند
                    تجهيز رسالة واتساب.
                  </p>
                  <label className="mt-6 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-paper p-4 text-sm">
                    <span>الاختيار العشوائي</span>
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                      className="h-5 w-5 accent-ink"
                    />
                  </label>
                  <label className="mt-5 block text-xs font-medium">
                    الحد الأعلى للمستفيدين
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      required
                      value={form.limit}
                      onChange={(e) =>
                        setForm({ ...form, limit: Number(e.target.value) })
                      }
                      className={field + " mt-2"}
                    />
                  </label>
                  <label className="mt-5 block text-xs font-medium">
                    فرصة الاختيار (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      value={form.chancePercent}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          chancePercent: Number(e.target.value),
                        })
                      }
                      className={field + " mt-2"}
                    />
                  </label>
                  <p className="mt-2 text-[11px] leading-6 text-silver-dark">
                    مثلًا: 20% تمنح فرصة عشوائية لكل طلب. 100% تمنح الهدية لكل
                    عميل مؤهل حتى يكتمل العدد.
                  </p>
                  <label className="mt-5 block text-xs font-medium">
                    الهدية المقدمة
                    <input
                      maxLength={100}
                      required
                      value={form.rewardTitle}
                      onChange={(e) =>
                        setForm({ ...form, rewardTitle: e.target.value })
                      }
                      className={field + " mt-2"}
                    />
                  </label>
                  <p className="mt-2 text-[11px] leading-6 text-silver-dark">
                    يتغير وصف الهدايا الجديدة فقط؛ الهدايا السابقة تحتفظ بوصفها.
                  </p>
                  <button
                    disabled={!!busy || loading}
                    className="mt-6 min-h-12 w-full rounded-full bg-ink px-5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {busy === "save" ? "جارٍ الحفظ…" : "حفظ إعدادات الحملة"}
                  </button>
                  <p className="mt-4 text-center text-[10px] leading-6 text-silver-dim">
                    هدية واحدة لكل رقم هاتف. إعادة تجهيز الرسالة لا تعيد السحب.
                    إيقاف العشوائي يترك الهدايا السابقة والمنح اليدوي متاحين.
                  </p>
                </form>
                <section className="rounded-3xl border border-[#642B36]/15 bg-[#f4ece2] p-6 text-[#642B36]">
                  <h2 className="flex items-center gap-2 text-base font-semibold">
                    <QrIcon className="h-5 w-5" />
                    استقبال ضيف ALM
                  </h2>
                  <p className="mt-3 text-xs leading-7">
                    امسح QR بكاميرا هاتفك. يفتح لك طلب صرف الهدية بعد تسجيل دخول
                    الأدمن.
                  </p>
                  <form onSubmit={openScan} className="mt-4">
                    <label htmlFor="scan-link" className="text-[11px]">
                      أو الصق رابط الهدية هنا
                    </label>
                    <input
                      id="scan-link"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="https://hammar1.shop/…"
                      className={field + " mt-2 bg-white/60 text-ink"}
                    />
                    <button className="mt-3 min-h-11 w-full rounded-full border border-[#642B36]/25 text-xs font-medium">
                      فتح الهدية للتحقق ←
                    </button>
                  </form>
                  {scanError && (
                    <p role="alert" className="mt-3 text-xs leading-6">
                      {scanError}
                    </p>
                  )}
                </section>
              </aside>
              <div className="min-w-0 space-y-6">
                <section className="rounded-3xl border border-line bg-white p-6 sm:p-7">
                  <p className="text-[10px] tracking-widest text-silver-dark">
                    لفتة تختار صاحبها
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    امنح هدية لطلب محدد
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-silver-dark">
                    للطلبات المدفوعة فقط، ضمن الحد المتبقي للحملة.
                  </p>
                  <form
                    onSubmit={grant}
                    className="mt-5 flex flex-col gap-3 sm:flex-row"
                  >
                    <label htmlFor="manual-order" className="sr-only">
                      رقم الطلب لمنح الهدية
                    </label>
                    <input
                      id="manual-order"
                      required
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      dir="ltr"
                      placeholder="رقم الطلب الكامل"
                      className={field + " flex-1"}
                    />
                    <button
                      disabled={!!busy || loading}
                      className="min-h-12 shrink-0 rounded-full bg-ink px-6 text-sm text-white disabled:opacity-40"
                    >
                      {busy === "grant" ? "جارٍ تجهيز الهدية…" : "منح هدية ALM"}
                    </button>
                  </form>
                  {selected && (
                    <div
                      id="alm-selected-gift"
                      className="mt-5 rounded-2xl border border-line bg-paper p-5"
                    >
                      <p className="text-sm font-semibold">
                        {selected.customerName} · <bdi>{selected.code}</bdi>
                      </p>
                      <p className="mt-2 text-xs text-silver-dark">
                        {selected.rewardTitle}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={"/alm/gift/" + selected.token}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-11 rounded-full border border-lineStrong px-4 py-3 text-xs"
                        >
                          عرض QR
                        </a>
                        {selected.status === "ready" ? (
                          <a
                            href={whatsapp(selected)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-11 rounded-full bg-ink px-4 py-3 text-xs text-white"
                          >
                            معاينة وإرسال في واتساب ↗
                          </a>
                        ) : (
                          <span className="py-3 text-xs text-silver-dark">
                            تم استخدام هذه الهدية
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-3xl border border-line bg-white">
                  <div className="border-b border-line p-6 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-semibold">سجل الضيافة</h2>
                      <div
                        className="flex gap-1 rounded-full bg-paper p-1"
                        aria-label="تصفية حالة الهدايا"
                      >
                        {[
                          ["all", "الكل"],
                          ["ready", "لم تُستخدم"],
                          ["used", "مستخدمة"],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={filter === value}
                            onClick={() => setFilter(value)}
                            className={
                              "min-h-10 rounded-full px-3 text-[11px] " +
                              (filter === value
                                ? "bg-ink text-white"
                                : "text-silver-dark")
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <form onSubmit={searchOrder} className="mt-5 flex gap-2">
                      <label htmlFor="search-order" className="sr-only">
                        البحث برقم الطلب الكامل
                      </label>
                      <input
                        id="search-order"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        dir="ltr"
                        placeholder="بحث برقم الطلب الكامل"
                        className={field + " min-w-0 flex-1"}
                      />
                      <button
                        disabled={!!busy}
                        className="min-h-12 rounded-xl border border-lineStrong px-5 text-xs disabled:opacity-40"
                      >
                        بحث
                      </button>
                    </form>
                  </div>
                  {displayed.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                      <CupIcon className="mx-auto h-10 w-10 text-silver-dim" />
                      <p className="mt-4 text-sm font-medium">
                        لا توجد هدايا هنا بعد
                      </p>
                      <p className="mt-2 text-xs leading-6 text-silver-dark">
                        ستظهر الهدايا بعد اختيار المستفيدين أو منحها يدويًا.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {displayed.map((voucher) => (
                        <li key={voucher.token} className="p-5 sm:px-7 sm:py-6">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm font-semibold">
                                  {voucher.customerName}
                                </span>
                                <span
                                  className={
                                    "rounded-full px-2.5 py-1 text-[10px] " +
                                    (voucher.status === "used"
                                      ? "bg-ink/5 text-silver-dark"
                                      : "bg-emerald-50 text-emerald-800")
                                  }
                                >
                                  {voucher.status === "used"
                                    ? "تم استخدامها"
                                    : "بانتظار الزيارة"}
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-silver-dark">
                                {voucher.rewardTitle}
                              </p>
                              <p className="mt-2 break-all text-[10px] text-silver-dim">
                                الطلب <bdi>{voucher.orderId}</bdi> ·{" "}
                                {date(voucher.issuedAt)}
                              </p>
                              {voucher.usedAt && (
                                <p className="mt-1 text-[10px] text-silver-dark">
                                  صُرفت {date(voucher.usedAt)}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelected(voucher)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-lineStrong px-4 text-xs"
                            >
                              <QrIcon className="h-4 w-4" />
                              عرض وإرسال
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {data?.nextCursor && (
                    <div className="border-t border-line p-4 text-center">
                      <button
                        type="button"
                        onClick={() => void more()}
                        disabled={!!busy}
                        className="min-h-11 rounded-full border border-lineStrong px-7 text-xs disabled:opacity-40"
                      >
                        {busy === "more" ? "جارٍ التحميل…" : "عرض المزيد"}
                      </button>
                      <p className="mt-2 text-[10px] text-silver-dim">
                        التصفية تشمل الهدايا المحمّلة حاليًا.
                      </p>
                    </div>
                  )}
                </section>
                <p className="px-2 text-[11px] leading-7 text-silver-dark">
                  فتح الرابط أو تصوير الكود لا يصرف الهدية. الصرف يُسجل فقط
                  عندما يؤكده الأدمن، ولا يمكن تكراره.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function AlmAdminPage() {
  return (
    <AlmAdminGate>
      <DashboardContent />
    </AlmAdminGate>
  );
}
