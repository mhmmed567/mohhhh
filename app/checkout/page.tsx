"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
collection,
doc,
runTransaction,
serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import type { GiftDetails } from "@/lib/gifts";
import type { DocumentSnapshot, DocumentData } from "firebase/firestore";
import { isProductComingSoon } from "@/lib/products";
import { CartItem, clearCart, getCart } from "@/lib/cart";

type FormData = {
name: string;
phone: string;
address: string;
notes: string;
};

export default function CheckoutPage() {
const router = useRouter();

const [items, setItems] = useState<CartItem[]>([]);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [isGift, setIsGift] = useState(false);
const [gift, setGift] = useState<GiftDetails>({ recipientName: "", recipientPhone: "", recipientAddress: "", message: "", hideSender: true });
const paymentLabel = isGift ? "تحويل مسبق — التأكيد عبر واتساب المرسل" : "الدفع عند الاستلام";

const [step, setStep] = useState<1 | 2>(1);

const [form, setForm] = useState<FormData>({
name: "",
phone: "",
address: "",
notes: "",
});

const [error, setError] = useState("");

useEffect(() => {
async function loadCheckout() {
try {
const cartItems = getCart();

  if (cartItems.length === 0) {
      router.replace("/cart");
      return;
    }

    setItems(cartItems);
  } catch (err) {
    console.error("Checkout loading error:", err);
    setError("حدث خطأ أثناء تحميل بيانات الطلب");
  } finally {
    setLoading(false);
  }
}

loadCheckout();


}, [router]);

const subtotal = useMemo(() => {
return items.reduce((total, item) => {
return total + Number(item.price) * Number(item.quantity);
}, 0);
}, [items]);

const total = subtotal;

function updateField(
field: keyof FormData,
value: string
) {
setForm((current) => ({
...current,
[field]: value,
}));
}

function confirmPayment() {
setError("");
setStep(2);
}

async function submitOrder() {
setError("");


if (!form.name.trim()) {
  setError("اكتب اسمك");
  return;
}

if (!form.phone.trim()) {
  setError("اكتب رقم الهاتف");
  return;
}

if (!normalizeWhatsAppPhone(form.phone)) {
  setError("اكتب رقم هاتف صحيح");
  return;
}

if (!isGift && !form.address.trim()) {
  setError("اكتب عنوانك");
  return;
}

if (isGift && (!gift.recipientName.trim() || !normalizeWhatsAppPhone(gift.recipientPhone) || !gift.recipientAddress.trim())) {
  setError("أكمل اسم مستلم الهدية ورقم هاتف صحيح وعنوان التوصيل.");
  return;
}

if (items.length === 0) {
  setError("السلة فارغة");
  return;
}

setSubmitting(true);

try {
  const orderData = {
    userId: null,
    isGift,
    gift: isGift ? {
      recipientName: gift.recipientName.trim(),
      recipientPhone: normalizeWhatsAppPhone(gift.recipientPhone)!,
      recipientAddress: gift.recipientAddress.trim(),
      message: gift.message.trim(),
      hideSender: gift.hideSender,
    } : null,

    customer: {
      name: form.name.trim(),
      phone: normalizeWhatsAppPhone(form.phone)!,
      address: isGift ? gift.recipientAddress.trim() : form.address.trim(),
      notes: form.notes.trim(),
    },

    items: items.map((item) => ({
      productId: item.id,
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image || "",
    })),

    subtotal: Number(subtotal),
    total: Number(total),

    paymentMethod: isGift ? "تحويل مسبق" : "الدفع عند الاستلام",
    paymentStatus: isGift ? "بانتظار تأكيد التحويل" : "غير مدفوع",

    status: isGift ? "بانتظار تأكيد التحويل" : "جديد",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const orderId = await runTransaction(db, async (transaction) => {
    const productSnapshots: DocumentSnapshot<DocumentData>[] = [];

    for (const item of items) {
      productSnapshots.push(
        await transaction.get(doc(db, "products", item.id))
      );
    }

    const unavailableProducts = productSnapshots
      .map((snapshot, index) => ({
        snapshot,
        item: items[index],
      }))
      .filter(({ snapshot }) => {
        if (!snapshot.exists()) return true;

        const product = snapshot.data();

        return (
          product.visible === false ||
          String(product.stock ?? "").trim() === "نفد المخزون"
        );
      })
      .map(({ item }) => item.name);

    if (unavailableProducts.length > 0) {
      throw new Error(
        `OUT_OF_STOCK:${unavailableProducts.join("، ")}`
      );
    }

    const orderRef = doc(collection(db, "orders"));

    const confirmedItems = orderData.items.map((item, index) => ({
      ...item,
      preOrder: isProductComingSoon({ stock: String(productSnapshots[index].data()?.stock ?? "") }),
    }));
    // Require a fresh cart review if an available item has become a preorder.
    if (confirmedItems.some((item, index) => item.preOrder && !items[index].preOrder)) {
      throw new Error("PREORDER_CHANGED");
    }
    transaction.set(orderRef, {
      ...orderData,
      items: confirmedItems,
      hasPreOrder: confirmedItems.some((item) => item.preOrder),
    });

    return orderRef.id;
  });

  clearCart();

  router.replace(
    `/checkout/success?orderId=${orderId}${isGift ? "&gift=1" : ""}`
  );
} catch (err) {
  console.error("Order creation error:", err);

  if (err instanceof Error && err.message === "PREORDER_CHANGED") {
    setError("أصبح أحد المنتجات متاحًا للطلب المسبق فقط. احذفه من السلة وأضفه مجددًا كطلب مسبق قبل التأكيد.");
  } else if (
    err instanceof Error &&
    err.message.startsWith("OUT_OF_STOCK:")
  ) {
    const names = err.message.replace("OUT_OF_STOCK:", "");

    setError(
      `عذرًا، نفد مخزون: ${names}. احذفه من السلة ثم أكمل الطلب.`
    );
  } else {
    setError(
      "تعذر إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة ثانية."
    );
  }
} finally {
  setSubmitting(false);
}


}

if (loading) {
return ( <main
     dir="rtl"
     className="flex min-h-screen items-center justify-center bg-[#f7f5f0]"
   > <div className="text-center"> <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />


      <p className="mt-4 text-sm text-black/50">
        جاري تجهيز الطلب...
      </p>
    </div>
  </main>
);


}

return ( <main
   dir="rtl"
   className="min-h-screen bg-[#f7f5f0] px-4 py-8 sm:px-6 lg:px-10"
 > <div className="mx-auto max-w-6xl"> <div className="mb-8"> <Link
         href="/cart"
         className="text-sm text-black/45 transition hover:text-black"
       >
← العودة للسلة </Link>


      <p className="mt-6 text-xs font-medium tracking-[0.25em] text-black/35">
        HAMMAR
      </p>

      <h1 className="mt-2 text-3xl font-black sm:text-4xl">
        إتمام الطلب
      </h1>

      <p className="mt-2 text-sm text-black/45">
        {step === 1
          ? "اختر طريقة الدفع لإكمال الطلب"
          : "أدخل بياناتك لإرسال طلبك"}
      </p>
    </div>

    <div className="mb-6 flex items-center justify-center gap-3">
      <div
        className={`flex items-center gap-2 text-sm font-bold ${
          step === 1 ? "text-black" : "text-black/30"
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            step === 1
              ? "bg-black text-white"
              : "bg-black/10 text-black/40"
          }`}
        >
          1
        </span>
        الدفع
      </div>

      <div className="h-px w-12 bg-black/10" />

      <div
        className={`flex items-center gap-2 text-sm font-bold ${
          step === 2 ? "text-black" : "text-black/30"
        }`}
      >
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            step === 2
              ? "bg-black text-white"
              : "bg-black/10 text-black/40"
          }`}
        >
          2
        </span>
        البيانات
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold">
              طريقة الدفع
            </h2>
            <label className="mt-6 flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-black/20 p-4">
              <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="h-5 w-5 accent-black" />
              هذا الطلب هدية
            </label>
            {isGift && <p className="mt-3 text-sm leading-7 text-black/70">سنتواصل معك عبر واتساب لتأكيد الطلب والتحويل. الإهداء يتطلب الدفع مسبقًا؛ المستلم لن يدفع شيئًا.</p>}

            <p className="mt-1 text-sm text-black/40">
              اختر طريقة الدفع المناسبة لك
            </p>

            <div className="mt-7 rounded-3xl border-2 border-black bg-[#fafafa] p-5">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black">
                  <div className="h-2.5 w-2.5 rounded-full bg-white" />
                </div>

                <div>
                  <p className="font-bold">
                    {paymentLabel}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-black/45">
                    {isGift ? "نرسل بيانات التحويل إلى رقم المرسل فقط، ثم نجهّز الهدية بعد تأكيد وصول المبلغ." : "ادفع قيمة طلبك نقدًا عند استلام العطور."}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={confirmPayment}
              className="mt-7 w-full rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-85"
            >
              تأكيد طريقة الدفع
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-black/35">
              بعد التأكيد ستنتقل إلى إدخال بيانات الطلب
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  بيانات الطلب
                </h2>

                <p className="mt-1 text-sm text-black/40">
                  أدخل بياناتك حتى نتمكن من تجهيز طلبك
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                className="text-xs font-semibold text-black/40 transition hover:text-black"
              >
                تغيير الدفع
              </button>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {isGift ? "اسم المرسل (صاحب الطلب)" : "الاسم الكامل"}
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="مثال  : محمد"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  {isGift ? "واتساب المرسل — لتأكيد الطلب والتحويل" : "رقم الهاتف"}
                </label>

                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="مثال: ********"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div hidden={isGift}>
                <label className="mb-2 block text-sm font-semibold">
                  العنوان
                </label>

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  placeholder="الولاية والمنطقة والشارع"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  ملاحظات إضافية
                  <span className="mr-2 font-normal text-black/35">
                    اختياري
                  </span>
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    updateField("notes", e.target.value)
                  }
                  placeholder="أي ملاحظات تخص الطلب"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div className="mt-7 rounded-2xl bg-[#f7f5f0] p-4">
              {isGift && (
                <fieldset className="mb-6 space-y-4">
                  <legend className="mb-4 font-bold">بيانات مستلم الهدية</legend>
                  {([
                    ["recipientName", "اسم المستلم"],
                    ["recipientPhone", "رقم المستلم — للتوصيل فقط"],
                    ["recipientAddress", "عنوان توصيل الهدية"],
                  ] as const).map(([field, label]) => (
                    <label key={field} className="block text-sm font-semibold">
                      {label}
                      <input required type={field === "recipientPhone" ? "tel" : "text"} value={gift[field]} onChange={(e) => setGift((current) => ({ ...current, [field]: e.target.value }))} className="mt-2 min-h-11 w-full rounded-xl border border-black/20 bg-white px-4 py-3 text-base focus:outline-2 focus:outline-black" />
                    </label>
                  ))}
                  <label className="block text-sm font-semibold">رسالة بطاقة الإهداء (اختياري)
                    <textarea maxLength={500} rows={3} value={gift.message} onChange={(e) => setGift((current) => ({ ...current, message: e.target.value }))} className="mt-2 w-full rounded-xl border border-black/20 bg-white p-3 text-base" />
                  </label>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input type="checkbox" checked={gift.hideSender} onChange={(e) => setGift((current) => ({ ...current, hideSender: e.target.checked }))} className="h-5 w-5 accent-black" />
                    هدية بدون اسم — إخفاء اسم المرسل عن المستلم
                  </label>
                  <p className="text-sm leading-7 text-black/70">راجع رسالة البطاقة ولا تكتب اسمك فيها إذا أردت إخفاءه. فاتورة الأسعار وبيانات التحويل تخص المرسل فقط.</p>
                </fieldset>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-black/45">
                  طريقة الدفع
                </span>

                <span className="text-sm font-bold">
                  {paymentLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting}
              className="mt-5 w-full rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "جاري إرسال الطلب..."
                : "تأكيد الطلب"}
            </button>
          </>
        )}
      </section>

      <aside className="h-fit rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-7 lg:sticky lg:top-6">
        <h2 className="text-xl font-bold">
          ملخص الطلب
        </h2>

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 border-b border-black/5 pb-4"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f4f2ed]">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-black/25">
                    HAMMAR
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {item.name}
                </p>
                {item.preOrder && <p className="mt-2 text-xs font-bold text-amber-800">طلب مسبق — يتوفر قريب، غير جاهز للشحن الآن</p>}

                <p className="mt-1 text-xs text-black/40">
                  الكمية: {item.quantity}
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {(
                    Number(item.price) *
                    Number(item.quantity)
                  ).toFixed(2)}{" "}
                  ر.ع
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-black/45">
              المنتجات
            </span>

            <span className="font-semibold">
              {subtotal.toFixed(2)} ر.ع
            </span>
          </div>

          <div className="border-t border-black/5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold">
                الإجمالي
              </span>

              <span className="text-xl font-black">
                {total.toFixed(2)} ر.ع
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f7f5f0] p-4">
          <p className="text-xs text-black/40">
            طريقة الدفع
          </p>

          <p className="mt-1 text-sm font-bold">
            {paymentLabel}
          </p>
        </div>
      </aside>
    </div>
  </div>
</main>


);
}
