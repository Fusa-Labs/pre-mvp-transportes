"use client";

import { Radio, Bus } from "lucide-react";
import { Linea } from "@/types/transport";

interface LineSelectorBarProps {
  lineas: Linea[];
  selectedLineaId: string | null;
  onSelectLinea: (lineaId: string | null) => void;
}

/**
 * Componente modular LineSelectorBar (Fase 4).
 * Selector horizontal tipo chips para alternar rápidamente entre líneas activas de la flota.
 */
export default function LineSelectorBar({
  lineas,
  selectedLineaId,
  onSelectLinea,
}: LineSelectorBarProps) {
  return (
    <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {/* Opción 'Todas' las líneas */}
      <button
        onClick={() => onSelectLinea(null)}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
          selectedLineaId === null
            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 scale-105 ring-2 ring-offset-2 ring-slate-900 dark:ring-white"
            : "bg-white/95 dark:bg-zinc-900/95 text-slate-700 dark:text-slate-300 hover:bg-white"
        }`}
      >
        <Radio className="w-3 h-3" />
        <span>Todas</span>
      </button>

      {/* Chips individuales por línea */}
      {lineas.map((linea) => {
        const isSelected = selectedLineaId === linea.id;
        return (
          <button
            key={linea.id}
            onClick={() => onSelectLinea(isSelected ? null : linea.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
              isSelected
                ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105 shadow-lg"
                : "opacity-90 hover:opacity-100 hover:scale-102"
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
