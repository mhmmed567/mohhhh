import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion:
        "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1" as Stripe.LatestApiVersion,
    });
  }

  return stripeClient;
}

