/**
 * RouteTimeline — Cronograma del recorrido en el modal del colectivo
 *
 * Línea de tiempo vertical: INICIO = círculo, FIN = cuadrado, cada parada
 * un punto, y el colectivo como dot vivo (color de línea + pulso
 * compartido de 1.8s con el mapa) insertado en su posición del trayecto.
 * Las paradas ya pasadas quedan atenuadas; la próxima va en negrita.
 *
 * Accesibilidad: la fila del bus es aria-hidden (se actualiza 1 Hz, no
 * debe annonciarse por frame); el ETA vive en la tarjeta de arriba.
 */

'use client';

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { StopAlongRoute } from '@/lib/map/route-progress';
import { cn } from '@/lib/utils';

interface RouteTimelineProps {
  /** color de la línea (rail, dots y bus) */
  color: string;
  /** texto legible sobre el color (badge del bus) */
  onColor: string;
  stops: StopAlongRoute[];
  /** 0..1 — posición del colectivo en el recorrido */
  busProgress: number;
  /** metros del bus desde el inicio (para ETA por parada) */
  busAlongM: number;
  /** km/h vigentes del colectivo (ETA = distancia / velocidad) */
  speedKmh: number;
  shortName: string;
}

const PULSE_ANIMATION = 'rutaba-live-pulse 1.8s ease-in-out infinite';

export function RouteTimeline({
  color,
  onColor,
  stops,
  busProgress,
  busAlongM,
  speedKmh,
  shortName,
}: RouteTimelineProps) {
  const reduceMotion = useReducedMotion();
  const busRowRef = useRef<HTMLDivElement>(null);
  const busIndex = stops.findIndex((s) => s.progress >= busProgress);

  // Auto-scroll suave: cuando el bus pasa una parada, su fila se mantiene
  // visible ('nearest' es no-op si ya está a la vista — sin saltos).
  useEffect(() => {
    busRowRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [busIndex, reduceMotion]);

  if (stops.length === 0) return null;

  // El bus se inserta entre la última parada pasada y la próxima
  const nextStop = busIndex >= 0 ? stops[busIndex] : null;
  // La línea se llena (color) hasta el bus, según progreso secuencial
  const rows = stops.length + 1; // +1 = fila del bus
  const busRow = busIndex >= 0 ? busIndex : rows - 1;
  const fillPct = ((busRow + 0.5) / rows) * 100;

  // Cronograma real: ETA por parada (distancia a lo largo ÷ velocidad)
  const etaTo = (stop: StopAlongRoute): number =>
    Math.max(1, Math.round((Math.max(0, stop.alongM - busAlongM) / 1000 / speedKmh) * 60));

  return (
    <div role="list" className="relative pl-1">
      {/* Rail base + relleno hasta el colectivo */}
      <div
        className="absolute bottom-4 left-[13px] top-4 w-0.5 rounded bg-outline-variant"
        aria-hidden="true"
      />
      <div
        className="absolute left-[13px] top-4 w-0.5 rounded"
        style={{ height: `calc(${fillPct}% - 16px)`, backgroundColor: color, maxHeight: 'calc(100% - 32px)' }}
        aria-hidden="true"
      />

      {/* INICIO — círculo (sin nombre: la primera parada ya está en su fila) */}
      <div role="listitem" className="relative z-10 flex items-center gap-3 pb-1">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface"
          style={{ border: `2.5px solid ${color}` }}
          aria-hidden="true"
        />
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          Inicio del recorrido
        </p>
      </div>

      {/* Paradas + colectivo vivo */}
      <div className="relative">
        {stops.map((stop, index) => {
          const passed = stop.progress < busProgress;
          return (
            <div
              key={stop.id}
              role="listitem"
              className="relative z-10 flex items-center gap-3 py-1.5"
            >
              <span
                className="ml-[7px] h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-surface"
                style={{
                  borderColor: color,
                  backgroundColor: passed ? color : undefined,
                }}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-sm',
                  passed
                    ? 'text-on-surface-variant opacity-60'
                    : stop === nextStop
                      ? 'font-bold text-on-surface'
                      : 'text-on-surface',
                )}
              >
                {stop.name}
              </span>
              {/* Cronograma real: pasada → ✓ · próxima → ETA en vivo */}
              {passed ? (
                <span
                  className="material-symbols-outlined shrink-0 text-base text-on-surface-variant opacity-50"
                  aria-hidden="true"
                >
                  check
                </span>
              ) : (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-on-surface-variant">
                  {etaTo(stop)} min
                </span>
              )}
              {/* Índice oculto para mantener el orden en lectores */}
              <span className="sr-only">Parada {index + 1} de {stops.length}</span>
            </div>
          );
        })}

        {/* Colectivo vivo: dot en el trayecto (sin z-index: no compite
            con capas externas — las acciones viven en el footer del sheet) */}
        {busIndex >= 0 && (
          <motion.div
            ref={busRowRef}
            layout="position"
            className="relative z-10 flex items-center gap-3 py-1"
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeInOut' }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center">
              <span
                className={cn('h-4 w-4 rounded-full ring-4 ring-surface')}
                style={{ backgroundColor: color, animation: reduceMotion ? undefined : PULSE_ANIMATION }}
                aria-hidden="true"
              />
            </span>
            <span
              className="flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-sm"
              style={{ backgroundColor: color, color: onColor }}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">directions_bus</span>
              Colectivo {shortName} en trayecto
            </span>
          </motion.div>
        )}
      </div>

      {/* FIN — cuadrado (sin nombre: la última parada ya está en su fila) */}
      <div role="listitem" className="relative z-10 flex items-center gap-3 pt-1">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-surface"
          style={{ border: `2.5px solid ${color}` }}
          aria-hidden="true"
        />
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
          Fin del recorrido
        </p>
      </div>
    </div>
  );
}
