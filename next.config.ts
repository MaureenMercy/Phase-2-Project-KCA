import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["./data/**", "./backend/**"],
  },
  turbopack: {
    // Keep Turbopack inside this app so it does not walk into backend/ or the parent folder.
    root,
  },
};

export default nextConfig;
