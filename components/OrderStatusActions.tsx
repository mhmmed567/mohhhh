"use client";

import { useEffect, useId, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateOrderStatus } from "@/lib/order-status";
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { buildOrderMessage, getOrderStatus, isOrderStatus, normalizeOrderStatus, orderStatuses, type MessageSettings, type OrderStatusUpdate, type WorkflowOrder } from "@/lib/order-workflow";

export function OrderStatusActions({ order, onUpdated }: {
  order: WorkflowOrder;
  onUpdated: (id: string, update: OrderStatusUpdate) => void;
}) {
  const id = useId();
  const savedStatus = normalizeOrderStatus(order.status);
  const [draftStatus, setDraftStatus] = useState(savedStatus);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{ text: string; url: string } | null>(null);
  useEffect(() => {
    setDraftStatus(savedStatus); setConfirmed(false); setPreview(null); setError("");
  }, [order.id, savedStatus, order.paymentStatus]);

  async function save() {
    setBusy(true); setError(""); setNotice(""); setPreview(null);
    try {
      const update = await updateOrderStatus(order.id, draftStatus, confirmed, order.status || "");
      onUpdated(order.id, update);
      setNotice("تم حفظ حالة الطلب. يمكنك الآن فتح رسالتها في واتساب.");
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر حفظ الحالة. حاول مجددًا."); }
    finally { setBusy(false); }
  }

  async function showMessage() {
    setBusy(true); setError(""); setPreview(null);
    try {
      const orderSnapshot = await getDoc(doc(db, "orders", order.id));
      if (!orderSnapshot.exists()) throw new Error("الطلب غير موجود. حدّث قائمة الطلبات.");
      const current = { ...orderSnapshot.data(), id: order.id } as WorkflowOrder;
      if (normalizeOrderStatus(current.status) !== savedStatus || (current.paymentStatus || "غير مدفوع") !== (order.paymentStatus || "غير مدفوع")) {
        throw new Error("تغيرت بيانات الطلب. حدّث الطلبات قبل تجهيز الرسالة.");
      }
      const phone = normalizeWhatsAppPhone(current.customer?.phone || current.phone);
      if (!phone) throw new Error("رقم العميل غير موجود أو غير صحيح.");
      let settings: MessageSettings = {};
      if (savedStatus === "بانتظار التحويل") {
        const snapshot = await getDoc(doc(db, "settings", "store"));
        settings = snapshot.exists() ? snapshot.data() as MessageSettings : {};
      }
      const text = buildOrderMessage(current, settings);
      setPreview({ text, url: buildWhatsAppUrl(phone, text, /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) });
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تجهيز الرسالة. تحقق من إعدادات المتجر."); }
    finally { setBusy(false); }
  }

  return (
    <section aria-label={`حالة ورسالة الطلب ${order.id}`} className="my-4 min-w-0 space-y-3 rounded-2xl border border-black/10 bg-stone-50 p-4">
      <label htmlFor={id} className="block text-sm font-bold">حالة الطلب</label>
      <div className="flex flex-wrap gap-2">
        <select id={id} value={draftStatus} disabled={busy} onChange={(e) => { setDraftStatus(e.target.value); setConfirmed(false); setPreview(null); setNotice(""); setError(""); }} className="min-h-11 min-w-0 flex-1 rounded-xl border border-black/20 bg-white px-3 text-sm disabled:opacity-50">
          {!isOrderStatus(savedStatus) && <option value={savedStatus} disabled>{getOrderStatus(savedStatus).label} (حالة سابقة)</option>}
          {orderStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <button type="button" disabled={busy || draftStatus === savedStatus || (draftStatus === "تم التحويل" && !confirmed)} onClick={save} className="min-h-11 rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-40">{busy ? "جاري التنفيذ..." : "حفظ الحالة"}</button>
      </div>
      {draftStatus === "تم التحويل" && draftStatus !== savedStatus && <label className="flex items-start gap-2 text-sm leading-6"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-black" />تحققت من وصول كامل مبلغ الطلب إلى حساب المتجر.</label>}
      {draftStatus === "استرجاع الطلب" && <p className="text-xs leading-6 text-black/60">تسجّل هذه الحالة الاسترجاع؛ لا تؤكد إعادة المبلغ للعميل.</p>}
      <button type="button" disabled={busy || draftStatus !== savedStatus} onClick={showMessage} className="min-h-11 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-40">معاينة {getOrderStatus(savedStatus).messageLabel}{order.isGift ? " — للمرسل" : ""}</button>
      {draftStatus !== savedStatus && <p className="text-xs text-black/60">احفظ الحالة أولًا لتجهيز رسالتها.</p>}
      {preview && <div className="space-y-3 border-t border-black/10 pt-3"><p className="whitespace-pre-wrap break-words text-sm leading-7">{preview.text}</p><a href={preview.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">فتح الرسالة في واتساب ↗</a><p className="text-xs text-black/60">راجع الرسالة وأرسلها من واتساب.</p></div>}
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
