import path from "node:path";
import type { NextConfig } from "next";

// The VPS image (apps/storefront/Dockerfile) sets NEXT_OUTPUT=standalone; Vercel builds stay as they are.
const standalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  ...(standalone ? { output: "standalone" as const, outputFileTracingRoot: path.join(__dirname, "../..") } : {}),
  // No Next.js "N" badge in the corner, even when the site runs in development mode.
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
