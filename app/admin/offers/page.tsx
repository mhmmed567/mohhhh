"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";
import {
  Product,
  isProductOnSale,
} from "@/lib/products";

export default function AdminOffersPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [salePrices, setSalePrices] =
    useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        try {
          const token = await user.getIdTokenResult();

          if (token.claims.role !== "admin") {
            router.replace("/");
            return;
          }

          await loadProducts();
        } catch (error) {
          console.error(error);
          router.replace("/");
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  async function loadProducts() {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        query(
          collection(db, "products"),
          orderBy("createdAt", "desc")
        )
      );

      const data: Product[] = snapshot.docs.map(
        (item) => ({
          id: item.id,
          ...(item.data() as Omit<Product, "id">),
        })
      );

      setProducts(data);

      setSalePrices(
        Object.fromEntries(
          data.map((product) => [
            product.id,
            product.salePrice
              ? String(product.salePrice)
              : "",
          ])
        )
      );
    } finally {
      setLoading(false);
    }
  }

  // تشغيل أو تحديث العرض
  async function saveDiscount(product: Product) {
    const salePrice = Number(
      salePrices[product.id]
    );

    const regularPrice = Number(product.price);

    if (!salePrice || salePrice <= 0) {
      alert("اكتب سعر العرض");
      return;
    }

    if (salePrice >= regularPrice) {
      alert(
        "سعر العرض لازم يكون أقل من السعر الأساسي"
      );
      return;
    }

    try {
      setSavingId(product.id);

      await updateDoc(
        doc(db, "products", product.id),
        {
          salePrice,
          onSale: true,
        }
      );

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                salePrice,
                onSale: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("تعذر حفظ العرض");
    } finally {
      setSavingId(null);
    }
  }

  // إلغاء العرض
  async function removeDiscount(product: Product) {
    try {
      setSavingId(product.id);

      await updateDoc(
        doc(db, "products", product.id),
        {
          salePrice: null,
          onSale: false,
        }
      );

      setSalePrices((current) => ({
        ...current,
        [product.id]: "",
      }));

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                salePrice: null,
                onSale: false,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("تعذر إلغاء العرض");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f5f1] text-[#111]"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f5f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">

          <div>
            <p className="text-xs text-black/40">
              لوحة التحكم
            </p>

            <h1 className="text-xl font-black">
              إدارة العروض
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                router.push("/admin/products")
              }
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold"
            >
              المنتجات
            </button>

            <button
              onClick={() =>
                router.push("/offers")
              }
              className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white"
            >
              عرض الصفحة
            </button>
          </div>

        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">

        <div className="mb-8">
          <p className="text-sm text-black/40">
            HAMMAR OFFERS
          </p>

          <h2 className="mt-2 text-3xl font-black md:text-5xl">
            حدد سعر العرض
          </h2>

          <p className="mt-3 text-sm leading-7 text-black/45">
            مثال: إذا السعر الأساسي 15 ر.ع،
            اكتب 10 ر.ع كسعر العرض ثم اضغط
            تفعيل العرض.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-black/40">
            جاري تحميل المنتجات...
          </p>
        ) : (
          <div className="grid gap-4">

            {products.map((product) => {
              const active =
                isProductOnSale(product);

              return (
                <div
                  key={product.id}
                  className="grid gap-4 rounded-3xl border border-black/10 bg-white p-5 md:grid-cols-[1fr_auto] md:items-center"
                >

                  {/* المنتج */}
                  <div className="flex items-center gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />

                    <div>
                      <h3 className="font-black">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-sm text-black/45">
                        السعر الأساسي:{" "}
                        {Number(
                          product.price
                        ).toFixed(2)}{" "}
                        ر.ع
                      </p>

                      {active && (
                        <p className="mt-1 text-sm font-bold">
                          العرض الحالي:{" "}
                          {Number(
                            product.salePrice
                          ).toFixed(2)}{" "}
                          ر.ع
                        </p>
                      )}
                    </div>
                  </div>

                  {/* التحكم */}
                  <div className="flex flex-wrap items-center gap-2">

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          salePrices[
                            product.id
                          ] ?? ""
                        }
                        onChange={(e) =>
                          setSalePrices(
                            (current) => ({
                              ...current,
                              [product.id]:
                                e.target
                                  .value,
                            })
                          )
                        }
                        placeholder="10"
                        className="w-36 rounded-full border border-black/10 bg-[#fafafa] px-4 py-2.5 pl-12 outline-none focus:border-black"
                      />

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-black/40">
                        ر.ع
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        saveDiscount(product)
                      }
                      disabled={
                        savingId === product.id
                      }
                      className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {savingId === product.id
                        ? "جاري..."
                        : active
                        ? "تحديث العرض"
                        : "تفعيل العرض"}
                    </button>

                    {active && (
                      <button
                        onClick={() =>
                          removeDiscount(
                            product
                          )
                        }
                        disabled={
                          savingId ===
                          product.id
                        }
                        className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-bold"
                      >
                        إلغاء العرض
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </section>
    </main>
  );
}