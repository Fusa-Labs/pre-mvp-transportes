/**
 * Mock Data — Colectivos AMBA (Maqueta Fase 1)
 *
 * Datos ficticios hasta que el NDA libere las líneas reales.
 * Mantener coherencia TOTAL entre pantallas.
 *
 * Líneas: 200, 210, 215, 220, 225
 * Paradas canónicas: "Av. Corrientes y Belgrano", "Diagonal Norte y Maipú",
 *   "Pje. Castelli y Av. Cabildo", "Terminal Central"
 */

import type { Line, Stop, Alert } from '@/lib/data-service';
import { tokens } from '@/lib/theme';
import snappedRoutes from '@/data/routes.json';

// ─── Rutas ─────────────────────────────────────────────────
// Geometría REAL calle por calle: los waypoints manuales se ajustaron
// con OSRM (scripts/fix-routes-osrm.mjs) y cada línea es una vuelta
// redonda cerrada. Regenerar con `npm run routes:fix` si cambia un waypoint.
export const MOCK_ROUTES: Record<string, [number, number][]> =
  snappedRoutes as unknown as Record<string, [number, number][]>;

// ─── Líneas ────────────────────────────────────────────────

export const MOCK_LINES: Line[] = [
  {
    id: 'line-200',
    name: 'Centro – Sur',
    shortName: '200',
    color: tokens.fleetColors[0],
    direction: 'Sur',
    frequency: 15,
  },
  {
    id: 'line-210',
    name: 'Centro – Oeste',
    shortName: '210',
    color: tokens.fleetColors[1],
    direction: 'Oeste',
    frequency: 10,
  },
  {
    id: 'line-215',
    name: 'Zona Norte',
    shortName: '215',
    color: tokens.fleetColors[2],
    direction: 'Norte',
    frequency: 20,
  },
  {
    id: 'line-220',
    name: 'Costanera',
    shortName: '220',
    color: tokens.fleetColors[3],
    direction: 'Costanera',
    frequency: 25,
  },
  {
    id: 'line-225',
    name: 'Aeropuerto – Centro',
    shortName: '225',
    color: tokens.fleetColors[4],
    direction: 'Centro',
    frequency: 30,
  },
];

// ─── Paradas ───────────────────────────────────────────────

export const MOCK_STOPS: Stop[] = [
  // Paradas canónicas (las 4 del prompt)
  {
    id: 'stop-001',
    name: 'Av. Corrientes y Belgrano',
    lat: -34.6037,
    lng: -58.3816,
    lineIds: ['line-200', 'line-210'],
  },
  {
    id: 'stop-002',
    name: 'Diagonal Norte y Maipú',
    lat: -34.6042,
    lng: -58.3803,
    lineIds: ['line-200', 'line-215'],
  },
  {
    id: 'stop-003',
    name: 'Pje. Castelli y Av. Cabildo',
    lat: -34.5632,
    lng: -58.4597,
    lineIds: ['line-215'],
  },
  {
    id: 'stop-004',
    name: 'Terminal Central',
    lat: -34.6267,
    lng: -58.3816,
    lineIds: ['line-200', 'line-210', 'line-225'],
  },
  // Paradas adicionales
  {
    id: 'stop-005',
    name: 'Av. de Mayo y Perú',
    lat: -34.6089,
    lng: -58.3793,
    lineIds: ['line-200', 'line-225'],
  },
  {
    id: 'stop-006',
    name: 'Plaza de Mayo',
    lat: -34.6033,
    lng: -58.3817,
    lineIds: ['line-200', 'line-210'],
  },
  {
    id: 'stop-007',
    name: 'Av. Corrientes y Callao',
    lat: -34.6033,
    lng: -58.3907,
    lineIds: ['line-200', 'line-210'],
  },
  {
    id: 'stop-008',
    name: 'Av. Rivadavia y Once',
    lat: -34.6091,
    lng: -58.4035,
    lineIds: ['line-210'],
  },
  {
    id: 'stop-009',
    name: 'Av. Cabildo y Congreso',
    lat: -34.5583,
    lng: -58.4638,
    lineIds: ['line-215'],
  },
  {
    id: 'stop-010',
    name: 'Av. del Libertador y Sarmiento',
    lat: -34.5437,
    lng: -58.4498,
    lineIds: ['line-215', 'line-220'],
  },
  {
    id: 'stop-011',
    name: 'Costanera Norte y Juana Manilio',
    lat: -34.5363,
    lng: -58.4617,
    lineIds: ['line-220'],
  },
  {
    id: 'stop-012',
    name: 'Puerto Madero y Rosario Vera',
    lat: -34.6205,
    lng: -58.3649,
    lineIds: ['line-220', 'line-225'],
  },
  {
    id: 'stop-013',
    name: 'Autopista Ricchieri y Ezeiza',
    lat: -34.6583,
    lng: -58.4183,
    lineIds: ['line-225'],
  },
  {
    id: 'stop-014',
    name: 'Terminal.ReadLineal',
    lat: -34.6267,
    lng: -58.3780,
    lineIds: ['line-225'],
  },
  {
    id: 'stop-015',
    name: 'Av. San Martín y Perdriel',
    lat: -34.6163,
    lng: -58.3985,
    lineIds: ['line-210'],
  },
  {
    id: 'stop-016',
    name: 'Av. Maipú y Córdoba',
    lat: -34.5988,
    lng: -58.3792,
    lineIds: ['line-210'],
  },
];

// ─── Alertas ───────────────────────────────────────────────

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    lineId: 'line-200',
    type: 'delay',
    title: 'Retraso estimado',
    description:
      'Obra en Av. 9 de Julio. Retraso de 10 min en sentido Centro.',
    severity: 'amber',
    timestamp: Date.now() - 1000 * 60 * 30,
    since: '14:10',
  },
  {
    id: 'alert-004',
    lineId: 'line-210',
    type: 'delay',
    title: 'Retraso estimado',
    description:
      'Obra en Av. 9 de Julio. Retraso de 10 min en sentido Oeste.',
    severity: 'amber',
    timestamp: Date.now() - 1000 * 60 * 25,
    since: '14:10',
  },
  {
    id: 'alert-002',
    lineId: 'line-225',
    type: 'suspension',
    title: 'Línea suspendida',
    description:
      'Corte en acceso al aeropuerto. Servicio reemplazado por 215.',
    severity: 'red',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    since: '13:05',
  },
  {
    id: 'alert-003',
    lineId: 'line-220',
    type: 'route_change',
    title: 'Cambio de recorrido',
    description:
      'Recorrido alterado por evento en Costanera. Vuelve a la normalidad a las 16:00.',
    severity: 'gray',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    since: '11:00',
  },
  {
    id: 'alert-005',
    lineId: 'line-215',
    type: 'delay',
    status: 'resolved',
    title: 'Servicio normalizado',
    description:
      'Retrasos por corte en Av. Rivadavia durante la mañana. Frecuencias restablecidas.',
    severity: 'gray',
    timestamp: Date.now() - 1000 * 60 * 60 * 4,
    since: '15:40',
  },
];

// ─── Unidades (para el motor GPS simulado) ─────────────────

export const MOCK_UNITS: Record<string, string[]> = {
  'line-200': ['1234', '0871', '2045', '1892'],
  'line-210': ['3012', '3089', '3156'],
  'line-215': ['4501', '4578'],
  'line-220': ['5601', '5678'],
  'line-225': ['6801', '6878', '6945'],
};

// ─── Paradas por línea (ordenadas para timeline) ───────────

export const MOCK_LINE_STOPS: Record<string, string[]> = {
  'line-200': [
    'stop-006',
    'stop-001',
    'stop-002',
    'stop-005',
    'stop-004',
    'stop-007',
  ],
  'line-210': [
    'stop-006',
    'stop-001',
    'stop-007',
    'stop-008',
    'stop-015',
    'stop-016',
  ],
  'line-215': [
    'stop-002',
    'stop-010',
    'stop-009',
    'stop-003',
  ],
  'line-220': [
    'stop-012',
    'stop-011',
    'stop-010',
  ],
  'line-225': [
    'stop-014',
    'stop-012',
    'stop-001',
    'stop-013',
  ],
};
