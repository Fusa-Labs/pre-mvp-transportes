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
import { MOCK_ROUTES, MOCK_UNITS } from './data';

// ─── Configuración ─────────────────────────────────────────

const TICK_INTERVAL_MS = 1000;
const SPEED_BASE_KMH = 11;
const SPEED_VARIANCE_KMH = 7;
const DELAYED_UNIT_SPEED_KMH = 5;
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

  for (let i = 0; i < route.length; i++) {
    const next = (i + 1) % route.length;
    total += distanceMeters(route[i], route[next]);
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
  for (let i = 0; i < points.length; i++) {
    if (d >= cumLength[i] && d < cumLength[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const segStart = cumLength[segIdx] ?? 0;
  const segLen = (cumLength[segIdx + 1] ?? segStart) - segStart;
  const t = segLen > 0 ? (d - segStart) / segLen : 0;

  const from = points[segIdx] ?? points[0]!;
  const to = points[(segIdx + 1) % points.length] ?? from;

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

// ─── Estado por vehículo ───────────────────────────────────

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
}

function createVehicle(
  lineId: string,
  unitId: string,
  routeCache: RouteCache,
  speedOverride?: number,
): VehicleState {
  const speed = speedOverride ?? SPEED_BASE_KMH + Math.random() * SPEED_VARIANCE_KMH;
  const startDist = Math.random() * (routeCache.totalLength || 1000);
  const pos = positionAtDistance(routeCache, startDist);
  const heading = headingAtDistance(routeCache, startDist);

  return {
    lineId,
    unitId,
    routeCache,
    distanceTraveled: startDist,
    speed,
    lat: pos.lat,
    lng: pos.lng,
    heading,
    prevLat: pos.lat,
    prevLng: pos.lng,
    prevHeading: heading,
  };
}

function advanceVehicle(state: VehicleState): VehicleState {
  // speed km/h → metros por segundo (tick = 1s)
  const metersThisTick = state.speed / 3.6;
  const newDist = state.distanceTraveled + metersThisTick;
  const pos = positionAtDistance(state.routeCache, newDist);

  return {
    ...state,
    distanceTraveled: newDist,
    prevLat: state.lat,
    prevLng: state.lng,
    prevHeading: state.heading,
    lat: pos.lat,
    lng: pos.lng,
    heading: headingAtDistance(state.routeCache, newDist),
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

    for (const unitId of unitIds) {
      const isDelayed = unitId === '1234' && lineId === 'line-210';
      const speed = isDelayed ? DELAYED_UNIT_SPEED_KMH : undefined;
      vehicles.push(createVehicle(lineId, unitId, routeCache, speed));
    }
  }
}

function tick(): void {
  for (let i = 0; i < vehicles.length; i++) {
    vehicles[i] = advanceVehicle(vehicles[i]!);
  }

  const positions: VehiclePosition[] = vehicles.map((v) => ({
    lineId: v.lineId,
    unitId: v.unitId,
    lat: v.lat,
    lng: v.lng,
    heading: v.heading,
    speed: v.speed,
    timestamp: Date.now(),
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
