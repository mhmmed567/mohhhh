"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // الحصول على صلاحية المستخدم من Firebase
      const token = await user.getIdTokenResult();
      const role = token.claims.role;

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "staff") {
        router.push("/admin/orders");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error(error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (error.code === "auth/too-many-requests") {
        setError("تمت محاولات كثيرة حاول مرة ثانية لاحقًا");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-paper px-5 py-8 md:px-8"
    >
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden border border-line bg-panel shadow-[0_30px_100px_-50px_rgba(0,0,0,0.35)] lg:grid-cols-2">

        {/* الجانب التعريفي */}
        <div className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full border border-white/10" />

          <Link href="/" className="relative z-10 flex items-center gap-3">
            <Image
              src="/logo.jpg"
              alt="همار"
              width={45}
              height={45}
              className="rounded-full"
            />

            <span className="font-display text-2xl font-bold">
              همار
            </span>
          </Link>

          <div className="relative z-10 max-w-md">
            <p className="mb-4 text-sm text-white/50">
              مرحبًا بك من جديد
            </p>

            <h1 className="font-display text-5xl font-bold leading-[1.15]">
              عطرك يبدأ
              <br />
              من هنا
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/60">
              سجل دخولك للوصول إلى حسابك وطلباتك وتجربة همار الخاصة.
            </p>
          </div>

          <p className="relative z-10 text-xs text-white/35">
            © {new Date().getFullYear()} همار
          </p>
        </div>

        {/* نموذج الدخول */}
        <div className="flex items-center justify-center p-7 md:p-12">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/logo.jpg"
                  alt="همار"
                  width={40}
                  height={40}
                  className="rounded-full"
                />

                <span className="font-display text-xl font-bold">
                  همار
                </span>
              </Link>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm text-silver-dark">
                تسجيل الدخول
              </p>

              <h2 className="font-display text-3xl font-bold">
                أهلًا بك مجددًا
              </h2>

              <p className="mt-3 text-sm leading-6 text-silver-dark">
                أدخل بيانات حسابك للمتابعة
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* البريد */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  autoComplete="email"
                  className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    كلمة المرور
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-silver-dark hover:text-ink"
                  >
                    {showPassword ? "إخفاء" : "إظهار"}
                  </button>
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full border border-lineStrong bg-paper px-4 py-3.5 text-sm outline-none transition focus:border-ink"
                />
              </div>

              {/* الخطأ */}
              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* زر الدخول */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink px-6 py-4 text-sm font-medium text-paper transition hover:bg-silver-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            <Link
              href="/"
              className="mt-8 block text-center text-xs text-silver-dark transition hover:text-ink"
            >
              العودة إلى المتجر
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
