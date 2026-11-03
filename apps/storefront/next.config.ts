import path from "node:path";
import type { NextConfig } from "next";

// The VPS image (apps/storefront/Dockerfile) sets NEXT_OUTPUT=standalone; Vercel builds stay as they are.
const standalone = process.env.NEXT_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  ...(standalone ? { output: "standalone" as const, outputFileTracingRoot: path.join(__dirname, "../..") } : {}),
  /* config options here */
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
