/**
 * Landing Page — /
 *
 * Presentación de la app con la marca de La Nueva Metropol.
 * Port desde colectivos-amba/src/app/page.tsx (plan paso e).
 * Íconos: lucide-react (Material Symbols no se usa, PBI-006).
 * Tokens: DESIGN.MD. CTAs → /inicio.
 */

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { MetropolLogo, MetropolRose } from "@/components/brand/metropol-logo";

const heroStats = [
  { value: "5", label: "líneas en vivo" },
  { value: "16", label: "paradas" },
  { value: "1 Hz", label: "actualización" },
];

export default function LandingPage() {
  return (
    <div className="h-dvh overflow-y-auto overscroll-contain bg-canvas text-ink select-text">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[linear-gradient(165deg,#0A1020_0%,#152248_45%,#1D2B4F_100%)] pt-16 pb-20 px-6 text-center text-white">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full" aria-hidden="true" />
        <div className="absolute -bottom-36 -left-20 w-96 h-96 bg-white/5 rounded-full" aria-hidden="true" />
        <svg
          className="absolute inset-x-0 top-1/2 w-full opacity-[0.07]"
          viewBox="0 0 400 60"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M-10 40 C 80 40, 100 12, 180 20 S 320 55, 410 18"
            stroke="white"
            strokeWidth="3"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/15 shadow-2xl">
            <MetropolRose className="h-11 w-auto text-white" />
          </div>

          <h1 className="text-[44px] leading-[1.04] font-extrabold mb-3 tracking-tight">
            La Nueva
            <br />
            Metropol
          </h1>
          <p className="text-lg text-white/75 max-w-xs mx-auto leading-relaxed font-light">
            Colectivos del Área Metropolitana de Buenos Aires, en vivo
          </p>

          <div className="flex items-center justify-center gap-3 mt-7">
            <span className="h-px w-8 bg-white/25" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/55">
              Un proyecto de
            </span>
            <span className="h-px w-8 bg-white/25" aria-hidden="true" />
          </div>
          <MetropolLogo variant="mono" className="h-9 mx-auto mt-3 text-white" />

          <div className="mt-9 flex flex-col items-center gap-3">
            <Link
              href="/inicio"
              className="h-14 w-full max-w-xs bg-white text-[#1D2B4F] font-bold text-lg rounded-full shadow-lg shadow-black/20 hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center"
            >
              Entrar al demo
            </Link>
            <Link
              href="/mapas"
              className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full border border-white/25 bg-white/5 text-sm font-semibold text-white/85 backdrop-blur hover:bg-white/10 transition-colors active:scale-95"
            >
              Ver el mapa en vivo
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <p className="text-xs text-white/45 mt-1">No requiere registro</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-10 max-w-xs mx-auto">
            {heroStats.map((s) => (
              <div key={s.label} className="bg-white/10 border border-white/10 backdrop-blur rounded-xl py-3 px-1">
                <p className="text-xl font-extrabold leading-none">{s.value}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-white/55 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TODO(PBI-010): teaser /metropol oculto — la ruta src/app/metropol/ no existe todavía.
          Descomentar y apuntar a /metropol cuando se porte el módulo de flota. */}

      {/* CTA final */}
      <section className="px-6 pb-16 max-w-lg mx-auto text-center">
        <div className="bg-canvas rounded-3xl border border-hairline-soft p-8">
          <PlayCircle className="w-12 h-12 text-ink mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-ink mb-2">Probá la demo</h2>
          <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto leading-relaxed">
            Explorá el mapa en vivo y descubrí todas las funciones con datos mockeados.
          </p>
          <Link
            href="/inicio"
            className="w-full h-12 bg-ink text-canvas font-bold rounded-full hover:bg-ink-soft transition-colors active:scale-[0.98] inline-flex items-center justify-center"
          >
            Comenzar ahora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center px-6 py-8 border-t border-hairline bg-ink text-canvas rounded-t-3xl">
        <MetropolLogo variant="mono" className="h-5 mx-auto text-canvas opacity-80" />
        <p className="text-xs text-text-faint mt-4">La Nueva Metropol · Demo 2026</p>
        <p className="text-[11px] text-text-faint/70 mt-1">Una iniciativa del Grupo Metropol</p>
      </footer>
    </div>
  );
}
