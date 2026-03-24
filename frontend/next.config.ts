import type { NextConfig } from "next";

/** Прокси только для /uploads (GET). API — через app/api-proxy/.../route.ts (POST body и rewrites в Next 16 несовместимы). */
const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const backend =
      process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
      "http://127.0.0.1:4000";
    return [
      {
        source: "/uploads-proxy/:path*",
        destination: `${backend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
