"use client";

import { useState } from "react";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GiftDetails, giftDeliveryMessage } from "@/lib/gifts";
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from "@/lib/whatsapp";

type GiftOrder = {
  id: string;
  isGift?: boolean;
  gift?: GiftDetails | null;
  customer?: { name?: string; phone?: string };
  total?: number;
  paymentStatus?: string;
};

export function GiftOrderActions({ order, onPaid }: { order: GiftOrder; onPaid: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!order.isGift || !order.gift) return null;
  const gift = order.gift;
  const paid = order.paymentStatus === "مدفوع";

  function open(phoneValue: string | undefined, message: string) {
    const phone = normalizeWhatsAppPhone(phoneValue);
    if (!phone) { setError("رقم الهاتف غير صحيح أو غير موجود."); return; }
    setError("");
    window.location.assign(buildWhatsAppUrl(phone, message, /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)));
  }

  async function confirmPaid() {
    if (!window.confirm("هل تحققت من وصول كامل المبلغ إلى حسابك؟ صورة الإيصال وحدها لا تؤكد الدفع.")) return;
    setBusy(true); setError("");
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "orders", order.id);
        const snap = await transaction.get(ref);
        if (!snap.exists() || snap.data().isGift !== true) throw new Error("الطلب غير موجود");
        transaction.update(ref, { paymentStatus: "مدفوع", updatedAt: serverTimestamp() });
      });
      onPaid();
    } catch { setError("تعذر تأكيد التحويل. تحقق من الصلاحيات والاتصال."); }
    finally { setBusy(false); }
  }

  return (
    <section aria-label="تفاصيل الإهداء والتواصل" className="my-5 space-y-4 rounded-3xl border border-black/10 bg-stone-50 p-5">
      <h3 className="font-bold">طلب إهداء — {paid ? "مدفوع بالكامل" : "بانتظار تأكيد التحويل"}</h3>
      <p className="text-sm">المرسل (للدفع فقط): {order.customer?.name} — <bdi>{order.customer?.phone}</bdi></p>
      <p className="text-sm">المستلم: {gift.recipientName} — <bdi>{gift.recipientPhone}</bdi></p>
      <p className="text-sm">عنوان التوصيل: {gift.recipientAddress}</p>
      <p className="text-sm font-semibold">{gift.hideSender ? "هدية بدون اسم — لا تكشف بيانات المرسل للمستلم" : "يُسمح بإظهار اسم المرسل"}</p>
      {gift.message && <p className="whitespace-pre-wrap text-sm">رسالة بطاقة الإهداء: {gift.message}</p>}
      <p className="text-sm">لا ترفق فاتورة الأسعار مع الهدية. {paid ? "لا يُحصّل أي مبلغ من المستلم." : "لا تجهّز أو ترسل الهدية قبل تأكيد وصول التحويل."}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="min-h-11 rounded-xl bg-black px-4 py-3 text-sm text-white" onClick={() => open(order.customer?.phone, paid
          ? `السلام عليكم ${order.customer?.name || ""}، تم تأكيد تحويل طلب الهدية #${order.id} من همّار. شكرًا لك.`
          : `همّار | HAMMAR

السلام عليكم ${order.customer?.name || "عميل همّار"}،
استلمنا طلب الإهداء، وشكرًا لاختيارك همّار.

المبلغ: ${Number(order.total || 0).toFixed(3)} ر.ع
رقم التحويل: 92587656

أرسل الإيصال هنا لنؤكد وصول المبلغ ونكمل طلبك.
لن يُطلب من مستلم الهدية دفع أي مبلغ، وسنلتزم باختيارك بشأن إظهار اسمك أو إخفائه.`)}>
          واتساب المرسل — {paid ? "تأكيد الدفع" : "تأكيد وتحويل"}
        </button>
        <button type="button" disabled={!paid} className="min-h-11 rounded-xl border border-black/20 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { if (paid) open(gift.recipientPhone, giftDeliveryMessage(gift, order.customer?.name || "")); }}>
          واتساب المستلم — تنسيق التوصيل
        </button>
        {!paid && <button type="button" disabled={busy} onClick={confirmPaid} className="min-h-11 rounded-xl border border-black/20 px-4 py-3 text-sm disabled:opacity-50">{busy ? "جاري الحفظ..." : "تأكيد وصول التحويل"}</button>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
