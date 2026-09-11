"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Nav } from "@/components/Nav";

type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
};

const initialItems: CartItem[] = [
  {
    id: 1,
    name: "عطر همار",
    description: "عطر فاخر بلمسة شرقية",
    price: 18,
    quantity: 1,
    image: "/product-1.jpg",
  },
  {
    id: 2,
    name: "عطر المسك",
    description: "رائحة هادئة وفاخرة",
    price: 15,
    quantity: 1,
    image: "/product-2.jpg",
  },
];

export default function CartPage() {
  const [items, setItems] = useState(initialItems);

  const increase = (id: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrease = (id: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const shipping = subtotal > 0 ? 2 : 0;
  const total = subtotal + shipping;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-10 sm:px-8"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-2 text-sm text-silver-dark">
              HEMAR STORE
            </p>

            <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              سلة التسوق
            </h1>

            <p className="mt-3 text-sm text-silver-dark">
              راجع منتجاتك قبل إتمام الطلب
            </p>
          </div>

          <Link
            href="/"
            className="hidden rounded-full border border-lineStrong px-5 py-2.5 text-sm transition-all hover:border-ink hover:bg-panel sm:block"
          >
            العودة للمتجر
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty Cart */
          <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[32px] border border-line bg-panel px-6 text-center">

            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ink text-paper">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 8h12l1 12H5L6 8Z" />
                <path d="M9 8a3 3 0 0 1 6 0" />
              </svg>
            </div>

            <h2 className="font-display text-2xl font-bold">
              السلة فارغة
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-7 text-silver-dark">
              ما عندك أي منتجات في السلة حالياً
              اكتشف مجموعتنا وأضف عطرك المفضل
            </p>

            <Link
              href="/#shop"
              className="mt-7 rounded-full bg-ink px-7 py-3 text-sm font-semibold text-paper transition-all hover:-translate-y-0.5 hover:opacity-90"
            >
              اكتشف العطور
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            {/* Products */}
            <section className="rounded-[32px] border border-line bg-panel p-5 sm:p-7">

              <div className="mb-6 flex items-center justify-between border-b border-line pb-5">
                <h2 className="font-display text-xl font-bold">
                  منتجاتك
                </h2>

                <span className="text-sm text-silver-dark">
                  {items.length} منتجات
                </span>
              </div>

              <div className="space-y-5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-2xl border border-line bg-paper p-4"
                  >
                    {/* Image */}
                    <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-panel">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">

                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-xs text-silver-dark">
                            {item.description}
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-silver-dark transition-colors hover:text-red-600"
                        >
                          حذف
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">

                        {/* Quantity */}
                        <div className="flex items-center overflow-hidden rounded-full border border-lineStrong">
                          <button
                            onClick={() => decrease(item.id)}
                            className="flex h-8 w-8 items-center justify-center text-lg transition-colors hover:bg-panel"
                          >
                            −
                          </button>

                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => increase(item.id)}
                            className="flex h-8 w-8 items-center justify-center text-lg transition-colors hover:bg-panel"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-left">
                          <span className="font-semibold">
                            {item.price * item.quantity}
                          </span>

                          <span className="mr-1 text-xs text-silver-dark">
                            ر.ع
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Summary */}
            <aside className="h-fit rounded-[32px] border border-line bg-panel p-6 sm:p-7">

              <h2 className="font-display text-xl font-bold">
                ملخص الطلب
              </h2>

              <div className="mt-7 space-y-5 text-sm">

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

                <div className="border-t border-line pt-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      الإجمالي
                    </span>

                    <span className="font-display text-2xl font-bold">
                      {total.toFixed(2)}
                      <span className="mr-1 text-sm font-normal">
                        ر.ع
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-7 flex h-14 w-full items-center justify-center rounded-2xl bg-ink text-sm font-semibold text-paper transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                إتمام الطلب
              </Link>

              <Link
                href="/#shop"
                className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-lineStrong text-sm transition-colors hover:bg-paper"
              >
                متابعة التسوق
              </Link>

              <div className="mt-6 rounded-2xl bg-paper p-4 text-center text-xs leading-6 text-silver-dark">
                الدفع آمن ويتم تأكيد طلبك بعد إتمام عملية الشراء
              </div>
            </aside>
          </div>
        )}

        {/* Mobile back */}
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-silver-dark sm:hidden"
        >
          ← العودة للمتجر
        </Link>
      </div>
    </main>
  );
}