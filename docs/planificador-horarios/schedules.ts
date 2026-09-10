/**
 * Horarios de líneas (mock determinístico) + combinaciones entre líneas.
 *
 * REGLA: los horarios se GENERAN por semilla (hash del lineId) — misma
 * entrada, misma salida. Cero Math.random: sin mismatch de hidratación
 * SSR/client y tests reproducibles. El swap a datos reales (P1) reemplaza
 * este módulo sin tocar la UI.
 */

import { MOCK_LINES, MOCK_STOPS } from '@/mock/data';
import type { Line, Stop } from '@/lib/data-service';

/** Ventana de servicio: primeras salidas ~05:00, última ~22:50. */
const INICIO_MIN = 5 * 60;
const FIN_MIN = 23 * 60 - 10;

export type Servicio = 'habil' | 'dom';

export interface LineSchedule {
  lineId: string;
  servicio: Servicio;
  /** Salidas del ramal ida, "HH:MM" ascendente. */
  ida: string[];
  /** Salidas del ramal vuelta, "HH:MM" ascendente. */
  vuelta: string[];
}

function hashOf(s: string): number {
  return [...s].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
}

function fmt(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Tabla de salidas: desde INICIO+offset, cada `freq`, hasta FIN. */
function buildTimes(offset: number, freq: number): string[] {
  const times: string[] = [];
  let min = INICIO_MIN + offset;
  while (min <= FIN_MIN) {
    times.push(fmt(min));
    min += freq;
  }
  return times;
}

/** Horarios completos de una línea (hábil + domingo), ida y vuelta. */
export function buildLineSchedules(lineId: string): LineSchedule[] {
  const line = MOCK_LINES.find((l) => l.id === lineId);
  if (!line) return [];

  const seed = hashOf(lineId);
  const offsetHabil = seed % 14; // primeros minutos 05:00–05:13
  const offsetDom = (seed >>> 3) % 22;
  // Domingos y feriados: servicio menos frecuente, nunca más del doble
  const freqDom = Math.min(line.frequency * 2, line.frequency + 15);

  return [
    {
      lineId,
      servicio: 'habil',
      ida: buildTimes(offsetHabil, line.frequency),
      vuelta: buildTimes(offsetHabil + Math.max(6, Math.floor(line.frequency / 2)), line.frequency),
    },
    {
      lineId,
      servicio: 'dom',
      ida: buildTimes(offsetDom, freqDom),
      vuelta: buildTimes(offsetDom + 12, freqDom),
    },
  ];
}

/** Primer y último horario de una tabla; null si está vacía. */
export function firstLast(times: string[]): { primera: string; ultima: string } | null {
  if (times.length === 0) return null;
  return { primera: times[0], ultima: times[times.length - 1] };
}

export interface Combinacion {
  stop: Stop;
  /** Líneas que comparten la parada, ordenadas por shortName numérico. */
  lines: Line[];
}

/**
 * Combinaciones: paradas donde 2+ líneas se cruzan y se puede transbordar.
 * Ordenadas por cantidad de líneas (más conexiones primero) y luego por nombre.
 */
export function combinationsByStop(): Combinacion[] {
  return MOCK_STOPS.filter((s) => s.lineIds.length >= 2)
    .map((stop) => ({
      stop,
      lines: stop.lineIds
        .map((id) => MOCK_LINES.find((l) => l.id === id))
        .filter((l): l is Line => Boolean(l))
        .sort((a, b) => Number(a.shortName) - Number(b.shortName)),
    }))
    .sort((a, b) => b.lines.length - a.lines.length || a.stop.name.localeCompare(b.stop.name));
}

/**
 * Próxima salida de una tabla respecto de `nowMin` (minutos del día).
 * Devuelve el primer horario >= nowMin, o el primero del día siguiente.
 */
export function nextDeparture(times: string[], nowMin: number): string | null {
  for (const t of times) {
    const [h, m] = t.split(':').map(Number);
    if (h * 60 + m >= nowMin) return t;
  }
  return times[0] ?? null;
}
