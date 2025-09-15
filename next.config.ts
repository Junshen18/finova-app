import type { NextConfig } from "next";
// @ts-expect-error - next-pwa has no types for ESM TS config usage in some versions
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  /* other next config options */
};

export default withPWA({
  dest: "public",
  disable: !isProd,
  // We register SW manually via a component in the app router
  register: false,
  skipWaiting: true,
  runtimeCaching: require("next-pwa/cache"),
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
