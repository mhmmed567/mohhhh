"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db } from "@/lib/firebase";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "همار",
    description: "",
    logo: "",
    shippingPrice: "2",
  });

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

        const storeSnap = await getDoc(doc(db, "settings", "store"));

        if (storeSnap.exists()) {
          const data = storeSnap.data();

          setForm({
            name: data.name ?? "همار",
            description: data.description ?? "",
            logo: data.logo ?? "",
            shippingPrice:
              data.shippingPrice !== undefined
                ? String(data.shippingPrice)
                : "2",
          });
        }
      } catch (error) {
        console.error(error);
        setMessage("حدث خطأ أثناء تحميل الإعدادات");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    setMessage("");

    const shippingPrice = Number(form.shippingPrice);

    if (Number.isNaN(shippingPrice) || shippingPrice < 0) {
      setMessage("اكتب سعر توصيل صحيح");
      return;
    }

    setSaving(true);

    try {
      await setDoc(
        doc(db, "settings", "store"),
        {
          name: form.name.trim(),
          description: form.description.trim(),
          logo: form.logo.trim(),
          shippingPrice,
        },
        { merge: true }
      );

      setMessage("تم حفظ الإعدادات بنجاح ✅");
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f7f5f0]"
      >
        <div className="text-sm text-black/60">
          جاري تحميل الإعدادات...
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f5f0] px-5 py-8 sm:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium tracking-[0.25em] text-black/40">
              HAMMAR OS
            </p>

            <h1 className="text-3xl font-black">
              إعدادات المتجر
            </h1>

            <p className="mt-2 text-sm text-black/50">
              تحكم في معلومات المتجر وسعر التوصيل
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:bg-black hover:text-white"
          >
            العودة للوحة التحكم
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold">
                معلومات المتجر
              </h2>

              <p className="mt-1 text-sm text-black/45">
                عدّل المعلومات التي تريد ظهورها في المتجر
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  اسم المتجر
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="همار"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  وصف المتجر
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="اكتب وصف المتجر..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 outline-none transition focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  رابط الشعار
                </label>

                <input
                  type="url"
                  value={form.logo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      logo: e.target.value,
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-2xl border border-black/10 bg-[#fafafa] px-4 py-3 text-left outline-none transition focus:border-black"
                  dir="ltr"
                />

                <p className="mt-2 text-xs text-black/40">
                  استخدم رابط مباشر للصورة بدل رفع ملف
                </p>
              </div>

              <div className="rounded-3xl border border-black/10 bg-[#fafafa] p-5">
                <div className="mb-4">
                  <h3 className="text-base font-bold">
                    🚚 سعر التوصيل
                  </h3>

                  <p className="mt-1 text-xs text-black/45">
                    السعر الذي سيتم استخدامه في الطلبات
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={form.shippingPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        shippingPrice: e.target.value,
                      })
                    }
                    placeholder="2"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-4 pl-16 text-lg font-bold outline-none transition focus:border-black"
                    dir="ltr"
                  />

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-black/40">
                    ر.ع
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </button>

              {message && (
                <div className="rounded-2xl bg-black/[0.04] px-4 py-3 text-center text-sm">
                  {message}
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold">
              معاينة
            </h2>

            <div className="rounded-3xl bg-[#f7f5f0] p-6 text-center">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt={form.name || "شعار المتجر"}
                  className="mx-auto mb-5 h-24 w-24 rounded-2xl object-contain"
                />
              ) : (
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-black text-2xl font-black text-white">
                  ه
                </div>
              )}

              <h3 className="text-xl font-black">
                {form.name || "همار"}
              </h3>

              {form.description && (
                <p className="mt-2 text-sm leading-6 text-black/50">
                  {form.description}
                </p>
              )}

              <div className="mt-6 rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/50">
                    التوصيل
                  </span>

                  <span className="font-bold">
                    {Number(form.shippingPrice || 0).toFixed(3)} ر.ع
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}