/**
 * geocoder — búsqueda LOCAL de lugares para el planificador.
 *
 * El spec Uber pedía Google Places/Mapbox; RutaBA busca sobre su propio
 * dataset (paradas mock + POIs del snapshot OSM + guardados + recientes)
 * porque las llamadas runtime a OSM están prohibidas por el plan. La
 * firma está pensada como adapter: cambiar el origen de datos no toca UI.
 *
 * Módulo PURO y testeable: sin fetch, sin DOM.
 */

import type { LocationItem, SavedPlace } from './types';

export interface GeoPlaceSource {
  stops: ReadonlyArray<{ id: string; name: string; lat: number; lng: number }>;
  pois: ReadonlyArray<{ type: string; name?: string; lat: number; lng: number }>;
  saved: ReadonlyArray<SavedPlace>;
  recent: ReadonlyArray<LocationItem>;
}

/** Minúsculas sin acentos: "Constitución" → "constitucion". */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Haversine en km (misma fórmula que el mapa, en otra unidad). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface NearbyStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/**
 * Parada más cercana a un punto (haversine). La usa el planner para el
 * pulso del mapa: "tu parada" al elegir destino. null si no hay paradas.
 */
export function nearestStop(
  point: { lat: number; lng: number },
  stops: ReadonlyArray<NearbyStop>,
): { stop: NearbyStop; distanceKm: number } | null {
  let best: { stop: NearbyStop; distanceKm: number } | null = null;
  for (const stop of stops) {
    const distance = distanceKm(point, stop);
    if (best === null || distance < best.distanceKm) best = { stop, distanceKm: distance };
  }
  return best;
}

const POI_LABELS: Record<string, string> = {
  place_of_worship: 'Iglesia',
  supermarket: 'Supermercado',
  station: 'Estación',
  hospital: 'Hospital',
  school: 'Escuela',
  bank: 'Banco',
  pharmacy: 'Farmacia',
  police: 'Comisaría',
  townhall: 'Municipalidad',
  library: 'Biblioteca',
};

function withDistance(
  item: LocationItem,
  userLoc: { lat: number; lng: number } | null,
): LocationItem {
  if (!userLoc) return item;
  return { ...item, distanceKm: Math.round(distanceKm(userLoc, item.coordinates) * 10) / 10 };
}

/**
 * Busca lugares por query. Con query vacía devuelve el "home" del listado:
 * recientes + guardados + 3 paradas cercanas. Ranking: prefijo > incluye;
 * guardados y recientes primero; dedup por título normalizado.
 */
export function searchPlaces(
  query: string,
  sources: GeoPlaceSource,
  userLoc: { lat: number; lng: number } | null,
  limit = 8,
): LocationItem[] {
  const q = normalizeText(query.trim());
  const out: LocationItem[] = [];
  const seen = new Set<string>();
  const push = (item: LocationItem) => {
    const key = normalizeText(item.title);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(withDistance(item, userLoc));
  };

  for (const place of sources.saved) {
    if (q && !normalizeText(place.title).includes(q)) continue;
    push({
      id: place.id,
      title: place.title,
      subtitle: place.subtitle,
      coordinates: place.coordinates,
      type: place.kind === 'home' ? 'home' : place.kind === 'work' ? 'work' : 'saved',
    });
  }

  if (!q) {
    for (const item of sources.recent) push({ ...item, type: 'recent' });
  } else {
    for (const item of sources.recent) {
      if (normalizeText(item.title).includes(q)) push({ ...item, type: 'recent' });
    }
  }

  const scored: Array<{ item: LocationItem; rank: number }> = [];
  for (const stop of sources.stops) {
    const n = normalizeText(stop.name);
    if (q && !n.includes(q)) continue;
    const coords = { lat: stop.lat, lng: stop.lng };
    // Sin query el ranking es por cercanía (paradas cercanas primero);
    // con query, prefijo > contiene.
    const rank = q
      ? n.startsWith(q) ? 0 : 1
      : userLoc
        ? distanceKm(userLoc, coords)
        : 1;
    scored.push({
      item: {
        id: `stop-${stop.id}`,
        title: stop.name,
        subtitle: 'Parada de colectivo',
        coordinates: coords,
        type: 'stop',
      },
      rank,
    });
  }
  for (const poi of sources.pois) {
    if (!poi.name) continue;
    const n = normalizeText(poi.name);
    if (q && !n.includes(q)) continue;
    const coords = { lat: poi.lat, lng: poi.lng };
    const rank = q
      ? n.startsWith(q) ? 0 : 1
      : userLoc
        ? distanceKm(userLoc, coords)
        : 1;
    scored.push({
      item: {
        id: `poi-${poi.type}-${poi.name}`,
        title: poi.name,
        subtitle: POI_LABELS[poi.type] ?? 'Punto de interés',
        coordinates: coords,
        type: 'poi',
      },
      rank,
    });
  }
  scored.sort((a, b) => a.rank - b.rank || a.item.title.localeCompare(b.item.title));
  for (const { item } of scored) push(item);

  return out.slice(0, limit);
}
