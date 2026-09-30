/** Keep canonical URLs and the sitemap on the public domain, including on previews. */
export function getSiteUrl(): string {
  const url = new URL(process.env.SITE_URL || "https://hammar1.shop");
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("SITE_URL must use http or https");
  }
  return url.origin;
}
