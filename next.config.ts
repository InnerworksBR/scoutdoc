import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // base64 de 50MB ~= 68MB — limite generoso para cobrir a codificação
      bodySizeLimit: "70mb",
    },
  },
};

export default nextConfig;
