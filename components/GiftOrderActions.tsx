"use client";

import { useState } from "react";
import { normalizeOrderStatus } from "@/lib/order-workflow";
import { GiftDetails, giftDeliveryMessage } from "@/lib/gifts";
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from "@/lib/whatsapp";

type GiftOrder = {
  id: string;
  isGift?: boolean;
  gift?: GiftDetails | null;
  customer?: { name?: string; phone?: string };
  total?: number;
  paymentStatus?: string;
  status?: string;
};

export function GiftOrderActions({ order }: { order: GiftOrder }) {
  const [error, setError] = useState("");
  if (!order.isGift || !order.gift) return null;
  const gift = order.gift;
  const paid = order.paymentStatus === "مدفوع";
  const active = !["تم التسليم", "ملغي", "استرجاع الطلب"].includes(normalizeOrderStatus(order.status));

  function open(phoneValue: string | undefined, message: string) {
    const phone = normalizeWhatsAppPhone(phoneValue);
    if (!phone) { setError("رقم الهاتف غير صحيح أو غير موجود."); return; }
    setError("");
    window.location.assign(buildWhatsAppUrl(phone, message, /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)));
  }

  return (
    <section aria-label="تفاصيل الإهداء والتواصل" className="my-5 space-y-4 rounded-3xl border border-black/10 bg-stone-50 p-5">
      <h3 className="font-bold">طلب إهداء — {paid ? "مدفوع بالكامل" : "بانتظار تأكيد التحويل"}</h3>
      <p className="text-sm">المرسل (للدفع فقط): {order.customer?.name} — <bdi>{order.customer?.phone}</bdi></p>
      <p className="text-sm">المستلم: {gift.recipientName} — <bdi>{gift.recipientPhone}</bdi></p>
      <p className="text-sm">عنوان التوصيل: {gift.recipientAddress}</p>
      <p className="text-sm font-semibold">{gift.hideSender ? "هدية بدون اسم — لا تكشف بيانات المرسل للمستلم" : "يُسمح بإظهار اسم المرسل"}</p>
      {gift.message && <p className="whitespace-pre-wrap text-sm">رسالة بطاقة الإهداء: {gift.message}</p>}
      <p className="text-sm">لا ترفق فاتورة الأسعار مع الهدية. {paid ? "لا يُحصّل أي مبلغ من المستلم." : "اختر حالة «تم التحويل» بعد التحقق من وصول المبلغ لتأكيد الدفع."}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!paid || !active} className="min-h-11 rounded-xl border border-black/20 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50" onClick={() => { if (paid && active) open(gift.recipientPhone, giftDeliveryMessage(gift, order.customer?.name || "")); }}>
          واتساب المستلم — تنسيق التوصيل
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
