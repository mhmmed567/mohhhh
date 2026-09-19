"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { addToCart } from "@/lib/cart";
import { db } from "@/lib/firebase";
import {
  getProductPrice,
  isProductOnSale,
  isProductSoldOut,
  Product,
} from "@/lib/products";

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function loadOffers() {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, "products"),
            orderBy("createdAt", "desc")
          )
        );

        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Product, "id">),
        }));

        setProducts(
          data.filter(
            (product) =>
              (product.visible !== false ||
                isProductSoldOut(product)) &&
              isProductOnSale(product)
          )
        );
      } catch (error) {
        console.error("Error loading offers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, []);

  function handleAdd(product: Product) {
    if (isProductSoldOut(product)) return;

    addToCart({
      id: product.id,
      name: product.name,
      description: product.desc,

      // مهم: يدخل سعر العرض للسلة
      price: getProductPrice(product),

      quantity: 1,
      image: product.image,
    });

    setCartCount((count) => count + 1);

    setAddedProduct(product.id);

    setTimeout(() => {
      setAddedProduct(null);
    }, 1600);
  }

  return (
    <main
      className="min-h-screen bg-[#f7f5f0] text-black"
      dir="rtl"
    >
      <Nav cartCount={cartCount} />

      <section className="px-4 py-16 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl">

          {/* العنوان */}
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-medium tracking-[0.25em] text-black/35">
              HAMMAR OFFERS
            </p>

            <h1 className="text-4xl font-black sm:text-5xl">
              العروض
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-black/45">
              اكتشف العطور المتوفرة حاليًا بأسعار خاصة من همار.
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="aspect-[4/5] animate-pulse rounded-3xl bg-black/[0.04]"
                />
              ))}
            </div>
          ) : products.length === 0 ? (

            /* لا توجد عروض */
            <div className="rounded-[2rem] border border-black/10 bg-white px-6 py-20 text-center">
              <p className="text-xl font-black">
                لا توجد عروض حاليًا
              </p>

              <p className="mt-2 text-sm text-black/40">
                ترقب عروض همار القادمة.
              </p>
            </div>

          ) : (

            /* المنتجات */
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {products.map((product) => {
                const finalPrice = getProductPrice(product);
                const soldOut = isProductSoldOut(product);

                const discount = Math.round(
                  ((Number(product.price) - finalPrice) /
                    Number(product.price)) *
                    100
                );

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white sm:rounded-3xl"
                  >
                    {/* الصورة */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#f7f6f2]">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      {/* نسبة الخصم */}
                      {!soldOut && (
                        <span className="absolute right-3 top-3 rounded-full bg-black px-3 py-1.5 text-[10px] font-black text-white sm:text-xs">
                          خصم {discount}%
                        </span>
                      )}

                      {soldOut && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
                          <div className="rounded-full border border-white/40 bg-black/85 px-5 py-3 text-center text-white shadow-xl">
                            <p className="text-sm font-black tracking-[0.16em] sm:text-base">
                              SOLD OUT
                            </p>
                            <p className="mt-0.5 text-[10px] font-bold text-white/75 sm:text-xs">
                              نفد المخزون
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-5">
                      <h2 className="truncate text-sm font-bold sm:text-lg">
                        {product.name}
                      </h2>

                      {product.note && (
                        <p className="mt-1 truncate text-[11px] text-black/40 sm:text-sm">
                          {product.note}
                        </p>
                      )}

                      {/* الأسعار */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black sm:text-lg">
                          {finalPrice.toFixed(2)} ر.ع
                        </span>

                        <span className="text-xs text-black/35 line-through sm:text-sm">
                          {Number(product.price).toFixed(2)} ر.ع
                        </span>
                      </div>

                      {/* إضافة للسلة */}
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        disabled={soldOut || addedProduct === product.id}
                        className="mt-4 w-full rounded-full bg-black px-4 py-3 text-xs font-bold text-white transition hover:opacity-75 disabled:cursor-not-allowed disabled:bg-black/25"
                      >
                        {soldOut
                          ? "نفد المخزون"
                          : addedProduct === product.id
                          ? "تمت الإضافة ✓"
                          : "أضف للسلة"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
