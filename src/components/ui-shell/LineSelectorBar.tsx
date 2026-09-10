"use client";

import { Radio, Bus } from "lucide-react";
import { Linea } from "@/types/transport";

interface LineSelectorBarProps {
  lineas: Linea[];
  selectedLineaId: string | null;
  onSelectLinea: (lineaId: string | null) => void;
}

/**
 * Componente modular LineSelectorBar (Fase 4 & 5).
 * Selector horizontal tipo chips para alternar rápidamente entre líneas activas de la flota.
 * Optimizado para touch targets y scrolling táctil fluido en móvil.
 */
export default function LineSelectorBar({
  lineas,
  selectedLineaId,
  onSelectLinea,
}: LineSelectorBarProps) {
  if (lineas.length <= 1) return null;

  return (
    <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x overscroll-x-contain">
      {/* Opción 'Todas' las líneas */}
      <button
        onClick={() => onSelectLinea(null)}
        className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5 touch-manipulation ${
          selectedLineaId === null
            ? "bg-primary text-primary-foreground"
            : "bg-canvas text-ink border border-hairline hover:bg-canvas-soft"
        }`}
      >
        <Radio className="w-3.5 h-3.5" />
        <span>Todas</span>
      </button>

      {/* Chips individuales por línea */}
      {lineas.map((linea) => {
        const isSelected = selectedLineaId === linea.id;
        return (
          <button
            key={linea.id}
            onClick={() => onSelectLinea(isSelected ? null : linea.id)}
            className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 touch-manipulation ${
              isSelected
                ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas"
                : "opacity-90 hover:opacity-100"
            }`}
            style={{
              backgroundColor: linea.colorHex,
              color: linea.textColorHex,
            }}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Línea {linea.numero}</span>
          </button>
        );
      })}
    </div>
  );
}
