# Stripe Integration TODO

This file is the single source of truth for the remaining Stripe setup.

## Values to Replace

The following values are placeholders and must be updated before using Stripe Checkout.

**Files containing placeholders:**

- [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts)
- [.env.example](.env.example)

| Field | Current Value | What to Set |
|---|---|---|
| `mode` | `payment` | Keep `payment` for one-time perfume purchases. Use `subscription` only for recurring billing; if changed, also add `payment_method_collection: "always"`. |
| `line_items[].price` | `price_...` | Replace it with the real Stripe Price ID from [Stripe Prices](https://dashboard.stripe.com/prices). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Add the current test publishable key to Netlify. This value is browser-visible by design. |
| `STRIPE_SECRET_KEY` | `rk_test_...` | Add a restricted test key with only the permissions required to create and read Checkout Sessions. Never commit it. |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Add the signing secret for the deployed webhook endpoint. Never commit it. |

The previously shared test secret should be rolled before it is used. Do not copy `.env.example` to GitHub with real values.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**

- [app/api/create-checkout-session/route.ts](app/api/create-checkout-session/route.ts)
- [lib/stripe-server.ts](lib/stripe-server.ts)
- [app/checkout/stripe/page.tsx](app/checkout/stripe/page.tsx)

| Parameter | Value |
|---|---|
| Stripe SDK | `22.6.0` |
| API version | `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1` |
| `ui_mode` | `form` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `false` |
| `submit_type` | `auto` |
| `integration_identifier` | `custom_embedded_web_0003` |
| `payment_method_collection` | Omitted because `mode` is `payment`; set to `always` only for subscription mode. |
| Checkout Form layout | `expanded` |
| Stripe.js beta | `custom_checkout_payment_form_1` |

## Setup and Next Steps

1. In Netlify, add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` under the site's environment variables, then redeploy. Prefer a restricted key (`rk_`) over an unrestricted secret key.
2. Replace `price_...` in the Checkout Session route with the actual one-time Price ID. The current placeholder intentionally keeps the demo isolated from the store's cart.
3. Configure a Stripe webhook endpoint at `https://YOUR-DOMAIN/api/stripe-webhook` for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
4. Before enabling card payment in the public checkout, attach the Firebase order ID to the Checkout Session metadata and implement idempotent fulfillment in the webhook. The webhook must verify the signature, mark the matching order paid only when `payment_status` is not `unpaid`, and decrement inventory once.
5. Keep transfer payments active until the Stripe Price and webhook fulfillment are connected to the real cart. The embedded test page is available at `/checkout/stripe`.

## Project Structure

- `app/api/create-checkout-session/route.ts` — creates a one-time Checkout Session and returns its `client_secret` as JSON.
- `app/api/stripe-webhook/route.ts` — verifies Stripe webhook signatures and receives payment result events.
- `app/checkout/stripe/page.tsx` — initializes the Stripe Checkout Form SDK and mounts the embedded form.
- `lib/stripe-server.ts` — creates the server-only Stripe client from `STRIPE_SECRET_KEY`.
- `.env.example` — documents required environment variable names without real keys.

## How It Works

1. The browser loads Stripe.js directly from `https://js.stripe.com/dahlia/stripe.js`.
2. `/checkout/stripe` requests a client secret from `/api/create-checkout-session`.
3. The server creates the Checkout Session with the configured form options.
4. Stripe renders the secure payment form in its hosted iframe.
5. Payment result events are sent to `/api/stripe-webhook`; order fulfillment must happen there, not on a success page.

## Testing

- Use Stripe test mode or a dedicated Stripe sandbox only.
- Successful card: `4242 4242 4242 4242`, any future expiry date, and any three-digit CVC.
- Test failures and authentication flows with the cards in [Stripe testing documentation](https://docs.stripe.com/testing).
- Confirm that invalid webhook signatures receive HTTP 400 and that repeated events do not update an order or inventory more than once after fulfillment is implemented.

## Resources

- [Stripe Support](https://support.stripe.com)
- [Stripe MCP documentation](https://docs.stripe.com/mcp)
- [Stripe API key best practices](https://docs.stripe.com/keys-best-practices)

