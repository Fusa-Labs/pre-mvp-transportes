import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Transportes AMBA • Monitoreo en Vivo (Metropol)",
  description:
    "Maqueta interactiva de transporte para el Área Metropolitana de Buenos Aires con monitoreo de colectivos en tiempo real.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="h-full w-full overflow-hidden bg-slate-900 text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
