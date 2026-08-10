import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/content.json and data/site.json are read at runtime with a path built
  // from process.cwd(), which Next's output file tracing cannot detect.
  // Without this, they are left out of a standalone build and every route that
  // reads a store fails with ENOENT.
  //
  // Every route here reads a store, so each one needs an entry. "/" is the
  // landing page, which reads site.json via getLanding(). Note picomatch's "*"
  // does not cross slashes, so a single "/*" would not cover "/watch/[id]".
  outputFileTracingIncludes: {
    "/": ["./data/**"],
    "/watch": ["./data/**"],
    "/watch/[id]": ["./data/**"],
    "/api/**": ["./data/**"],
  },
};

export default nextConfig;
