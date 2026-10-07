import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe-server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "form",
      line_items: [
        {
          price: "price_...",
          quantity: 1,
        },
      ],
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      submit_type: "auto",
      integration_identifier: "custom_embedded_web_0003",
    });

    if (!session.client_secret) {
      throw new Error("Stripe did not return a Checkout client secret");
    }

    return NextResponse.json({ client_secret: session.client_secret });
  } catch (error) {
    console.error(
      "Stripe Checkout session creation failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "تعذر بدء الدفع الآن. حاول مرة أخرى لاحقًا." },
      { status: 500 }
    );
  }
}

