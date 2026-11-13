import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev overlay badge only reported a browser-extension hydration warning.
  devIndicators: false,
};

export default nextConfig;
