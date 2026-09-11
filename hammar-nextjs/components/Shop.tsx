"use client";

import Image from "next/image";
import { useState } from "react";
import { products } from "@/lib/products";

export function Shop({ onAddToCart }: { onAddToCart: () => void }) {
  const [justAdded, setJustAdded] = useState<string | null>(null);

  function addToCart(id: string) {
    onAddToCart();
    setJustAdded(id);

    setTimeout(() => {
      setJustAdded(null);
    }, 1500);
  }

  return (
    <section id="shop" dir="rtl" className="mx-auto max-w-6xl px-7 py-24">
      {/* العنوان */}
      <div className="mb-13 max-w-xl">
        <p className="mb-3 text-sm tracking-[0.2em] text-silver-dark">
          HAMAR COLLECTION
        </p>

        <h2 className="mb-4 font-display text-[32px] font-bold md:text-[42px]">
          عطورنا
        </h2>

        <p className="text-[16px] leading-8 text-silver-dark">
          مجموعة مختارة بعناية من العطور الفاخرة
        </p>
      </div>

      {/* المنتجات */}
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="group overflow-hidden border border-line bg-panel/60 transition-all duration-300 hover:-translate-y-2 hover:border-silver-dark hover:shadow-[0_25px_60px_-30px_rgba(16,16,18,0.4)]"
          >
            {/* الصورة */}
            <div className="relative flex h-[340px] items-center justify-center overflow-hidden bg-[#f4f4f2]">
              <Image
                src={p.image}
                alt={p.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* حالة المنتج */}
              <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs backdrop-blur">
                {p.stock}
              </div>
            </div>

            {/* معلومات المنتج */}
            <div className="p-6">
              <p className="mb-2 text-xs text-silver-dark">
                {p.note}
              </p>

              <h3 className="mb-2 text-xl font-semibold">
                {p.name}
              </h3>

              <p className="mb-5 line-clamp-2 text-sm leading-7 text-silver-dark">
                {p.desc}
              </p>

              <div className="mb-5 flex items-center justify-between">
                <span className="text-xl font-semibold">
                  {p.price} ر.ع
                </span>

                <span className="text-xs text-silver-dark">
                  شامل الضريبة
                </span>
              </div>

              {/* زر السلة */}
              <button
                onClick={() => addToCart(p.id)}
                className={`w-full rounded-sm py-3.5 text-sm font-medium text-paper transition-all duration-300 ${
                  justAdded === p.id
                    ? "bg-silver-dark"
                    : "bg-ink hover:bg-silver-dark"
                }`}
              >
                {justAdded === p.id ? "تمت الإضافة ✓" : "أضف للسلة"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}