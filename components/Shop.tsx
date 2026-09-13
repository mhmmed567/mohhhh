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
const [addedProduct, setAddedProduct] = useState<string | null>(null);

useEffect(() => {
async function loadProducts() {
try {
const productsQuery = query(
collection(db, "products"),
orderBy("createdAt", "desc")
);


    const snapshot = await getDocs(productsQuery);

    if (!snapshot.empty) {
      const loadedProducts: Product[] = snapshot.docs.map((item) => ({
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

setAddedProduct(product.id);

setTimeout(() => {
  setAddedProduct(null);
}, 1800);


}

return (
<> <section
     id="shop"
     dir="rtl"
     className="px-4 py-20 sm:px-6 md:px-10"
   > <div className="mx-auto max-w-7xl"> <div className="mb-10 text-center md:text-right"> <p className="mb-3 text-xs font-medium tracking-[0.25em] text-black/35">
HAMMAR PERFUMES </p>
        <h2 className="text-3xl font-black sm:text-4xl">
          عطور همار
        </h2>
      </div>

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
            const isAdded = addedProduct === product.id;

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:rounded-3xl"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f7f6f2]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  {isAdded && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
                      <div className="animate-[fadeIn_0.25s_ease-out] rounded-full bg-white px-5 py-3 text-sm font-bold shadow-xl">
                        ✓ تمت الإضافة
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-5">
                  <h3 className="truncate text-sm font-bold sm:text-lg">
                    {product.name}
                  </h3>

                  {product.note && (
                    <p className="mt-1 truncate text-[11px] text-black/40 sm:text-sm">
                      {product.note}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="whitespace-nowrap text-sm font-black sm:text-base">
                      {Number(product.price).toFixed(2)} ر.ع
                    </p>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdded}
                      className={`rounded-full px-3 py-2 text-[10px] font-bold text-white transition-all duration-300 sm:px-4 sm:text-xs ${
                        isAdded
                          ? "scale-95 bg-black/60"
                          : "bg-black hover:-translate-y-0.5 hover:opacity-75"
                      }`}
                    >
                      {isAdded ? "تمت الإضافة ✓" : "أضف"}
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

  {addedProduct && (
    <div
      dir="rtl"
      className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 animate-[slideUp_0.35s_ease-out]"
    >
      <div className="flex items-center gap-3 rounded-full border border-black/10 bg-black px-5 py-3 text-sm font-bold text-white shadow-2xl">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
          ✓
        </span>

        <span>تمت إضافة المنتج إلى السلة</span>
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
