"use client";

import { useEffect, useRef, useState } from "react";
import type { ArrivalPhase } from "@/lib/trip-map-navigation";
import { Bus, CheckCircle2 } from "lucide-react";

interface ArrivalStatusCardProps {
  phase: ArrivalPhase;
  minutes: number | null;
  lineNumber: string;
  unitId: string;
  nextStopName?: string;
  onDismiss?: () => void;
}

const HAPTIC_BY_PHASE: Partial<Record<ArrivalPhase, number | number[]>> = {
  ARRIBANDO: 24,
  PASSED: [14, 34, 18],
  VIAJANDO_GREEN: 18,
};

/**
 * Toast efímera de estado de viaje (10 segundos):
 * Recicla con exactitud la forma, altura y dimensiones de las cápsulas superiores de origen y destino,
 * con colores dinámicos según el estado del colectivo respecto a la parada (arribando en ámbar vs viaje iniciado en esmeralda).
 */
export default function ArrivalStatusCard({
  phase,
  minutes: _minutes,
  lineNumber,
  unitId,
  nextStopName: _nextStopName,
  onDismiss,
}: ArrivalStatusCardProps) {
  const [visible, setVisible] = useState(false);
  const currentGroupRef = useRef<string | null>(null);
  const previousUnitRef = useRef<string>(unitId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isArriving = phase === "ARRIBANDO";
  const isTripStarted = phase === "PASSED" || phase === "VIAJANDO_GREEN" || phase === "VIAJANDO_YELLOW";
  const activeAlertGroup = isArriving ? "arribando" : isTripStarted ? "viaje-iniciado" : null;

  useEffect(() => {
    if (!activeAlertGroup) {
      setVisible(false);
      currentGroupRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const isNewAlert = currentGroupRef.current !== activeAlertGroup || previousUnitRef.current !== unitId;
    if (isNewAlert) {
      currentGroupRef.current = activeAlertGroup;
      previousUnitRef.current = unitId;
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      // Auto-ocultar a los 10 segundos exactos e ininterrumpidos
      timerRef.current = setTimeout(() => {
        setVisible(false);
        currentGroupRef.current = null;
      }, 10000);

      const pattern = HAPTIC_BY_PHASE[phase];
      if (pattern && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    }
  }, [activeAlertGroup, unitId, phase]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible || (!isArriving && !isTripStarted)) return null;

  const handleClose = () => {
    setVisible(false);
    currentGroupRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss?.();
  };

  return (
    <div className="absolute left-4 right-4 top-[calc(max(14px,env(safe-area-inset-top))+88px)] z-30 mx-auto max-w-md pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 w-full">
        {/* Cápsula gemela idéntica en forma y tamaño a las de origen y destino */}
        <div
          aria-live="polite"
          data-arrival-phase={phase}
          className={"relative flex-1 flex items-center border rounded-full px-3 py-1.5 shadow-md pointer-events-auto transition-all " + (
            isTripStarted
              ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/20"
              : "bg-amber-500 border-amber-400 text-white shadow-amber-950/20"
          )}
        >
          {/* Ícono a la izquierda con el mismo espacio métrico w-5 */}
          <div className="w-5 flex justify-center shrink-0 mr-1.5">
            {isTripStarted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
            ) : (
              <Bus className="w-4 h-4 text-amber-100 shrink-0 animate-bounce" />
            )}
          </div>

          {/* Texto central en tipografía idéntica a las cápsulas */}
          <span className="text-xs font-bold truncate flex-1 leading-tight select-none">
            {isTripStarted
              ? "Viaje iniciado · Línea " + lineNumber + " (Coche " + unitId + ")"
              : "Arribando a parada · Línea " + lineNumber + " (Coche " + unitId + ")"}
          </span>

          {/* Botón de cierre dismiss integrado en el extremo derecho */}
          <button
            type="button"
            onClick={handleClose}
            title="Ocultar aviso"
            aria-label="Ocultar aviso"
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors active:scale-90"
          >
            <span aria-hidden="true" className="text-sm font-bold leading-none">×</span>
          </button>
        </div>

        {/* Espaciador lateral para respetar la columna de botones (Swap/X) y mantener la alineación perfecta */}
        <div aria-hidden className="w-8 shrink-0" />
      </div>
    </div>
  );
}
