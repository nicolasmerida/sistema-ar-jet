import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/*": ["./assets/fonts/NotoSans-Regular.ttf"] },
};

export default nextConfig;
