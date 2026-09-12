
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  CartItem,
  clearCart,
  getCart,
} from "@/lib/cart";

type FormData = {
  name: string;
  phone: string;
  address: string;
  notes: string;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingPrice, setShippingPrice] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

        // جلب سعر التوصيل من إعدادات المتجر
        const storeSnap = await getDoc(
          doc(db, "settings", "store")
        );

        if (storeSnap.exists()) {
          const data = storeSnap.data();

          const price = Number(data.shippingPrice);

          if (!Number.isNaN(price) && price >= 0) {
            setShippingPrice(price);
          }
        }
      } catch (err) {
        console.error("Checkout loading error:", err);
        setError("حدث خطأ أثناء تحميل بيانات الطلب");
      } finally {
        setLoading(false);
      }
    }

    loadCheckout();
  }, [router]);

  // مجموع المنتجات
  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return (
        total +
        Number(item.price) * Number(item.quantity)
      );
    }, 0);
  }, [items]);

  // التوصيل
  const shipping = items.length > 0 ? shippingPrice : 0;

  // الإجمالي النهائي
  const total = subtotal + shipping;

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submitOrder() {
    setError("");

    // التحقق من البيانات
    if (!form.name.trim()) {
      setError("اكتب اسمك");
      return;
    }

    if (!form.phone.trim()) {
      setError("اكتب رقم الهاتف");
      return;
    }

    if (!/^[0-9+\s-]{8,15}$/.test(form.phone.trim())) {
      setError("اكتب رقم هاتف صحيح");
      return;
    }

    if (!form.address.trim()) {
      setError("اكتب عنوان التوصيل");
      return;
    }

    if (items.length === 0) {
      setError("السلة فارغة");
      return;
    }

    setSubmitting(true);

    try {
      /*
       * إنشاء الطلب في Firestore
       *
       * لا يحتاج العميل إلى تسجيل دخول
       * userId = null لأن الطلب Guest
       */

      const orderData = {
        userId: null,

        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
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
        shippingPrice: Number(shipping),
        total: Number(total),

        // الدفع عند الاستلام
        paymentMethod: "الدفع عند الاستلام",
        paymentStatus: "غير مدفوع",

        // حالة الطلب
        status: "جديد",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // حفظ الطلب
      const orderRef = await addDoc(
        collection(db, "orders"),
        orderData
      );

      console.log("تم إنشاء الطلب:", orderRef.id);

      // تفريغ السلة
      clearCart();

      // الانتقال لصفحة نجاح الطلب
      router.replace(
        `/checkout/success?orderId=${orderRef.id}`
      );
    } catch (err) {
      console.error("Order creation error:", err);

      setError(
        "تعذر إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة ثانية."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f7f5f0]"
      >
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black" />

          <p className="mt-4 text-sm text-black/50">
            جاري تجهيز الطلب...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f5f0] px-4 py-8 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-6xl">
        {/* العنوان */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="text-sm text-black/45 transition hover:text-black"
          >
            ← العودة للسلة
          </Link>

          <p className="mt-6 text-xs font-medium tracking-[0.25em] text-black/35">
            HAMMAR
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            إتمام الطلب
          </h1>

          <p className="mt-2 text-sm text-black/45">
            أدخل بيانات التوصيل واختر طريقة الدفع
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* بيانات العميل */}
          <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">
              بيانات التوصيل
            </h2>

            <p className="mt-1 text-sm text-black/40">
              لا تحتاج إلى تسجيل دخول لإتمام الطلب
            </p>

            <div className="mt-7 space-y-5">
              {/* الاسم */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  الاسم الكامل
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="مثال: محمد بن علي البلوشي"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>

              {/* الهاتف */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="مثال: 99660453"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>

              {/* العنوان */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  عنوان التوصيل
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

              {/* الملاحظات */}
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
                  placeholder="أي ملاحظات تخص التوصيل"
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-sm outline-none transition focus:border-black"
                />
              </div>
            </div>

            {/* طريقة الدفع */}
            <div className="mt-8 border-t border-black/5 pt-7">
              <h2 className="text-xl font-bold">
                طريقة الدفع
              </h2>

              <div className="mt-4 rounded-2xl border-2 border-black bg-[#fafafa] p-5">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>

                  <div>
                    <p className="font-bold">
                      الدفع عند الاستلام
                    </p>

                    <p className="mt-1 text-sm leading-6 text-black/45">
                      ادفع قيمة طلبك عند استلام العطور
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* الخطأ */}
            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* زر الطلب */}
            <button
              type="button"
              onClick={submitOrder}
              disabled={submitting}
              className="mt-7 w-full rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "جاري إرسال الطلب..."
                : "تأكيد الطلب — الدفع عند الاستلام"}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-black/35">
              بالضغط على تأكيد الطلب سيتم إرسال طلبك إلى المتجر
            </p>
          </section>

          {/* ملخص الطلب */}
          <aside className="h-fit rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-7 lg:sticky lg:top-6">
            <h2 className="text-xl font-bold">
              ملخص الطلب
            </h2>

            {/* المنتجات */}
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border-b border-black/5 pb-4"
                >
                  {/* الصورة */}
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

                  {/* معلومات المنتج */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {item.name}
                    </p>

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

            {/* الأسعار */}
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-black/45">
                  المنتجات
                </span>

                <span className="font-semibold">
                  {subtotal.toFixed(2)} ر.ع
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-black/45">
                  التوصيل
                </span>

                <span className="font-semibold">
                  {shipping.toFixed(2)} ر.ع
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

            {/* الدفع */}
            <div className="mt-6 rounded-2xl bg-[#f7f5f0] p-4">
              <p className="text-xs text-black/40">
                طريقة الدفع
              </p>

              <p className="mt-1 text-sm font-bold">
                الدفع عند الاستلام
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

