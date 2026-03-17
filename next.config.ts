import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/company/[id]": ["./data/pension.db"],
    "/fund/[slug]": ["./data/pension.db"],
    "/": ["./data/pension.db"],
    "/portfolio": ["./data/pension.db"],
    "/methodology": ["./data/pension.db"],
    "/about": ["./data/pension.db"],
  },
};

export default nextConfig;
