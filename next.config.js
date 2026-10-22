/** @type {import('next').NextConfig} */
const privatePaths = [
  "/admin/alm/:path*",
  "/alm/:path*",
  "/api/alm/:path*",
  "/account/:path*",
  "/admin/:path*",
  "/cart/:path*",
  "/checkout/:path*",
  "/login/:path*",
  "/orders/:path*",
  "/register/:path*",
];

const nextConfig = {
  async headers() {
    return privatePaths.map((source) => ({
      source,
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ...(source.includes("alm") ? [{ key: "Referrer-Policy", value: "no-referrer" }] : []),
      ],
    }));
  },
};

module.exports = nextConfig;

