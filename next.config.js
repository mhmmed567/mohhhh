const path = require("path");

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

const contentSecurityPolicy = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "frame-src https://*.stripe.com https://*.link.com",
  "connect-src 'self' https://*.stripe.com https://*.link.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
].join("; ");

const nextConfig = {
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
        ],
      },
      ...privatePaths.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

module.exports = nextConfig;

