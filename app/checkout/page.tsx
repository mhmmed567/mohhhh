"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const cartItems = getCart();
        setItems(cartItems);

        if (cartItems.length === 0) {
          router.replace("/cart");
          return;
        }

        const storeSnap = await getDoc(
          doc(db, "settings", "store")
        );

        if (storeSnap.exists()) {
          const data = storeSnap.data();
          const price = Number(data.shippingPrice);

          setShippingPrice(
            !Number.isNaN(price) && price >= 0 ? price : 0
          );
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء تحميل بيانات الطلب");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.price) * item.quantity,
      0
    );
  }, [items]);

  const shipping = items.length > 0 ? shippingPrice : 0;
  const total = subtotal + shipping;

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitOrder = async () => {
    setError("");

    if (!form.name.trim()) {
      setError("اكتب اسمك");
      return;
    }

    if (!form.phone.trim()) {
      setError("اكتب رقم الهاتف");
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

    const user = auth.currentUser;

    if (!user) {
      router.replace("/login");
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        userId: user.uid,

        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
        },

        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          description: item.description,
          price: Number(item.price),
          quantity: item.quantity,
          image: item.image,
        })),

        subtotal,
        shippingPrice: shipping,
        total,

        status: "جديد",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const orderRef = await addDoc(
        collection(db, "orders"),
        orderData
      );

      clearCart();

      router.replace(
        `/checkout/success?orderId=${orderRef.id}`
      );
    } catch (err) {
      console.error(err);
      setError(
        "تعذر إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة ثانية."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f7f5f0]"
      >
        <p className="text-sm text-black/50">
          جاري تجهيز الطلب...
        </p>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f5f0] px-5 py-8 sm:px-8 sm:py-10"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/cart"
            className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
          >
            ← العودة للسلة
          </Link>

          <p className="mb-2 text-xs font-medium tracking-[0.25em] text-black/35">
            HAMMAR
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            إتمام الطلب
          </h1>

          <p className="mt-2 text-sm text-black/45">
            أدخل بيانات التوصيل لإرسال طلبك
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-[30px] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-black">
              بيانات التوصيل
            </h2>

            <div className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  الاسم
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  placeholder="اكتب اسمك"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="9xxxxxxx"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 outline-none transition focus:border-black"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  عنوان التوصيل
                </label>

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    updateField("address", e.target.value)
                  }
                  placeholder="الولاية - المنطقة - الشارع - تفاصيل العنوان"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  ملاحظات إضافية
                  <span className="mr-2 text-xs font-normal text-black/35">
                    اختياري
                  </span>
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    updateField("notes", e.target.value)
                  }
                  placeholder="أي ملاحظة تخص الطلب..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-4 outline-none transition focus:border-black"
                />
              </div>

              {error && (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting}
                className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "جاري إرسال الطلب..."
                  : "تأكيد وإرسال الطلب"}
              </button>
            </div>
          </section>

          <aside className="h-fit rounded-[30px] border border-black/5 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-black">
              ملخص الطلب
            </h2>

            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#f5f3ee]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-black/30">
                        صورة
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-black/40">
                      الكمية: {item.quantity}
                    </p>
                  </div>

                  <div className="text-sm font-bold">
                    {(
                      Number(item.price) *
                      item.quantity
                    ).toFixed(3)}{" "}
                    ر.ع
                  </div>
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-black/10" />

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-black/50">
                  المنتجات
                </span>

                <span className="font-bold">
                  {subtotal.toFixed(3)} ر.ع
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-black/50">
                  التوصيل
                </span>

                <span className="font-bold">
                  {shipping.toFixed(3)} ر.ع
                </span>
              </div>

              <div className="h-px bg-black/10" />

              <div className="flex items-end justify-between">
                <span className="text-black/50">
                  الإجمالي
                </span>

                <span className="text-2xl font-black">
                  {total.toFixed(3)} ر.ع
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#f7f5f0] p-4">
              <p className="text-sm font-bold">
                🚚 التوصيل
              </p>

              <p className="mt-1 text-xs leading-5 text-black/45">
                سيتم التواصل معك لتأكيد الطلب والتوصيل.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}