/**
 * Mock Data — Colectivos AMBA (Línea Piloto: Línea 200 Centro - Sur)
 * Geometría de alta resolución calibrada calle por calle (OSRM).
 */

import type { Line, Stop, Alert } from '@/lib/data-service';
import snappedRoutes from '@/data/routes.json';

const ALL_SNAPPED = snappedRoutes as unknown as Record<string, [number, number][]>;

// ─── Rutas (Geometría OSRM de alta resolución - 375 vértices) ─
export const MOCK_ROUTES: Record<string, [number, number][]> = {
  'line-200': ALL_SNAPPED['line-200'] ?? [],
};

// ─── Línea Piloto Aislada ────────────────────────────────────
export const MOCK_LINES: Line[] = [
  {
    id: 'line-200',
    name: 'Centro – Sur',
    shortName: '200',
    color: '#1D4ED8',
    direction: 'Circuito Centro - Sur',
    frequency: 15,
  },
];

// ─── Paradas Calibradas y Alineadas al Eje de la Calzada ─────
// Coordenadas con distancia = 0.0m respecto a la traza OSRM y secuencia monótona
export const MOCK_STOPS: Stop[] = [
  {
    id: 'stop-006',
    name: 'Plaza de la República (Obelisco)',
    lat: -34.603304,
    lng: -58.38195,
    lineIds: ['line-200'],
  },
  {
    id: 'stop-002',
    name: 'Diagonal Norte y Florida',
    lat: -34.604846,
    lng: -58.379766,
    lineIds: ['line-200'],
  },
  {
    id: 'stop-001',
    name: 'Av. Corrientes y Suipacha',
    lat: -34.606098,
    lng: -58.381238,
    lineIds: ['line-200'],
  },
  {
    id: 'stop-005',
    name: 'Av. de Mayo y Perú',
    lat: -34.608872,
    lng: -58.378957,
    lineIds: ['line-200'],
  },
  {
    id: 'stop-004',
    name: 'Metrobús 9 de Julio y Belgrano',
    lat: -34.611846,
    lng: -58.380944,
    lineIds: ['line-200'],
  },
  {
    id: 'stop-007',
    name: 'Av. 9 de Julio e Independencia',
    lat: -34.613119,
    lng: -58.381747,
    lineIds: ['line-200'],
  },
];

// ─── Alertas ───────────────────────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    lineId: 'line-200',
    type: 'delay',
    title: 'Retraso estimado',
    description: 'Tránsito intenso en Av. 9 de Julio. Demoras de 8 min en sentido Centro.',
    severity: 'amber',
    timestamp: Date.now() - 1000 * 60 * 15,
    since: '14:10',
  },
];

// ─── Unidades (Flota de Línea 200) ──────────────────────────
export const MOCK_UNITS: Record<string, string[]> = {
  'line-200': ['1234', '0871', '2045', '1892'],
};

// ─── Secuencia Ordenada de Paradas para RouteTimeline ───────
export const MOCK_LINE_STOPS: Record<string, string[]> = {
  'line-200': ['stop-006', 'stop-002', 'stop-001', 'stop-005', 'stop-004', 'stop-007'],
};
