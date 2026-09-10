import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Transportes AMBA • Monitoreo en Vivo",
    short_name: "Transportes AMBA",
    description: "Monitoreo en tiempo real de colectivos y paradas del Área Metropolitana de Buenos Aires",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#f59e0b",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
