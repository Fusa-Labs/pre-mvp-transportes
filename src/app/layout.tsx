import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transportes AMBA • Monitoreo en Vivo (Metropol)",
  description:
    "Maqueta interactiva de transporte para el Área Metropolitana de Buenos Aires con monitoreo de colectivos en tiempo real.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Transportes AMBA",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased dark">
      <body className="h-full w-full overflow-hidden bg-slate-950 text-slate-100 overscroll-none select-none">
        {children}
      </body>
    </html>
  );
}
