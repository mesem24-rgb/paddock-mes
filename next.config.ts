import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth"],
  outputFileTracingIncludes: {
    "/api/documents/extract": [
      "./node_modules/@napi-rs/canvas*/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
      "./node_modules/pdfjs-dist/legacy/build/**/*",
      "./node_modules/pdf-parse/dist/worker/**/*",
    ],
  },
};

export default nextConfig;
