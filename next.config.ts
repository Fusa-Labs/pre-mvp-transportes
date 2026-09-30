import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "caring-kernel-tournaments-trembl.trycloudflare.com",
    "192.168.2.2",
    "192.168.2.2:3000",
    "192.168.2.2:3001",
    "localhost",
    "localhost:3000",
    "localhost:3001",
  ],
  async redirects() {
    return [
      // Estandar de rutas en español (/inicio); /home queda como link viejo del demo.
      { source: "/home", destination: "/inicio", permanent: false },
    ];
  },
};

export default nextConfig;
