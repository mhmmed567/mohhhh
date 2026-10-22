"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { safeAlmReturnPath } from "@/lib/alm-rewards";
import { CupIcon } from "./AlmIcons";

export function AlmAdminGate({
  children,
  returnPath = "/admin/alm",
}: {
  children: ReactNode;
  returnPath?: string;
}) {
  const [state, setState] = useState<"loading" | "admin" | "denied">("loading");
  const router = useRouter();
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (active) setState("loading");
      if (!user) {
        router.replace(
          "/login?next=" +
            encodeURIComponent(safeAlmReturnPath(returnPath) || "/admin/alm"),
        );
        return;
      }
      try {
        const token = await user.getIdTokenResult(true);
        if (active)
          setState(token.claims.role === "admin" ? "admin" : "denied");
      } catch {
        if (active) setState("denied");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [returnPath, router]);

  if (state === "loading")
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper p-6"
      >
        <CupIcon className="h-9 w-9 animate-pulse text-silver-dark" />
        <p role="status" className="text-sm text-silver-dark">
          جارٍ التحقق من صلاحية الأدمن…
        </p>
      </main>
    );
  if (state === "denied")
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-paper p-6"
      >
        <div className="max-w-md rounded-[2rem] border border-line bg-white p-9 text-center">
          <p className="text-xs tracking-widest text-silver-dark">
            HAMMAR × ALM
          </p>
          <h1 className="mt-5 text-2xl font-bold">الدخول للأدمن فقط</h1>
          <p className="mt-4 text-sm leading-7 text-silver-dark">
            صرف الهدايا وإدارة أكوادها يحتاجان حساب مدير المتجر.
          </p>
          <Link
            href={
              "/login?next=" +
              encodeURIComponent(safeAlmReturnPath(returnPath) || "/admin/alm")
            }
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm text-white"
          >
            الدخول بحساب آخر
          </Link>
          <Link
            href="/"
            className="mt-5 block text-sm underline underline-offset-4"
          >
            العودة للمتجر
          </Link>
        </div>
      </main>
    );
  return <>{children}</>;
}
