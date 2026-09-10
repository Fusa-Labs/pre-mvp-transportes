/**
 * Mock Data — Colectivos AMBA (Línea Oficial: Línea 65 La Nueva Metropol S.A.)
 * Recorrido oficial Constitución – Barrancas de Belgrano (Circuito completo 36.06 km).
 * 24 unidades activas reales simultáneas con frecuencia pico de 5 minutos.
 */

import type { Line, Stop, Alert } from '@/lib/data-service';
import snappedRoutes from '@/data/routes.json';

const ALL_SNAPPED = snappedRoutes as unknown as Record<string, [number, number][]>;

// ─── Rutas (Geometría oficial Metropol KML / Ida y Vuelta calibrados) ───
export const MOCK_ROUTES: Record<string, [number, number][]> = {
  'line-65': ALL_SNAPPED['line-65'] ?? [],
  'line-65-ida': ALL_SNAPPED['line-65-ida'] ?? [],
  'line-65-vuelta': ALL_SNAPPED['line-65-vuelta'] ?? [],
};

// ─── Colores por Dirección (Celeste para Ida, Rojo para Vuelta) ────────
export const ROUTE_COLORS_BY_DIRECTION = {
  ida: {
    color: '#0EA5E9', // Celeste
    colorLight: '#7DD3FC',
  },
  vuelta: {
    color: '#EF4444', // Rojo
    colorLight: '#FCA5A5',
  },
};

// ─── Línea Oficial Metropol ───────────────────────────────────────────
export const MOCK_LINES: Line[] = [
  {
    id: 'line-65',
    name: 'Barrancas de Belgrano – Plaza Constitución',
    shortName: '65',
    color: '#0EA5E9', // Color celeste primario (ida)
    direction: 'Barrancas de Belgrano – Plaza Constitución',
    frequency: 5,
  },
];

// ─── 18 Paradas Oficiales Calibradas a 0.0m de la Traza ───────────────
export const MOCK_STOPS: Stop[] = [
  {
    id: 'stop-65-01',
    name: 'Plaza Constitución (Cabecera Sur)',
    lat: -34.628772,
    lng: -58.379175,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-02',
    name: 'Hospital Garrahan',
    lat: -34.634219,
    lng: -58.390904,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-03',
    name: 'Hospital Muñiz / Parque Ameghino',
    lat: -34.637114,
    lng: -58.405632,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-04',
    name: 'Hospital de Quemados',
    lat: -34.618884,
    lng: -58.42843,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-05',
    name: 'Parque Centenario / Hospital Durand',
    lat: -34.604463,
    lng: -58.434711,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-06',
    name: 'Hospital Naval',
    lat: -34.604176,
    lng: -58.436704,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-07',
    name: 'Av. Corrientes y Scalabrini Ortiz',
    lat: -34.599858,
    lng: -58.440775,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-08',
    name: 'Chacarita / Estación Federico Lacroze',
    lat: -34.587089,
    lng: -58.454842,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-09',
    name: 'Barrancas de Belgrano (Cabecera Norte)',
    lat: -34.558754,
    lng: -58.449503,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-10',
    name: 'Barrancas de Belgrano (Salida Vuelta)',
    lat: -34.558394,
    lng: -58.450131,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-11',
    name: 'Av. Cabildo y Juramento',
    lat: -34.561988,
    lng: -58.456644,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-12',
    name: 'Av. Cabildo y Olleros',
    lat: -34.564948,
    lng: -58.454296,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-13',
    name: 'Av. Álvarez Thomas y Federico Lacroze',
    lat: -34.58736,
    lng: -58.455159,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-14',
    name: 'Av. Corrientes y Dorrego',
    lat: -34.588978,
    lng: -58.450409,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-15',
    name: 'Hospital Italiano',
    lat: -34.61544,
    lng: -58.43004,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-16',
    name: 'Boedo / Castro Barros',
    lat: -34.627123,
    lng: -58.42676,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-17',
    name: 'Hospital Británico / Caseros',
    lat: -34.635402,
    lng: -58.396035,
    lineIds: ['line-65'],
  },
  {
    id: 'stop-65-18',
    name: 'Plaza Constitución (Llegada Vuelta)',
    lat: -34.628655,
    lng: -58.378738,
    lineIds: ['line-65'],
  },
];

// ─── Alertas Oficiales ────────────────────────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-65-001',
    lineId: 'line-65',
    type: 'delay',
    title: 'Operación Normal con Frecuencia de 5 min',
    description: 'Servicio regular La Nueva Metropol S.A. en ambos sentidos (Constitución - Barrancas).',
    severity: 'amber',
    timestamp: Date.now() - 1000 * 60 * 10,
    since: '08:00',
  },
];

// ─── Flota Oficial de 24 Unidades Activas Simultáneas ─────────────────
export const MOCK_UNITS: Record<string, string[]> = {
  'line-65': [
    '18', '20', '25', '28', '34', '39', '42', '45',
    '48', '51', '55', '58', '62', '65', '71', '74',
    '78', '82', '85', '89', '92', '95', '98', '101',
  ],
};

// ─── Secuencia Ordenada de Paradas para RouteTimeline ─────────────────
export const MOCK_LINE_STOPS: Record<string, string[]> = {
  'line-65': [
    'stop-65-01', 'stop-65-02', 'stop-65-03', 'stop-65-04',
    'stop-65-05', 'stop-65-06', 'stop-65-07', 'stop-65-08',
    'stop-65-09', 'stop-65-10', 'stop-65-11', 'stop-65-12',
    'stop-65-13', 'stop-65-14', 'stop-65-15', 'stop-65-16',
    'stop-65-17', 'stop-65-18',
  ],
};
