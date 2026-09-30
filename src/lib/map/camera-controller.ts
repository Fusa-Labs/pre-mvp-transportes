import type { VehiclePosition } from '@/lib/data-service';

export type CameraMode =
  | 'overview'
  | 'free'
  | 'follow-user'
  | 'follow-vehicle'
  | 'follow-trip'
  | 'navigation-vehicle'
  | 'step-focus';

export interface VehicleCameraFrame {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

const METERS_PER_DEGREE_LAT = 111_320;

export function pointAhead(
  position: Pick<VehiclePosition, 'lat' | 'lng' | 'heading'>,
  meters: number,
): [number, number] {
  const radians = (position.heading * Math.PI) / 180;
  const latDelta = (Math.cos(radians) * meters) / METERS_PER_DEGREE_LAT;
  const lngScale = METERS_PER_DEGREE_LAT * Math.cos((position.lat * Math.PI) / 180);
  const lngDelta = (Math.sin(radians) * meters) / lngScale;
  return [position.lng + lngDelta, position.lat + latDelta];
}

/** Lo mínimo que la cámara necesita de un vehículo en vivo */
export type VehicleCameraInput = Pick<VehiclePosition, 'lat' | 'lng' | 'heading' | 'speed'>;

export function vehicleCameraFrame(
  position: VehicleCameraInput,
  mode: Extract<CameraMode, 'follow-vehicle' | 'navigation-vehicle'>,
  is3D = false,
): VehicleCameraFrame {
  if (mode === 'follow-vehicle' && !is3D) {
    // Seguimiento 2D clásico: norte arriba, sin pitch
    return {
      center: pointAhead(position, 12),
      zoom: 15.2,
      pitch: 0,
      bearing: 0,
    };
  }

  // Vista 3D al doble de distancia (~100-110 metros, zoom 17.1, pitch 52°):
  // encuadre amplio de la calle con el colectivo centrado mirando en la dirección del recorrido
  return {
    center: pointAhead(position, 12),
    zoom: 17.1,
    pitch: 52,
    bearing: position.heading,
  };
}

/**
 * Rumbo (0-360° horario desde el norte) de la cuerda `coords[0] -> coords[last]`.
 * Se usa para inclinar la cámara 3D en la dirección de avance de un segmento.
 * `coords` usa el orden [lng, lat] (convención GeoJSON de este proyecto).
 * Devuelve 0 con menos de 2 puntos o geometría degenerada.
 */
export function segmentBearing(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  const [startLng, startLat] = coords[0];
  const [endLng, endLat] = coords[coords.length - 1];
  const midLatRad = ((startLat + endLat) / 2) * (Math.PI / 180);
  const dLat = endLat - startLat;
  const dLng = (endLng - startLng) * Math.cos(midLatRad);
  if (dLat === 0 && dLng === 0) return 0;
  const bearing = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  return (bearing + 360) % 360;
}
