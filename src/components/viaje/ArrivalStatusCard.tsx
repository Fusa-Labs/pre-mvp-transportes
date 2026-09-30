"use client";

import { useEffect, useRef, useState } from "react";
import type { ArrivalPhase } from "@/lib/trip-map-navigation";

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

function RollingDuration({ value }: { value: number }) {
  return (
    <span aria-label={`${value} minutos`} className="arrival-rolling-duration">
      <span className="arrival-rolling-duration__value">{value}</span>
      <span aria-hidden="true" className="arrival-rolling-duration__unit"> min</span>
    </span>
  );
}

/** Alerta Heads-Up efímera: emerge al entrar a ARRIBANDO o al iniciar viaje (PASSED / VIAJANDO) y se auto-cierra tras 10s */
export default function ArrivalStatusCard({
  phase,
  minutes: _minutes,
  lineNumber,
  unitId,
  nextStopName: _nextStopName,
  onDismiss,
}: ArrivalStatusCardProps) {
  const [visible, setVisible] = useState(false);
  const previousPhaseRef = useRef<ArrivalPhase>(phase);
  const previousUnitRef = useRef<string>(unitId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isArriving = phase === "ARRIBANDO";
  const isTripStarted = phase === "PASSED" || phase === "VIAJANDO_GREEN" || phase === "VIAJANDO_YELLOW";

  useEffect(() => {
    // Si la fase es ARRIBANDO o viaje iniciado (PASSED / VIAJANDO_GREEN / VIAJANDO_YELLOW)
    if (isArriving || isTripStarted) {
      const phaseChanged = previousPhaseRef.current !== phase;
      const unitChanged = previousUnitRef.current !== unitId;
      const wasTripStarted =
        previousPhaseRef.current === "PASSED" ||
        previousPhaseRef.current === "VIAJANDO_GREEN" ||
        previousPhaseRef.current === "VIAJANDO_YELLOW";

      // Disparar si cambió la fase (ej: de normal a arribando, o de arribando a viaje iniciado), o cambió la unidad
      if ((isArriving && (phaseChanged || unitChanged)) || (isTripStarted && (!wasTripStarted || unitChanged))) {
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        // Auto-ocultar a los 10 segundos
        timerRef.current = setTimeout(() => {
          setVisible(false);
        }, 10000);

        const pattern = HAPTIC_BY_PHASE[phase];
        if (pattern && typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(pattern);
        }
      }
    } else {
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }

    previousPhaseRef.current = phase;
    previousUnitRef.current = unitId;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, unitId, isArriving, isTripStarted]);

  if (!visible || (!isArriving && !isTripStarted)) return null;

  const handleClose = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss?.();
  };

  return (
    <div className="absolute left-4 right-4 top-[calc(max(14px,env(safe-area-inset-top))+72px+var(--trip-stack-gap,0px))] z-30 mx-auto max-w-[320px] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
      {isTripStarted ? (
        <div
          aria-live="polite"
          data-arrival-phase={phase}
          className="pointer-events-auto relative mt-0 flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 shadow-xl bg-emerald-600 border-emerald-500 text-white"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">
              Línea {lineNumber} · Coche {unitId}
            </p>
            <p className="truncate text-sm font-black tracking-wide text-white">
              Viaje iniciado
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            title="Ocultar aviso"
            aria-label="Ocultar aviso de viaje iniciado"
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors text-white"
          >
            <span aria-hidden="true" className="text-base leading-none">×</span>
          </button>
        </div>
      ) : (
        <div
          aria-live="polite"
          data-arrival-phase={phase}
          className="arrival-card arrival-card--arribando pointer-events-auto relative mt-0 flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 shadow-xl"
        >
          <div className="min-w-0">
            <p className="arrival-card__eyebrow">¡Atención en parada!</p>
            <p className="truncate text-sm font-black tracking-wide">ARRIBANDO · Línea {lineNumber}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            title="Ocultar aviso"
            aria-label="Ocultar aviso de arribo"
            className="arrival-card__dismiss w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <span aria-hidden="true" className="text-base leading-none">×</span>
          </button>
        </div>
      )}
    </div>
  );
}
