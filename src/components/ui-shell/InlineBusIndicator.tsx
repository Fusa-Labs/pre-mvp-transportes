"use client";

import { motion, useReducedMotion } from "motion/react";
import { Bus, ArrowRight } from "lucide-react";
import type { ActiveBusInTransit } from "@/lib/services/stop-schedule-service";

interface InlineBusIndicatorProps {
  bus: ActiveBusInTransit;
  color?: string;
}

/**
 * InlineBusIndicator — Representación viva del colectivo navegando en el riel vertical.
 * Se intercala dinámicamente entre dos paradas consecutivas (Sugerencia 1).
 */
export function InlineBusIndicator({
  bus,
  color = "#1D4ED8",
}: InlineBusIndicatorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative pl-1 py-1 my-0.5">
      {/* 1. Continuación del riel vertical de fondo */}
      <div
        className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-zinc-700"
        aria-hidden="true"
      />

      {/* 2. Pastilla de Colectivo en Viaje */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 flex items-center gap-3 p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 shadow-xs ml-0.5"
      >
        {/* Dot / Icono del colectivo con halo pulsante */}
        <div className="flex items-center justify-center shrink-0 w-8 h-8">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-blue-500/20"
            style={{ backgroundColor: color }}
          >
            <Bus className="w-4 h-4" />
          </div>
        </div>

        {/* Datos de la unidad y destino inmediato */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-blue-950 dark:text-blue-200 truncate">
              Interno #{bus.unitId}
            </span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {bus.speedKmh} km/h
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
            <span>Hacia</span>
            <ArrowRight className="w-2.5 h-2.5 text-blue-500 shrink-0" />
            <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
              {bus.toStop.nombre}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
