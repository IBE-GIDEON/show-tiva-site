import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/content.json is read at runtime with a path built from
  // process.cwd(), which Next's output file tracing cannot detect. Without
  // this, the file is left out of a standalone build and every page that
  // reads the store fails with ENOENT.
  outputFileTracingIncludes: {
    "/watch": ["./data/**"],
    "/watch/[id]": ["./data/**"],
    "/api/**": ["./data/**"],
  },
};

export default nextConfig;
