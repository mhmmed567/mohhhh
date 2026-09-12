
"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("اكتب اسمك");
      return;
    }

    if (!email.trim()) {
      setError("اكتب البريد الإلكتروني");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور لازم تكون 6 أحرف أو أكثر");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name.trim(),
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: user.email,
        role: "customer",
        createdAt: serverTimestamp(),
      });

      router.replace("/");
    } catch (error: any) {
      console.error("Register error:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          setError("هذا البريد الإلكتروني مستخدم من قبل");
          break;

        case "auth/invalid-email":
          setError("البريد الإلكتروني غير صحيح");
          break;

        case "auth/weak-password":
          setError("كلمة المرور ضعيفة");
          break;

        case "auth/network-request-failed":
          setError("تأكد من اتصال الإنترنت");
          break;

        default:
          setError("حدث خطأ أثناء إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-6 py-10"
    >
      <div className="mx-auto flex min-h-[85vh] max-w-md items-center justify-center">

        <div className="w-full">

          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <Link href="/">
              <Image
                src="/logo.jpg"
                alt="همار"
                width={70}
                height={70}
                className="rounded-full border border-line"
              />
            </Link>

            <h1 className="mt-5 font-display text-3xl font-bold text-ink">
              إنشاء حساب
            </h1>

            <p className="mt-2 text-sm text-silver-dark">
              أنشئ حسابك واستمتع بتجربة همار
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-line bg-panel p-6 shadow-xl sm:p-8">

            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  الاسم
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اكتب اسمك"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  dir="ltr"
                  className="w-full rounded-2xl border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  كلمة المرور
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full rounded-2xl border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  تأكيد كلمة المرور
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full rounded-2xl border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Register */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-ink px-5 py-4 text-sm font-semibold text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </button>
            </form>

            {/* Login */}
            <div className="mt-6 border-t border-line pt-6 text-center">
              <p className="text-sm text-silver-dark">
                عندك حساب بالفعل؟
              </p>

              <Link
                href="/login"
                className="mt-2 inline-block text-sm font-semibold text-ink underline underline-offset-4"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>

          {/* Back */}
          <Link
            href="/"
            className="mt-6 block text-center text-sm text-silver-dark transition hover:text-ink"
          >
            العودة للمتجر
          </Link>

        </div>
      </div>
    </main>
  );
}
