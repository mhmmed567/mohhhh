"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const appearance = {
  theme: "stripe",
  labels: "auto",
  inputs: "spaced",
  variables: {
    borderRadius: "4px",
    colorBackground: "#ffffff",
    colorDanger: "#df1b41",
    colorPrimary: "#0570de",
    colorSuccess: "#00c853",
    colorText: "#30313d",
    fontFamily: "default",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
};

type CheckoutForm = {
  mount: (selector: string) => void;
  on: (
    eventName: "confirm",
    handler: (event: unknown) => Promise<void>
  ) => void;
  unmount?: () => void;
};

type CheckoutFormSdk = {
  createForm: (options: { layout: "expanded" }) => CheckoutForm;
  loadActions: () => Promise<
    | {
        type: "success";
        actions: {
          confirm: (options: { formConfirmEvent: unknown }) => Promise<void>;
        };
      }
    | { type: "error" }
  >;
};

declare global {
  interface Window {
    Stripe?: (
      publishableKey: string,
      options: { betas: ["custom_checkout_payment_form_1"] }
    ) => {
      initCheckoutFormSdk: (options: {
        clientSecret: Promise<string>;
        appearance: typeof appearance;
      }) => CheckoutFormSdk;
    };
  }
}

function waitForStripe() {
  return new Promise<NonNullable<typeof window.Stripe>>((resolve, reject) => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;

      if (window.Stripe) {
        window.clearInterval(timer);
        resolve(window.Stripe);
      } else if (attempts >= 100) {
        window.clearInterval(timer);
        reject(new Error("تعذر تحميل Stripe.js"));
      }
    }, 100);
  });
}

export default function StripeCheckoutPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    let form: CheckoutForm | undefined;
    let cancelled = false;

    async function mountCheckout() {
      try {
        const publishableKey =
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

        if (!publishableKey) {
          throw new Error("مفتاح Stripe العام غير مضبوط بعد.");
        }

        const Stripe = await waitForStripe();
        if (cancelled) return;

        const stripe = Stripe(publishableKey, {
          betas: ["custom_checkout_payment_form_1"],
        });
        const clientSecret = fetch("/api/create-checkout-session", {
          method: "POST",
        }).then(async (response) => {
          const body = (await response.json()) as {
            client_secret?: string;
            error?: string;
          };

          if (!response.ok || !body.client_secret) {
            throw new Error(body.error || "تعذر إنشاء جلسة الدفع.");
          }

          return body.client_secret;
        });

        const checkout = stripe.initCheckoutFormSdk({
          clientSecret,
          appearance,
        });
        form = checkout.createForm({ layout: "expanded" });
        form.mount("#checkout-form");

        const loadActionsResult = await checkout.loadActions();
        if (loadActionsResult.type === "success") {
          form.on("confirm", async (event) => {
            try {
              await loadActionsResult.actions.confirm({
                formConfirmEvent: event,
              });
            } catch (confirmError) {
              console.error("Payment confirmation error:", confirmError);
              setError("تعذر تأكيد الدفع. تحقق من البيانات وحاول مرة أخرى.");
            }
          });
        }
      } catch (checkoutError) {
        console.error("Stripe Checkout loading error:", checkoutError);
        setError(
          checkoutError instanceof Error
            ? checkoutError.message
            : "تعذر تحميل نموذج الدفع."
        );
      }
    }

    mountCheckout();

    return () => {
      cancelled = true;
      form?.unmount?.();
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f5f0] px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/checkout"
          className="text-sm text-black/45 transition hover:text-black"
        >
          ← العودة لإتمام الطلب
        </Link>

        <section className="mt-6 rounded-[28px] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium tracking-[0.25em] text-black/35">
            HAMMAR
          </p>
          <h1 className="mt-2 text-3xl font-black">الدفع بالبطاقة</h1>
          <p className="mt-2 text-sm leading-6 text-black/45">
            أدخل بيانات الدفع الآمنة في النموذج التالي.
          </p>

          {error && (
            <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div id="checkout-form" className="mt-7 min-h-56" />
        </section>
      </div>
    </main>
  );
}

