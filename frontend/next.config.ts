import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default bundler)
  // Treat coinbase/base-org packages as external on the server
  // to prevent them from being bundled with Node.js-only dependencies.
  serverExternalPackages: ["@coinbase/cdp-sdk", "@base-org/account"],

  // Empty turbopack key satisfies Next.js 16's check
  // (tells it we're intentionally using Turbopack with no custom config)
  turbopack: {},
};

export default nextConfig;
