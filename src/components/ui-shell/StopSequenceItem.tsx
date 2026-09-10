"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Footprints, ChevronDown, ChevronUp } from "lucide-react";
import type { StopLiveStatus } from "@/lib/services/stop-schedule-service";

interface StopSequenceItemProps {
  status: StopLiveStatus;
  isSelected: boolean;
  onSelect: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const SUBTE_COLORS: Record<string, string> = {
  A: "#00A3E0",
  B: "#E11D48",
  C: "#2563EB",
  D: "#16A34A",
  E: "#9333EA",
  H: "#FEA619",
};

/**
 * StopSequenceItem — Fila enriquecida de parada para la secuencia de la Línea 200.
 * Incorpora:
 * - Cuenta regresiva en vivo + hora exacta de arribo (ETA dual).
 * - Comparador de tiempo a pie (Walk feasibility).
 * - Badges de transbordo multimodal (Subte / Metrobús).
 * - Micro-acordeón con los próximos 3 horarios programados.
 */
export function StopSequenceItem({
  status,
  isSelected,
  onSelect,
  isFirst = false,
  isLast = false,
}: StopSequenceItemProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const {
    stop,
    etaMin,
    clockTime,
    isImminent,
    displayStatus,
    displayLabel,
    statusColor,
    walkComparison,
    scheduledNextSlots,
  } = status;

  const handleRowClick = () => {
    onSelect();
    setIsAccordionOpen((prev) => !prev);
  };

  return (
    <div className="relative pl-1">
      {/* 1. Riel vertical conectando las paradas */}
      <div
        className={`absolute left-[18px] w-0.5 bg-slate-200 dark:bg-zinc-700 ${
          isFirst ? "top-5 bottom-0" : isLast ? "top-0 h-5" : "top-0 bottom-0"
        }`}
        aria-hidden="true"
      />

      {/* 2. Tarjeta interactiva de la parada (Touch target de 48px+) */}
      <div
        onClick={handleRowClick}
        className={`relative z-10 min-h-[52px] flex flex-col p-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
          isSelected
            ? "bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/60 dark:border-amber-500/40 shadow-sm"
            : "hover:bg-slate-50 dark:hover:bg-zinc-850/60 border border-transparent"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Nodo / Dot de la línea */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center shrink-0 w-8 h-8">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  isSelected
                    ? "bg-amber-500 border-white ring-4 ring-amber-500/30 scale-110"
                    : displayStatus === "en-parada"
                    ? "bg-emerald-500 border-white ring-4 ring-emerald-500/30 animate-pulse"
                    : isImminent
                    ? "bg-emerald-500 border-white ring-2 ring-emerald-500/20"
                    : "bg-slate-400 dark:bg-zinc-600 border-white dark:border-zinc-900"
                }`}
              />
            </div>

            {/* Nombre y dirección */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4
                  className={`text-xs font-black truncate leading-tight ${
                    isSelected
                      ? "text-amber-900 dark:text-amber-200"
                      : "text-slate-800 dark:text-slate-100"
                  }`}
                >
                  {stop.nombre}
                </h4>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {stop.direccion}
              </p>

              {/* Transbordos Multimodales (Sugerencia 4) */}
              {stop.conexiones && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {stop.conexiones.subte?.map((lineaSubte) => (
                    <span
                      key={lineaSubte}
                      className="px-1.5 py-0.2 rounded text-[10px] font-black text-white shadow-xs inline-flex items-center"
                      style={{ backgroundColor: SUBTE_COLORS[lineaSubte] || "#334155" }}
                      title={`Combinación Subte Línea ${lineaSubte}`}
                    >
                      {lineaSubte}
                    </span>
                  ))}

                  {stop.conexiones.metrobus && (
                    <span
                      className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[9px] font-extrabold tracking-wide"
                      title="Combinación con Metrobús 9 de Julio"
                    >
                      METROBÚS
                    </span>
                  )}
                </div>
              )}

              {/* Factibilidad a Pie (Sugerencia 3) */}
              {walkComparison && (
                <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
                  <Footprints className="w-3 h-3 text-slate-400" />
                  <span
                    className={
                      walkComparison.status === "on-time"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : walkComparison.status === "hurry"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    {walkComparison.label} ({walkComparison.walkMin} min a pie)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pastilla Lateral Derecha: Cuenta Regresiva + Hora (ETA Dual) */}
          <div className="flex flex-col items-end shrink-0 pl-1">
            <div
              className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-black shadow-xs ${
                statusColor === "emerald"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : statusColor === "amber"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700"
              }`}
            >
              {displayStatus === "en-parada" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>En parada</span>
                </>
              ) : displayStatus === "arribando" ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Arribando</span>
                </>
              ) : (
                <>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      statusColor === "emerald" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span>{displayLabel || `${etaMin} min`}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{clockTime} hs</span>
              {isAccordionOpen ? (
                <ChevronUp className="w-3 h-3 ml-0.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5 text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* 3. Micro-Acordeón con los próximos 3 horarios programados (Sugerencia 5) */}
        <AnimatePresence>
          {isAccordionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden pt-2.5 mt-2 border-t border-slate-200/50 dark:border-zinc-700/50"
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                <span>Próximas pasadas programadas</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Cada 15 min</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {scheduledNextSlots.map((slot, idx) => (
                  <div
                    key={slot}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums shadow-xs ${
                      idx === 0
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-zinc-700"
                    }`}
                  >
                    {slot} hs
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
