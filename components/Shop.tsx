"use client";

import Image from "next/image";
import { ComingSoonStamp } from "@/components/ComingSoonStamp";
import { isProductComingSoon } from "@/lib/products";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  defaultProducts,
  Product,
  getInventoryQuantity,
  getProductPrice,
  isProductOnSale,
  isProductSoldOut,
} from "@/lib/products";

import { addToCart } from "@/lib/cart";

export function Shop({
  onAddToCart,
}: {
  onAddToCart: () => void;
}) {
  const [products, setProducts] = useState<Product[]>(
    Array.isArray(defaultProducts) ? defaultProducts : []
  );

  const [loading, setLoading] = useState(true);

  const [addedProduct, setAddedProduct] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        const productsQuery = query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(productsQuery);

        if (!snapshot.empty) {
          const loadedProducts: Product[] =
            snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() as Omit<Product, "id">),
            }));

          setProducts(loadedProducts);
        } else {
          setProducts(defaultProducts);
        }
      } catch (error) {
        console.error(
          "Error loading products:",
          error
        );

        setProducts(defaultProducts);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const safeProducts: Product[] = Array.isArray(products)
    ? products.filter(
        (product) =>
          product.visible !== false || isProductSoldOut(product)
      )
    : [];

  function handleAddToCart(product: Product) {
    if (isProductSoldOut(product)) return;

    // السعر النهائي
    // إذا عليه عرض يأخذ سعر العرض
    // إذا ما عليه عرض يأخذ السعر الأساسي
    const finalPrice = getProductPrice(product);

    const added = addToCart({
      id: product.id,
      name: product.name,
      description: product.desc,

      // مهم جدًا
      price: finalPrice,

      quantity: 1,
      maxQuantity: getInventoryQuantity(product.quantity),
      preOrder: isProductComingSoon(product),
      image: product.image,
    });

    if (!added) return;

    onAddToCart();

    setAddedProduct(product.id);

    setTimeout(() => {
      setAddedProduct(null);
    }, 1800);
  }

  return (
    <>
      <section
        id="shop"
        dir="rtl"
        className="px-4 py-20 sm:px-6 md:px-10"
      >
        <div className="mx-auto max-w-7xl">

          {/* عنوان القسم */}
          <div className="mb-10 text-center md:text-right">
            <p className="mb-3 text-xs font-medium tracking-[0.25em] text-black/35">
              HAMMAR PERFUMES
            </p>

            <h2 className="text-3xl font-black sm:text-4xl">
              عطور همار
            </h2>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="aspect-[4/5] animate-pulse rounded-2xl bg-black/[0.04]"
                />
              ))}
            </div>
          ) : safeProducts.length === 0 ? (
            <div className="rounded-3xl border border-black/10 bg-white px-6 py-16 text-center">
              <p className="text-sm text-black/40">
                لا توجد منتجات حاليًا
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">

              {safeProducts.map((product) => {
                const comingSoon = isProductComingSoon(product);
                const isAdded =
                  addedProduct === product.id;

                const soldOut =
                  isProductSoldOut(product);

                // هل المنتج عليه عرض؟
                const onSale =
                  isProductOnSale(product);

                // السعر النهائي
                const finalPrice =
                  getProductPrice(product);

                // حساب نسبة الخصم
                const discountPercentage =
                  onSale && Number(product.price) > 0
                    ? Math.round(
                        ((Number(product.price) -
                          finalPrice) /
                          Number(product.price)) *
                          100
                      )
                    : 0;

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl"
                  >
                    {/* صورة المنتج */}
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#f7f6f2]">

                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      {/* علامة العرض */}
                      {comingSoon && <ComingSoonStamp />}
                      {onSale && !soldOut && !comingSoon && (
                        <div className="absolute right-3 top-3 z-10">
                          <div className="rounded-full bg-black px-3 py-1.5 text-[10px] font-black text-white shadow-lg sm:text-xs">
                            خصم {discountPercentage}%
                          </div>
                        </div>
                      )}

                      {/* نفد المخزون */}
                      {soldOut && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/15">
                          <div className="-rotate-12 rounded-lg border-[3px] border-red-600 bg-white/90 px-5 py-2.5 text-center text-red-600 shadow-lg backdrop-blur-sm sm:px-7 sm:py-3">
                            <p className="text-sm font-black tracking-[0.18em] sm:text-lg">
                              SOLD OUT
                            </p>
                            <div className="my-1 h-px bg-red-600/50" />
                            <p className="text-[10px] font-black sm:text-xs">
                              نفد المخزون
                            </p>
                          </div>
                        </div>
                      )}

                      {/* تمت الإضافة */}
                      {isAdded && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                          <div className="animate-[fadeIn_0.25s_ease-out] rounded-full bg-white px-5 py-3 text-sm font-bold shadow-xl">
                            ✓ تمت الإضافة
                          </div>
                        </div>
                      )}
                    </div>

                    {/* معلومات المنتج */}
                    <div className="p-3 sm:p-5">

                      <h3 className="truncate text-sm font-bold sm:text-lg">
                        {product.name}
                      </h3>

                      {product.note && (
                        <p className="mt-1 truncate text-[11px] text-black/40 sm:text-sm">
                          {product.note}
                        </p>
                      )}

                      <div className="mt-3 flex items-end justify-between gap-2">

                        {/* الأسعار */}
                        <div className="flex flex-col">

                          {onSale ? (
                            <>
                              {/* السعر بعد الخصم */}
                              <p className="whitespace-nowrap text-sm font-black sm:text-lg">
                                {finalPrice.toFixed(2)} ر.ع
                              </p>

                              {/* السعر القديم */}
                              <p className="mt-0.5 whitespace-nowrap text-[10px] text-black/35 line-through sm:text-xs">
                                {Number(
                                  product.price
                                ).toFixed(2)}{" "}
                                ر.ع
                              </p>
                            </>
                          ) : (
                            <p className="whitespace-nowrap text-sm font-black sm:text-base">
                              {Number(
                                product.price
                              ).toFixed(2)}{" "}
                              ر.ع
                            </p>
                          )}
                        </div>

                        {/* زر السلة */}
                        <button
                          type="button"
                          onClick={() =>
                            handleAddToCart(product)
                          }
                          disabled={isAdded || soldOut}
                          className={`rounded-full px-3 py-2 text-[10px] font-bold text-white transition-all duration-300 sm:px-4 sm:text-xs ${
                            soldOut
                              ? "cursor-not-allowed bg-black/25"
                              : isAdded
                              ? "scale-95 bg-black/60"
                              : "bg-black hover:-translate-y-0.5 hover:opacity-75"
                          }`}
                        >
                          {soldOut
                            ? "نفد المخزون"
                            : isAdded
                            ? "تمت الإضافة ✓"
                            : comingSoon ? "طلب مسبق" : "أضف"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

            </div>
          )}
        </div>
      </section>

      {/* إشعار الإضافة */}
      {addedProduct && (
        <div
          dir="rtl"
          className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 animate-[slideUp_0.35s_ease-out]"
        >
          <div className="flex items-center gap-3 rounded-full border border-black/10 bg-black px-5 py-3 text-sm font-bold text-white shadow-2xl">

            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
              ✓
            </span>

            <span>
              تمت إضافة المنتج إلى السلة
            </span>

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }

          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
