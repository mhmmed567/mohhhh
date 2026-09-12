
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { defaultProducts, Product } from "@/lib/products";
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
        console.error("Error loading products:", error);
        setProducts(defaultProducts);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  /*
   * نخفي المنتجات التي:
   * - تم إخفاؤها من لوحة التحكم
   * - نفد مخزونها
   */
  const safeProducts: Product[] = Array.isArray(products)
    ? products.filter(
        (product) =>
          product.visible !== false &&
          product.stock !== "نفد المخزون"
      )
    : [];

  function handleAddToCart(product: Product) {
    addToCart({
      id: product.id,
      name: product.name,
      description: product.desc,
      price: Number(product.price),
      quantity: 1,
      image: product.image,
    });

    onAddToCart();
  }

  return (
    <section
      id="shop"
      dir="rtl"
      className="px-6 py-24 md:px-10"
    >
      <div className="mx-auto max-w-7xl">

        {/* العنوان */}
        <div className="mb-12">
          <p className="mb-3 text-sm text-gray-500">
            مجموعتنا
          </p>

          <h2 className="text-4xl font-bold md:text-5xl">
            عطور همار
          </h2>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[500px] animate-pulse rounded-3xl bg-gray-100"
              />
            ))}
          </div>
        ) : safeProducts.length === 0 ? (
          /* لا توجد منتجات */
          <div className="rounded-3xl border border-black/10 bg-white px-6 py-20 text-center">
            <p className="text-gray-500">
              لا توجد منتجات حاليًا
            </p>
          </div>
        ) : (
          /* المنتجات */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safeProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-3xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >

                {/* الصورة */}
                <div className="relative aspect-square overflow-hidden bg-[#f7f6f2]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                {/* معلومات المنتج */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h3 className="text-xl font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {product.note}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-lg font-bold">
                      {Number(product.price).toFixed(2)} ر.ع
                    </p>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-500">
                    {product.desc}
                  </p>

                  {/* السعر والمخزون والزر */}
                  <div className="mt-5 flex items-center justify-between gap-3">

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {product.stock}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-80"
                    >
                      أضف للسلة
                    </button>

                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

