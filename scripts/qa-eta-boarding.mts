/**
 * QA determinista del ETA de abordaje.
 *
 * SDD `eta-boarding-fidelity` · Commit C1 (fundación: harness + baseline congelado).
 *
 * Objetivo: capturar la línea base ANTES de tocar la rama viva de `getLlegadas`
 * para poder probar, fila por fila, que W1 (proyección por ramal) no cambia la 65
 * y que W2′ (frecuencia simulada) completa las paradas densas de la 194.
 *
 * Uso:
 *   npx --yes tsx scripts/qa-eta-boarding.mts            # reporte (siempre imprime)
 *   npx --yes tsx scripts/qa-eta-boarding.mts --expect   # además aserta el baseline
 *
 * Características:
 * - Ejercita la rama VIVA de `getLlegadas` pasando posiciones reales de la flota
 *   simulada (no el fallback sin GPS). La flota se inicializa con un único tick
 *   síncrono de `subscribeToPositions` y se desuscribe enseguida.
 * - Determinista: no lee reloj de pared; misma entrada → misma salida.
 * - Sale con código ≠ 0 si una aserción falla (modo `--expect`).
 */

import { subscribeToPositions, getCurrentPositions, getRamalForUnit } from "@/mock/live";
import { MOCK_UNITS } from "@/mock/data";
import { TransportService } from "@/lib/services/transport-service";
import { buildBoardingOptions, type BoardingOptionRow } from "@/lib/services/trip-boarding-options";
import { TripPlannerService } from "@/lib/services/trip-planner-service";
import type { VehiclePosition } from "@/lib/data-service";
import type { EstimacionLlegada } from "@/types/transport";

const EXPECT = process.argv.includes("--expect");

// ─── Flota simulada: un único tick síncrono, luego se corta el intervalo ────
// getCurrentPositions() devuelve el fleet module-level SOLO después de que
// subscribeToPositions lo inicialice; el primer tick es síncrono.
const ALL_LINE_IDS = Object.keys(MOCK_UNITS);

function snapshotFleet(): VehiclePosition[] {
  const unsubscribe = subscribeToPositions(ALL_LINE_IDS, () => {});
  try {
    return getCurrentPositions();
  } finally {
    unsubscribe();
  }
}

const positions = snapshotFleet();

// ─── Paradas de referencia ──────────────────────────────────────────────────

const REFERENCE_STOPS = [
  "stop-65-05",
  "stop-65-01",
  "stop-65-09",
  "stop-194-once",
  "stop-194-escobar-estacion",
  "stop-194-zarate-transferencia",
] as const;

// ─── Semillas de "Historial de paradas" (B2) ────────────────────────────────

interface SeedRoute {
  id: string;
  boardingStopId: string;
  destinationStopId: string;
  lineId: string;
}

const SEEDS: SeedRoute[] = [
  {
    id: "seed-65-centenario-barrancas",
    boardingStopId: "stop-65-05",
    destinationStopId: "stop-65-09",
    lineId: "line-65",
  },
  {
    id: "seed-65-constitucion-barrancas",
    boardingStopId: "stop-65-01",
    destinationStopId: "stop-65-09",
    lineId: "line-65",
  },
  {
    id: "seed-194-once-escobar",
    boardingStopId: "stop-194-once",
    destinationStopId: "stop-194-escobar-estacion",
    lineId: "line-194",
  },
  {
    id: "seed-194-once-zarate",
    boardingStopId: "stop-194-once",
    destinationStopId: "stop-194-zarate-transferencia",
    lineId: "line-194",
  },
];

// ─── Formato y lectura de llegadas ──────────────────────────────────────────

function ramalTag(lineId: string, interno: string): string {
  const ramalId = getRamalForUnit(lineId, interno);
  return ramalId ? ramalId.replace(/^ramal-(?:65|194|60)-/, "") : "-";
}

function labelOf(a: EstimacionLlegada): string {
  return a.displayLabel ?? `${a.minutos} min`;
}

function formatArrival(a: EstimacionLlegada): string {
  return `${a.interno}[${ramalTag(a.lineaId, a.interno)}] = ${labelOf(a)}`;
}

function byMinutes(a: EstimacionLlegada, b: EstimacionLlegada): number {
  return a.minutos - b.minutos;
}

/** Rama viva: posiciones reales de la flota simulada. */
function liveArrivals(stopId: string): EstimacionLlegada[] {
  return [...TransportService.getArrivals(stopId, positions)].sort(byMinutes);
}

/** Sin posiciones → `getLlegadas` cae deliberadamente al generador §2 (sin GPS). */
function fallbackArrivals(stopId: string): EstimacionLlegada[] {
  return [...TransportService.getArrivals(stopId)].sort(byMinutes);
}

/**
 * El fallback sin GPS emite internos fijos `25`/`48` y distancias múltiplos
 * exactos de 310 m. Si TODAS las filas cumplen eso, sospechamos del fallback.
 */
function looksLikeFallback(rows: EstimacionLlegada[]): boolean {
  return (
    rows.length > 0 &&
    rows.every(
      (a) => (a.interno === "25" || a.interno === "48") && a.distanciaMetros === a.minutos * 310,
    )
  );
}

/** Confirma que la parada se resolvió por la rama viva, no por el fallback. */
function livePathExercised(stopId: string): boolean {
  const live = liveArrivals(stopId);
  if (positions.length === 0 || live.length === 0) return false;
  if (looksLikeFallback(live)) return false;
  return JSON.stringify(live) !== JSON.stringify(fallbackArrivals(stopId));
}

/** Top-3 que mostraría el mapa: mismo camino que `mapas/page.tsx`. */
function seedBoardingRows(seed: SeedRoute): BoardingOptionRow[] {
  const arrivals = TransportService.getLlegadasPorParada(seed.boardingStopId, positions);
  const trip =
    TripPlannerService.planTrip(seed.boardingStopId, seed.destinationStopId).find((option) =>
      option.legs.some(
        (leg) =>
          leg.type === "ride" &&
          leg.lineaId === seed.lineId &&
          leg.fromStop.id === seed.boardingStopId,
      ),
    ) ?? null;
  return buildBoardingOptions(trip, arrivals);
}

// ─── Baseline congelado (t = 0) ─────────────────────────────────────────────
// Valores MEDIDOS en HEAD (c1c9be6) con la rama viva sobre la flota simulada
// inicializada por `snapshotFleet()`. La 65 (`stop-65-05`, `stop-65-01`,
// `stop-65-09`) DEBE quedar byte-idéntica tras W1/W2′; los 194 (phantom /
// sparse) son el síntoma a corregir y se "flipean" al objetivo.
//
// NOTA DE FIDELIDAD: la línea base real difiere de los valores estimados en el
// brief SDD. Motivos verificados:
//   - `stop-65-05`/`stop-65-01` son paradas 65+60 → hasta 6 filas (3 por línea).
//   - `stop-194-once` sólo es servida por `line-194` y cada línea aporta como
//     máximo 3 (`slice(0,3)`), por lo que un "5× En parada" es inalcanzable.
// Se congela lo medido, que es determinista y reproducible.

interface FrozenStop {
  stopId: string;
  minutos: number[];
  labels: string[];
  note: string;
}

const FROZEN_BASELINE: FrozenStop[] = [
  {
    stopId: "stop-65-05",
    minutos: [3, 5, 8, 14, 35, 58],
    labels: ["3 min", "5 min", "8 min", "14 min", "35 min", "58 min"],
    note: "congelado · 3×line-65 + 3×line-60; W1/W2′ no deben cambiarlo",
  },
  {
    stopId: "stop-65-01",
    minutos: [0, 0, 3, 6, 22, 44],
    labels: ["En parada", "En parada", "3 min", "6 min", "22 min", "44 min"],
    note: "congelado · W1/W2′ no deben cambiarlo",
  },
  {
    stopId: "stop-65-09",
    minutos: [0, 0, 3, 6, 22, 44],
    labels: ["En parada", "En parada", "3 min", "6 min", "22 min", "44 min"],
    note: "congelado · W1/W2′ no deben cambiarlo",
  },
  {
    stopId: "stop-194-escobar-estacion",
    minutos: [19, 21, 23],
    labels: ["19 min", "21 min", "23 min"],
    note: "W2′ debe escalonar/completar a >= 3",
  },
  {
    stopId: "stop-194-once",
    minutos: [0, 0, 1],
    labels: ["En parada", "En parada", "En parada"],
    note: "ANTES (bug): 3×En parada por proyección sobre una sola traza · W1 lo elimina",
  },
  {
    stopId: "stop-194-zarate-transferencia",
    minutos: [0, 0, 1],
    labels: ["En parada", "En parada", "En parada"],
    note: "ANTES (bug): phantom en el terminal · W1/W2′ lo corrigen",
  },
];

// ─── Reporte ────────────────────────────────────────────────────────────────

let failures = 0;

function fail(message: string): void {
  failures++;
  console.error(`✗ ${message}`);
}

console.log("ETA boarding QA — baseline snapshot (t = 0, determinista)");
console.log(`fleet: ${positions.length} posiciones · líneas: ${ALL_LINE_IDS.join(", ")}`);
console.log("");

console.log("── Paradas de referencia (rama viva de getLlegadas) ──────────");
for (const stopId of REFERENCE_STOPS) {
  const live = liveArrivals(stopId);
  const liveOk = livePathExercised(stopId);
  console.log(`${stopId}  [${liveOk ? "live" : "FALLBACK?"}]`);
  if (live.length === 0) {
    console.log("  (sin llegadas)");
  } else {
    for (const a of live) console.log(`  ${formatArrival(a)}`);
  }
  if (!liveOk) fail(`${stopId}: la rama viva no se ejerció (posible fallback sin GPS)`);
}
console.log("");

console.log("── Semillas Historial: top-3 que mostraría el mapa ──────────");
for (const seed of SEEDS) {
  const rows = seedBoardingRows(seed);
  console.log(`${seed.id}  parada=${seed.boardingStopId} línea=${seed.lineId}`);
  if (rows.length === 0) {
    console.log("  (sin opciones)");
  } else {
    rows.forEach((row, idx) => {
      console.log(
        `  #${idx + 1} ${row.interno}[${ramalTag(row.lineaId, row.interno)}] = ${row.displayLabel} (${row.kind})`,
      );
    });
  }
}
console.log("");

// ─── Aserciones del baseline (modo --expect) ────────────────────────────────

if (EXPECT) {
  console.log("── Aserciones (--expect) ────────────────────────────────────");
  for (const frozen of FROZEN_BASELINE) {
    const live = liveArrivals(frozen.stopId);
    const minutos = live.map((a) => a.minutos);
    const labels = live.map(labelOf);
    const okMin = JSON.stringify(minutos) === JSON.stringify(frozen.minutos);
    const okLbl = JSON.stringify(labels) === JSON.stringify(frozen.labels);
    if (okMin && okLbl) {
      console.log(`✓ ${frozen.stopId} = ${frozen.labels.join(" | ")} · ${frozen.note}`);
    } else {
      fail(
        `${frozen.stopId}\n     esperado minutos=${JSON.stringify(frozen.minutos)} labels=${JSON.stringify(frozen.labels)}` +
          `\n     obtenido minutos=${JSON.stringify(minutos)} labels=${JSON.stringify(labels)}`,
      );
    }
  }
  console.log("");
}

// ─── Salida ─────────────────────────────────────────────────────────────────

if (EXPECT && failures > 0) {
  console.error(`QA eta-boarding: ${failures} fallo(s)`);
  process.exit(1);
}

console.log(
  EXPECT ? "QA eta-boarding: baseline OK" : "QA eta-boarding: reporte OK (usá --expect para asertar)",
);
