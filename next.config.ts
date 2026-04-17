import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // base64 de 50MB ~= 68MB — limite generoso para cobrir a codificação
    serverBodySizeLimit: "70mb",
  },
};

export default nextConfig;
