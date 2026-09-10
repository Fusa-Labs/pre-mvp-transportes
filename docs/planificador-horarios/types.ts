/**
 * Tipos del planificador de viajes (adaptación del spec Uber a RutaBA).
 * MVP 100% cliente: sin backend, sin server actions — el estado del
 * viaje es local y los lugares se persisten en localStorage.
 */

export interface LocationItem {
  id: string;
  title: string;
  /** Dirección completa / subtítulo descriptivo */
  subtitle: string;
  distanceKm?: number;
  coordinates: { lat: number; lng: number };
  type:
    | 'recent'
    | 'saved'
    | 'search_result'
    | 'map_picker'
    | 'stop'
    | 'poi'
    | 'home'
    | 'work';
}

export type SavedKind = 'home' | 'work' | 'saved';

export interface SavedPlace {
  id: string;
  title: string;
  subtitle: string;
  coordinates: { lat: number; lng: number };
  kind: SavedKind;
  addedAt: number;
}

export interface TripPlannerState {
  origin: LocationItem | null;
  destination: LocationItem | null;
  waypoints: LocationItem[];
  /** 'now' o ISO string */
  pickupTime: 'now' | string;
}

/** Línea candidata para cubrir un viaje: score = peor extremo (m). */
export interface TripMatch {
  lineId: string;
  scoreM: number;
}
