/**
 * Ubicación de referencia del usuario para toda la app (home + mapas + asistente).
 *
 * Hoy es una fijación SIMULADA (Parque Centenario == stop-65-05): la maqueta
 * todavía no pide permisos de geolocalización.
 *
 * TODO(geo-real): único punto de cambio para conectar navigator.geolocation
 * (getUserLocation pasaría a async con fallback a la simulada si el permiso
 * se niega). Nadie más debería duplicar estas coordenadas.
 */

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  isSimulated: boolean;
}

export const SIMULATED_USER_LOCATION: UserLocation = {
  lat: -34.604463,
  lng: -58.434711,
  name: 'Parque Centenario',
  isSimulated: true,
};

/** Etiqueta visible para UIs que distinguen el dato simulado del real. */
export const SIMULATED_LOCATION_LABEL = 'Parque Centenario (Ubicación simulada)';

export function getUserLocation(): UserLocation {
  return SIMULATED_USER_LOCATION;
}
