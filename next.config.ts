import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // External images configuration
  images: {
    remotePatterns: [
      // Placeholder image services
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      // Thai e-commerce sites (for real scraping)
      { protocol: "https", hostname: "**.jib.co.th" },
      { protocol: "https", hostname: "**.bnn.in.th" },
      { protocol: "https", hostname: "**.shopee.co.th" },
      { protocol: "https", hostname: "**.lazada.co.th" },
      { protocol: "https", hostname: "**.lotuss.com" },
      { protocol: "https", hostname: "**.bigc.co.th" },
      { protocol: "https", hostname: "**.lnwshop.com" },
      // Shopee/Lazada CDNs
      { protocol: "https", hostname: "**.scdn.co" },
      { protocol: "https", hostname: "**.alicdn.com" },
      { protocol: "https", hostname: "**.lzd.co" },
    ],
  },
  // Ignore old frontend/backend directories
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
