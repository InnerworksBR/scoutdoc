import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // base64 de 50MB ~= 68MB — limite generoso para cobrir a codificação
      bodySizeLimit: "70mb",
    },
  },
  // pdfkit carrega assets internos de fonte em runtime Node — não pode ser bundled pelo webpack
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
