/**
 * trip-match — heurística que elige qué líneas cubren un viaje.
 *
 * MVP sobre recorridos mock: puntúa cada línea por la distancia del
 * PEOR extremo (origen o destino) a su polilínea; quedan las líneas
 * que pasan cerca de AMBOS puntos. Equirectangular local (el AMBA es
 * chico y el error es despreciable a esta escala).
 *
 * Módulo PURO y testeable. En P1 se reemplaza por el motor real sin
 * tocar UI (misma firma).
 */

import type { TripMatch } from './types';

const METERS_PER_DEGREE_LAT = 111_320;

/** Punto → metros planos locales alrededor de la latitud media. */
function toLocalMeters(p: [number, number], latRef: number): [number, number] {
  const k = METERS_PER_DEGREE_LAT * Math.cos((latRef * Math.PI) / 180);
  return [p[0] * k, p[1] * METERS_PER_DEGREE_LAT];
}

function pointToPolylineMeters(
  point: [number, number],
  polyline: ReadonlyArray<readonly [number, number]>,
): number {
  if (polyline.length === 0) return Infinity;
  const latRef = point[1];
  const [px, py] = toLocalMeters(point, latRef);
  let best = Infinity;
  for (let i = 1; i < polyline.length; i++) {
    const [ax, ay] = toLocalMeters([...polyline[i - 1]!] as [number, number], latRef);
    const [bx, by] = toLocalMeters([...polyline[i]!] as [number, number], latRef);
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    best = Math.min(best, Math.hypot(px - cx, py - cy));
  }
  return best;
}

/** Umbral de cobertura: a más de esto del recorrido, la línea no sirve. */
const MAX_DETOUR_M = 900;

/**
 * Líneas que sirven un viaje origen→destino, ordenadas por la peor
 * distancia de los dos extremos a la polilínea (menor = mejor).
 */
export function matchTripLines(
  origin: [number, number],
  destination: [number, number],
  routes: Readonly<Record<string, ReadonlyArray<readonly [number, number]>>>,
): TripMatch[] {
  const matches: TripMatch[] = [];
  for (const [lineId, polyline] of Object.entries(routes)) {
    const worst = Math.max(
      pointToPolylineMeters(origin, polyline),
      pointToPolylineMeters(destination, polyline),
    );
    if (worst <= MAX_DETOUR_M) matches.push({ lineId, scoreM: Math.round(worst) });
  }
  return matches.sort((a, b) => a.scoreM - b.scoreM);
}
