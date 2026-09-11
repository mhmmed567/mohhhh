"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const items: CartItem[] = [
  {
    id: "1",
    name: "عطر همار",
    price: 18,
    image: "/products/hamar.jpg",
    quantity: 1,
  },
  {
    id: "2",
    name: "عطر المسك",
    price: 15,
    image: "/products/musk.jpg",
    quantity: 1,
  },
];

export default function CheckoutPage() {
  const [payment, setPayment] = useState("cod");

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const shipping = subtotal > 0 ? 2 : 0;
  const total = subtotal + shipping;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-10 md:px-8"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <Image
              src="/logo.jpg"
              alt="همار"
              width={42}
              height={42}
              className="rounded-full"
            />

            <span className="font-display text-xl font-bold">
              همار
            </span>
          </Link>

          <Link
            href="/cart"
            className="text-sm text-silver-dark transition-colors hover:text-ink"
          >
            ← العودة للسلة
          </Link>
        </div>

        {/* Title */}
        <div className="mb-10">
          <p className="mb-3 text-xs tracking-[0.25em] text-silver-dark">
            HAMAR CHECKOUT
          </p>

          <h1 className="font-display text-4xl font-bold md:text-5xl">
            إتمام الطلب
          </h1>

          <p className="mt-3 text-sm text-silver-dark">
            أكمل بياناتك لإتمام طلبك بكل سهولة
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_390px]">

          {/* Form */}
          <section className="border border-line bg-panel p-7 md:p-10">

            <div className="mb-9">
              <h2 className="mb-2 text-xl font-semibold">
                معلومات العميل
              </h2>

              <p className="text-sm text-silver-dark">
                أدخل بيانات التواصل والتوصيل
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Name */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm">
                  الاسم الكامل
                </label>

                <input
                  type="text"
                  placeholder="محمد علي"
                  className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm">
                  رقم الهاتف
                </label>

                <input
                  type="tel"
                  placeholder="9XXXXXXX"
                  className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  placeholder="example@email.com"
                  className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Governorate */}
              <div>
                <label className="mb-2 block text-sm">
                  المحافظة
                </label>

                <select className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none focus:border-ink">
                  <option>مسقط</option>
                  <option>ظفار</option>
                  <option>شمال الباطنة</option>
                  <option>جنوب الباطنة</option>
                  <option>الداخلية</option>
                  <option>شمال الشرقية</option>
                  <option>جنوب الشرقية</option>
                  <option>الوسطى</option>
                  <option>البريمي</option>
                  <option>مسندم</option>
                  <option>الظاهرة</option>
                  <option>الوسطى</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="mb-2 block text-sm">
                  الولاية
                </label>

                <input
                  type="text"
                  placeholder="مثال: السيب"
                  className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none focus:border-ink"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm">
                  العنوان بالتفصيل
                </label>

                <textarea
                  rows={4}
                  placeholder="اسم المنطقة، الشارع، رقم المنزل..."
                  className="w-full resize-none border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none focus:border-ink"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm">
                  ملاحظات الطلب
                  <span className="mr-2 text-xs text-silver-dark">
                    اختياري
                  </span>
                </label>

                <textarea
                  rows={3}
                  placeholder="أي ملاحظات خاصة بالتوصيل..."
                  className="w-full resize-none border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none focus:border-ink"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="mt-12 border-t border-line pt-9">

              <h2 className="mb-2 text-xl font-semibold">
                طريقة الدفع
              </h2>

              <p className="mb-6 text-sm text-silver-dark">
                اختر الطريقة المناسبة لك
              </p>

              <div className="space-y-3">

                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPayment("cod")}
                  className={`flex w-full items-center justify-between border p-5 text-right transition-all ${
                    payment === "cod"
                      ? "border-ink bg-paper"
                      : "border-line bg-panel hover:border-silver-dark"
                  }`}
                >
                  <div>
                    <p className="font-medium">
                      الدفع عند الاستلام
                    </p>

                    <p className="mt-1 text-xs text-silver-dark">
                      ادفع عند وصول طلبك
                    </p>
                  </div>

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      payment === "cod"
                        ? "border-ink"
                        : "border-silver-dark"
                    }`}
                  >
                    {payment === "cod" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                    )}
                  </span>
                </button>

                {/* Online */}
                <button
                  type="button"
                  onClick={() => setPayment("online")}
                  className={`flex w-full items-center justify-between border p-5 text-right transition-all ${
                    payment === "online"
                      ? "border-ink bg-paper"
                      : "border-line bg-panel hover:border-silver-dark"
                  }`}
                >
                  <div>
                    <p className="font-medium">
                      الدفع الإلكتروني
                    </p>

                    <p className="mt-1 text-xs text-silver-dark">
                      بطاقة بنكية أو بوابة الدفع
                    </p>
                  </div>

                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      payment === "online"
                        ? "border-ink"
                        : "border-silver-dark"
                    }`}
                  >
                    {payment === "online" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-ink" />
                    )}
                  </span>
                </button>

              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              className="mt-9 w-full bg-ink py-4 text-sm font-medium text-paper transition-all hover:bg-silver-dark"
            >
              تأكيد الطلب — {total.toFixed(2)} ر.ع
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-silver-dark">
              بالضغط على تأكيد الطلب أنت توافق على إتمام عملية الشراء
            </p>
          </section>

          {/* Order Summary */}
          <aside className="h-fit border border-lineStrong bg-panel p-7 lg:sticky lg:top-24">

            <div className="mb-7 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                ملخص الطلب
              </h2>

              <span className="text-xs text-silver-dark">
                {items.length} منتجات
              </span>
            </div>

            <div className="space-y-5">

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-paper">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-medium">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-xs text-silver-dark">
                        الكمية: {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-medium">
                      {(item.price * item.quantity).toFixed(2)} ر.ع
                    </p>
                  </div>
                </div>
              ))}

            </div>

            <div className="my-7 border-t border-line" />

            <div className="space-y-4 text-sm">

              <div className="flex justify-between">
                <span className="text-silver-dark">
                  المجموع الفرعي
                </span>

                <span>
                  {subtotal.toFixed(2)} ر.ع
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-silver-dark">
                  التوصيل
                </span>

                <span>
                  {shipping.toFixed(2)} ر.ع
                </span>
              </div>

            </div>

            <div className="my-7 border-t border-line" />

            <div className="flex items-end justify-between">
              <span className="text-sm text-silver-dark">
                الإجمالي
              </span>

              <div className="text-left">
                <span className="text-2xl font-bold">
                  {total.toFixed(2)}
                </span>

                <span className="mr-1 text-sm">
                  ر.ع
                </span>
              </div>
            </div>

            {/* Secure */}
            <div className="mt-7 border border-line bg-paper p-4">
              <p className="text-xs font-medium">
                🔒 طلبك بأمان
              </p>

              <p className="mt-1 text-[11px] leading-5 text-silver-dark">
                نحافظ على خصوصية بياناتك ونستخدمها فقط لمعالجة طلبك
                وتوصيله.
              </p>
            </div>

          </aside>
        </div>
      </div>
    </main>
  );
}