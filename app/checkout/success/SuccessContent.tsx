"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");

  return (
    <main>
      <h1>تم استلام طلبك بنجاح 🎉</h1>

      {orderId && (
        <p>رقم الطلب: {orderId}</p>
      )}
    </main>
  );
}