import { headers } from "next/headers";

/** Use the public domain when set; otherwise use the host serving this request. */
export function getSiteUrl(): string {
  const configured =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined);

  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("SITE_URL must use http or https");
    }
    return url.origin;
  }

  const requestHeaders = headers();
  const host = (requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"))
    ?.split(",")[0]
    .trim();

  if (!host) {
    throw new Error("Set SITE_URL to the public website URL");
  }

  const protocol =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim() ||
    (host.startsWith("localhost") ? "http" : "https");

  return new URL(`${protocol}://${host}`).origin;
}
