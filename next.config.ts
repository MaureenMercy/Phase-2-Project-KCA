import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["./data/**", "./backend/**"],
  },
  // Dev compiles a route the first time it is opened, then drops it after
  // 60s or once five routes are cached. The commission sidebar has more
  // pages than that, so every click compiled again.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 50,
  },
  turbopack: {
    // Keep Turbopack inside this app so it does not walk into backend/ or the parent folder.
    root,
  },
};

export default nextConfig;
