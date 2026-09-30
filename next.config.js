/** @type {import('next').NextConfig} */
const privatePaths = [
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
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

module.exports = nextConfig;
