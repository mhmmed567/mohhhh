
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  note: string;
  desc: string;
  stock: string;
  visible: boolean;
  createdAt?: unknown;
};

const emptyProduct = {
  name: "",
  price: "",
  image: "",
  note: "",
  desc: "",
  stock: "متوفر",
  visible: true,
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
    });

    return () => unsubscribe();
  }, [router]);

  async function loadProducts() {
    try {
      setLoading(true);

      const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(productsQuery);

      const data: Product[] = snapshot.docs.map((item) => {
        const product = item.data();

        return {
          id: item.id,
          name: product.name ?? "",
          price: Number(product.price ?? 0),
          image: product.image ?? "",
          note: product.note ?? "",
          desc: product.desc ?? "",
          stock: product.stock ?? "متوفر",
          visible: product.visible !== false,
          createdAt: product.createdAt,
        };
      });

      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyProduct);
    setEditingId(null);
  }

  function handleChange(
    field: keyof typeof emptyProduct,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      price: String(product.price),
      image: product.image,
      note: product.note,
      desc: product.desc,
      stock: product.stock,
      visible: product.visible,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      alert("اكتب اسم العطر");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      alert("اكتب سعر صحيح");
      return;
    }

    if (!form.image.trim()) {
      alert("ضع رابط صورة العطر");
      return;
    }

    if (!form.desc.trim()) {
      alert("اكتب وصف العطر");
      return;
    }

    try {
      setSaving(true);

      const productData = {
        name: form.name.trim(),
        price: Number(form.price),
        image: form.image.trim(),
        note: form.note.trim(),
        desc: form.desc.trim(),
        stock: form.stock,
        // المنتج النافد يبقى ظاهرًا في المتجر مع علامة SOLD OUT.
        visible:
          form.stock === "نفد المخزون"
            ? true
            : form.visible,
      };

      if (editingId) {
        await updateDoc(
          doc(db, "products", editingId),
          productData
        );
      } else {
        const newProductRef = doc(collection(db, "products"));

        await setDoc(newProductRef, {
          ...productData,
          createdAt: serverTimestamp(),
        });
      }

      await loadProducts();
      resetForm();

      alert(
        editingId
          ? "تم تعديل المنتج بنجاح"
          : "تم إضافة المنتج بنجاح"
      );
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ المنتج");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    const confirmed = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذا العطر؟"
    );

    if (!confirmed) return;

    try {
      setDeleting(id);

      await deleteDoc(doc(db, "products", id));

      setProducts((current) =>
        current.filter((product) => product.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حذف المنتج");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleVisibility(product: Product) {
    try {
      const newVisible = !product.visible;

      await updateDoc(doc(db, "products", product.id), {
        visible: newVisible,
      });

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                visible: newVisible,
              }
            : item
        )
      );
    } catch (error) {
      console.error(error);
      alert("تعذر تغيير حالة المنتج");
    }
  }

  async function logout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f5f1] text-[#111]"
    >
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f6f5f1]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <div>
            <p className="text-xs text-gray-500">
              لوحة التحكم
            </p>

            <h1 className="text-xl font-black">
              إدارة المنتجات
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin")}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white"
            >
              الرئيسية
            </button>

            <button
              onClick={() => router.push("/")}
              className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-black hover:text-white sm:block"
            >
              زيارة المتجر
            </button>

            <button
              onClick={logout}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-70"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {/* PAGE TITLE */}
        <div className="mb-8">
          <p className="mb-2 text-sm text-gray-500">
            المنتجات
          </p>

          <h2 className="text-3xl font-black md:text-5xl">
            أضف وأدر عطورك
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
            أضف المنتج من هنا وسيظهر مباشرة في المتجر حسب حالة
            الإظهار والمخزون.
          </p>
        </div>

        {/* FORM */}
        <section className="mb-12 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 px-6 py-5 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">
                  {editingId
                    ? "تعديل المنتج"
                    : "إضافة عطر جديد"}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {editingId
                    ? "عدّل البيانات ثم احفظ التغييرات"
                    : "أدخل بيانات العطر ورابط الصورة"}
                </p>
              </div>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  إلغاء التعديل
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                اسم العطر
              </label>

              <input
                value={form.name}
                onChange={(e) =>
                  handleChange("name", e.target.value)
                }
                placeholder="مثال: عطر همار"
                className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 outline-none transition focus:border-black"
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                السعر
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    handleChange("price", e.target.value)
                  }
                  placeholder="18"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 pl-16 outline-none transition focus:border-black"
                />

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  ر.ع
                </span>
              </div>
            </div>

            {/* IMAGE URL */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                رابط صورة العطر
              </label>

              <input
                type="url"
                value={form.image}
                onChange={(e) =>
                  handleChange("image", e.target.value)
                }
                placeholder="https://example.com/perfume.jpg"
                className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 text-left outline-none transition focus:border-black"
                dir="ltr"
              />

              <p className="mt-2 text-xs text-gray-400">
                ضع رابط مباشر للصورة وينتهي غالبًا بـ .jpg أو
                .png أو .webp
              </p>
            </div>

            {/* IMAGE PREVIEW */}
            {form.image.trim() && (
              <div className="md:col-span-2">
                <div className="overflow-hidden rounded-3xl border border-black/10 bg-[#f7f6f2]">
                  <div className="relative h-64">
                    <img
                      src={form.image}
                      alt="معاينة المنتج"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NOTE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                الملاحظة
              </label>

              <input
                value={form.note}
                onChange={(e) =>
                  handleChange("note", e.target.value)
                }
                placeholder="مثال: شرقي فاخر"
                className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 outline-none transition focus:border-black"
              />
            </div>

            {/* STOCK */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                حالة المخزون
              </label>

              <select
                value={form.stock}
                onChange={(e) =>
                  handleChange("stock", e.target.value)
                }
                className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 outline-none transition focus:border-black"
              >
                <option value="متوفر">متوفر</option>
                <option value="متوفر قريبًا">
                  متوفر قريبًا
                </option>
                <option value="طلب مسبق">طلب مسبق</option>
                <option value="نفد المخزون">
                  نفد المخزون
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                وصف العطر
              </label>

              <textarea
                value={form.desc}
                onChange={(e) =>
                  handleChange("desc", e.target.value)
                }
                placeholder="اكتب وصف العطر..."
                rows={5}
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3.5 leading-7 outline-none transition focus:border-black"
              />
            </div>

            {/* VISIBILITY */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#fafafa] p-4">
                <div>
                  <p className="font-bold">
                    إظهار المنتج في المتجر
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    إذا أوقفته لن يظهر العطر للعملاء
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "visible",
                      !form.visible
                    )
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    form.visible
                      ? "bg-black"
                      : "bg-gray-300"
                  }`}
                  aria-label="إظهار المنتج"
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      form.visible
                        ? "right-1"
                        : "right-6"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SAVE */}
            <div className="md:col-span-2">
              <button
                onClick={saveProduct}
                disabled={saving}
                className="w-full rounded-2xl bg-black px-6 py-4 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "جاري الحفظ..."
                  : editingId
                    ? "حفظ التعديلات"
                    : "إضافة العطر"}
              </button>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-500">
                قائمة المنتجات
              </p>

              <h3 className="text-2xl font-black">
                جميع العطور
              </h3>
            </div>

            <span className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
              {products.length} منتج
            </span>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[500px] animate-pulse rounded-[2rem] bg-white"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[2rem] border border-black/10 bg-white px-6 py-20 text-center">
              <p className="text-lg font-bold">
                لا توجد منتجات
              </p>

              <p className="mt-2 text-sm text-gray-500">
                أضف أول عطر من النموذج بالأعلى
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm"
                >
                  {/* IMAGE */}
                  <div className="relative h-72 bg-[#f7f6f2]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        لا توجد صورة
                      </div>
                    )}

                    {/* VISIBILITY */}
                    <div className="absolute right-4 top-4">
                      <button
                        onClick={() =>
                          toggleVisibility(product)
                        }
                        className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur ${
                          product.visible
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.visible
                          ? "ظاهر في المتجر"
                          : "مخفي"}
                      </button>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-black">
                          {product.name}
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          {product.note}
                        </p>
                      </div>

                      <p className="whitespace-nowrap font-black">
                        {product.price.toFixed(2)} ر.ع
                      </p>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-gray-500">
                      {product.desc}
                    </p>

                    {/* STATUS */}
                    <div className="mt-5 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          product.stock === "نفد المخزون"
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {product.stock}
                      </span>

                      <span
                        className={`text-xs font-semibold ${
                          product.visible
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {product.visible
                          ? "يظهر للعملاء"
                          : "لا يظهر للعملاء"}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          startEdit(product)
                        }
                        className="rounded-xl border border-black/10 px-4 py-3 text-sm font-bold transition hover:bg-black hover:text-white"
                      >
                        تعديل
                      </button>

                      <button
                        onClick={() =>
                          deleteProduct(product.id)
                        }
                        disabled={deleting === product.id}
                        className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        {deleting === product.id
                          ? "جاري الحذف..."
                          : "حذف"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
