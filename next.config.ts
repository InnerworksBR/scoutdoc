import type { NextConfig } from "next";

let supabaseHostname: string | null = null;
try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (rawUrl) supabaseHostname = new URL(rawUrl).hostname;
} catch {}

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "70mb",
        },
    },
    serverExternalPackages: ["pdfkit"],
    ...(supabaseHostname && {
        images: {
            remotePatterns: [
                {
                    protocol: "https",
                    hostname: supabaseHostname,
                    pathname: "/storage/v1/object/public/**",
                },
            ],
        },
    }),
};

export default nextConfig;
