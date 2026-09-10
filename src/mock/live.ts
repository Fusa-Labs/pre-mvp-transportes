/**
 * Motor de GPS Simulado — Colectivos AMBA
 *
 * Técnicas de las apps reales (Moovit / Transit / Google Maps):
 * - Los vehículos SIEMPRE viajan sobre la polilínea de su ruta
 * - Emite a 1 Hz (frecuencia de feed GTFS-RT); el suavizado a 60fps
 *   lo hace el cliente (MapCanvas interpola entre ticks / dead-reckoning).
 * - Heading = rumbo hacia un punto ADELANTE del vehículo (no el del
 *   segmento actual) → giro suave en curvas en vez de saltos bruscos.
 */

import type { VehiclePosition, Unsubscribe } from '@/lib/data-service';
import { MOCK_ROUTES, MOCK_UNITS, MOCK_STOPS } from './data';

// ─── Configuración ─────────────────────────────────────────

const TICK_INTERVAL_MS = 1000;
export const DWELL_TIME_SECONDS = 20; // 20s fijos en cada parada (regla de negocio estricta)
export const SCHEDULED_CYCLE_SECONDS = 1800; // 30 min por circuito según horarios oficiales
const DELAYED_UNIT_SPEED_KMH = 8;
const HEADING_AHEAD_M = 12;

// ─── Utilidades geográficas ────────────────────────────────

function distanceMeters(a: [number, number], b: [number, number]): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = (lat2 - lat1) * 111320;
  const dLng = (lng2 - lng1) * 111320 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Rumbo (0-360°, 0=norte) de un punto hacia otro */
function bearingDeg(from: [number, number], to: [number, number]): number {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Precálculo de rutas ───────────────────────────────────

interface RouteCache {
  points: [number, number][];
  segmentBearings: number[];
  cumLength: number[];
  totalLength: number;
}

function buildRouteCache(route: [number, number][]): RouteCache {
  const cumLength: number[] = [0];
  let total = 0;

  // Calculamos los segmentos contiguos reales de la polilínea (N-1 segmentos para N puntos).
  // Nunca conectamos el último punto con el primero si la ruta es lineal, evitando
  // el bug del salto diagonal atravesando la ciudad.
  for (let i = 0; i < route.length - 1; i++) {
    total += distanceMeters(route[i], route[i + 1]);
    cumLength.push(total);
  }

  return { points: route, segmentBearings: [], cumLength, totalLength: total };
}

function positionAtDistance(
  cache: RouteCache,
  dist: number,
): { lng: number; lat: number } {
  const { points, cumLength, totalLength } = cache;
  if (totalLength <= 0 || points.length === 0) {
    return { lng: -58.3816, lat: -34.6037 };
  }
  const d = ((dist % totalLength) + totalLength) % totalLength;

  let segIdx = 0;
  for (let i = 0; i < cumLength.length - 1; i++) {
    if (d >= cumLength[i] && d < cumLength[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const segStart = cumLength[segIdx] ?? 0;
  const segLen = (cumLength[segIdx + 1] ?? segStart) - segStart;
  const t = segLen > 0 ? (d - segStart) / segLen : 0;

  const from = points[segIdx] ?? points[0]!;
  const to = points[segIdx + 1] ?? from;

  return { lng: lerp(from[0], to[0], t), lat: lerp(from[1], to[1], t) };
}

/**
 * Heading suave: rumbo hacia un punto ~12m adelante en la ruta.
 */
function headingAtDistance(cache: RouteCache, dist: number): number {
  const from = positionAtDistance(cache, dist);
  const ahead = positionAtDistance(cache, dist + HEADING_AHEAD_M);
  return bearingDeg([from.lng, from.lat], [ahead.lng, ahead.lat]);
}

// ─── Estado por vehículo & Dwell Time ──────────────────────

export interface LineStopOnRoute {
  id: string;
  name: string;
  lat: number;
  lng: number;
  alongM: number;
}

type MovementState = 'IN_TRANSIT' | 'DWELLING';

interface VehicleState {
  lineId: string;
  unitId: string;
  routeCache: RouteCache;
  distanceTraveled: number; // metros
  speed: number; // km/h
  lat: number;
  lng: number;
  heading: number;
  prevLat: number;
  prevLng: number;
  prevHeading: number;
  movementState: MovementState;
  dwellRemainingSeconds: number; // Temporizador de 20s
  currentStopIndex: number;
  targetStopIndex: number;
  transitSpeedKmh: number;
  currentStopId: string | null;
}

const stopsByLineCache: Record<string, LineStopOnRoute[]> = {};

function projectStopOnRoute(routeCache: RouteCache, stop: { lat: number; lng: number }): number {
  const { points, cumLength } = routeCache;
  let bestDist = Infinity;
  let bestAlongM = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const segLen = (cumLength[i + 1] ?? 0) - (cumLength[i] ?? 0);
    if (segLen <= 0) continue;

    const dLat = b[1] - a[1];
    const dLng = b[0] - a[0];
    const pLat = stop.lat - a[1];
    const pLng = stop.lng - a[0];

    const dot = pLng * dLng + pLat * dLat;
    const lenSq = dLng * dLng + dLat * dLat;
    const t = lenSq > 0 ? Math.max(0, Math.min(1, dot / lenSq)) : 0;

    const projLng = a[0] + dLng * t;
    const projLat = a[1] + dLat * t;
    const d = distanceMeters([stop.lng, stop.lat], [projLng, projLat]);

    if (d < bestDist) {
      bestDist = d;
      bestAlongM = (cumLength[i] ?? 0) + segLen * t;
    }
  }

  return bestAlongM;
}

function getLineStopsOnRoute(lineId: string, routeCache: RouteCache): LineStopOnRoute[] {
  if (stopsByLineCache[lineId]) return stopsByLineCache[lineId]!;

  const matched = MOCK_STOPS.filter((s) => s.lineIds.includes(lineId));
  const projected: LineStopOnRoute[] = matched.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    alongM: projectStopOnRoute(routeCache, s),
  }));

  // Ordenar secuencialmente a lo largo de la traza OSRM
  projected.sort((a, b) => a.alongM - b.alongM);
  stopsByLineCache[lineId] = projected;
  return projected;
}

function computeTransitSpeed(routeCache: RouteCache, stopsCount: number, speedOverride?: number): number {
  if (speedOverride !== undefined) return speedOverride;
  const totalLength = routeCache.totalLength;
  const totalDwellSec = Math.max(0, stopsCount * DWELL_TIME_SECONDS);
  const totalTransitSec = Math.max(60, SCHEDULED_CYCLE_SECONDS - totalDwellSec);
  // v (km/h) = (distancia / tiempo_segundos) * 3.6
  const baseKmh = (totalLength / totalTransitSec) * 3.6;
  return Math.round(baseKmh * 10) / 10;
}

function createVehicle(
  lineId: string,
  unitId: string,
  routeCache: RouteCache,
  stops: LineStopOnRoute[],
  speedOverride?: number,
  distOverride?: number,
): VehicleState {
  const transitSpeedKmh = computeTransitSpeed(routeCache, stops.length, speedOverride);
  const startDist = distOverride ?? Math.random() * (routeCache.totalLength || 1000);
  const totalLength = routeCache.totalLength || 1000;
  const normalizedDist = ((startDist % totalLength) + totalLength) % totalLength;

  // Encontrar la próxima parada en el recorrido
  let targetIdx = 0;
  for (let i = 0; i < stops.length; i++) {
    if (stops[i]!.alongM >= normalizedDist) {
      targetIdx = i;
      break;
    }
  }

  const prevIdx = (targetIdx - 1 + stops.length) % stops.length;
  const targetStop = stops[targetIdx];
  const isRightAtStop = targetStop && Math.abs(normalizedDist - targetStop.alongM) <= 3;

  const pos = positionAtDistance(routeCache, normalizedDist);
  const heading = headingAtDistance(routeCache, normalizedDist);

  return {
    lineId,
    unitId,
    routeCache,
    distanceTraveled: normalizedDist,
    speed: isRightAtStop ? 0 : transitSpeedKmh,
    lat: pos.lat,
    lng: pos.lng,
    heading,
    prevLat: pos.lat,
    prevLng: pos.lng,
    prevHeading: heading,
    movementState: isRightAtStop ? 'DWELLING' : 'IN_TRANSIT',
    dwellRemainingSeconds: isRightAtStop ? DWELL_TIME_SECONDS : 0,
    currentStopIndex: isRightAtStop ? targetIdx : prevIdx,
    targetStopIndex: isRightAtStop ? (targetIdx + 1) % stops.length : targetIdx,
    transitSpeedKmh,
    currentStopId: isRightAtStop && targetStop ? targetStop.id : null,
  };
}

function advanceVehicle(state: VehicleState, stops: LineStopOnRoute[]): VehicleState {
  const totalLength = state.routeCache.totalLength;
  if (totalLength <= 0 || stops.length === 0) {
    return state;
  }

  // 1. Estado DWELLING: Colectivo detenido en parada por 20 segundos (ascenso/descenso)
  if (state.movementState === 'DWELLING') {
    const remainingDwell = state.dwellRemainingSeconds - 1;

    if (remainingDwell <= 0) {
      // Reanuda la marcha hacia la siguiente parada
      return {
        ...state,
        movementState: 'IN_TRANSIT',
        dwellRemainingSeconds: 0,
        speed: state.transitSpeedKmh,
        currentStopId: null,
      };
    }

    // Permanece quieto en la parada con velocidad 0 km/h
    return {
      ...state,
      dwellRemainingSeconds: remainingDwell,
      speed: 0,
      prevLat: state.lat,
      prevLng: state.lng,
      prevHeading: state.heading,
    };
  }

  // 2. Estado IN_TRANSIT: Viaje hacia la siguiente parada
  const targetStop = stops[state.targetStopIndex] ?? stops[0]!;
  const distToTarget = ((targetStop.alongM - state.distanceTraveled) % totalLength + totalLength) % totalLength;
  const metersThisTick = state.speed / 3.6;

  // Si en este tick alcanza o sobrepasa la parada
  if (distToTarget <= metersThisTick || distToTarget <= 3) {
    const stopPos = positionAtDistance(state.routeCache, targetStop.alongM);
    const stopHeading = headingAtDistance(state.routeCache, targetStop.alongM);

    return {
      ...state,
      distanceTraveled: targetStop.alongM,
      movementState: 'DWELLING',
      dwellRemainingSeconds: DWELL_TIME_SECONDS, // Exactamente 20 segundos fijos
      currentStopIndex: state.targetStopIndex,
      targetStopIndex: (state.targetStopIndex + 1) % stops.length,
      currentStopId: targetStop.id,
      speed: 0,
      lat: stopPos.lat,
      lng: stopPos.lng,
      heading: stopHeading,
      prevLat: state.lat,
      prevLng: state.lng,
      prevHeading: state.heading,
    };
  }

  // Avanza normalmente a lo largo de la traza OSRM
  const newDist = (state.distanceTraveled + metersThisTick) % totalLength;
  const pos = positionAtDistance(state.routeCache, newDist);
  const heading = headingAtDistance(state.routeCache, newDist);

  return {
    ...state,
    distanceTraveled: newDist,
    prevLat: state.lat,
    prevLng: state.lng,
    prevHeading: state.heading,
    lat: pos.lat,
    lng: pos.lng,
    heading,
    speed: state.transitSpeedKmh,
    currentStopId: null,
  };
}

// ─── API pública ───────────────────────────────────────────

const vehicles: VehicleState[] = [];
let tickIntervalId: ReturnType<typeof setInterval> | null = null;
let subscribers: ((positions: VehiclePosition[]) => void)[] = [];

function initializeVehicles(): void {
  vehicles.length = 0;

  for (const [lineId, unitIds] of Object.entries(MOCK_UNITS)) {
    const route = MOCK_ROUTES[lineId];
    if (!route || route.length < 2) continue;

    const routeCache = buildRouteCache(route);
    const stops = getLineStopsOnRoute(lineId, routeCache);
    const count = unitIds.length;

    unitIds.forEach((unitId, idx) => {
      const isDelayed = unitId === '1234' && lineId === 'line-210';
      const speed = isDelayed ? DELAYED_UNIT_SPEED_KMH : undefined;
      // Espaciado equitativo a lo largo de la traza para cadencia real
      const spacedDist = (idx / Math.max(1, count)) * routeCache.totalLength;
      vehicles.push(createVehicle(lineId, unitId, routeCache, stops, speed, spacedDist));
    });
  }
}

function tick(): void {
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i]!;
    const stops = stopsByLineCache[v.lineId] || [];
    vehicles[i] = advanceVehicle(v, stops);
  }

  const positions: VehiclePosition[] = vehicles.map((v) => ({
    lineId: v.lineId,
    unitId: v.unitId,
    lat: v.lat,
    lng: v.lng,
    heading: v.heading,
    speed: v.speed,
    timestamp: Date.now(),
    isDwelling: v.movementState === 'DWELLING',
    dwellRemainingSeconds: v.dwellRemainingSeconds,
    currentStopId: v.currentStopId,
  }));

  for (const cb of subscribers) {
    cb(positions);
  }
}

/**
 * Suscribirse a posiciones de vehículos (feed 1 Hz).
 * Retorna función para desuscribirse.
 */
export function subscribeToPositions(
  lineIds: string[],
  cb: (positions: VehiclePosition[]) => void,
): Unsubscribe {
  if (subscribers.length === 0) {
    initializeVehicles();
    tickIntervalId = setInterval(tick, TICK_INTERVAL_MS);
    // Primer tick inmediato
    tick();
  }

  const filteredCb = (positions: VehiclePosition[]) => {
    cb(positions.filter((p) => lineIds.includes(p.lineId)));
  };

  subscribers.push(filteredCb);

  return () => {
    subscribers = subscribers.filter((s) => s !== filteredCb);
    if (subscribers.length === 0) {
      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
    }
  };
}

export function getCurrentPositions(): VehiclePosition[] {
  return vehicles.map((v) => ({
    lineId: v.lineId,
    unitId: v.unitId,
    lat: v.lat,
    lng: v.lng,
    heading: v.heading,
    speed: v.speed,
    timestamp: Date.now(),
  }));
}
