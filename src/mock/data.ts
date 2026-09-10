/**
 * Mock Data — Colectivos AMBA (Catálogo oficial y Metropol)
 */

import type { Line, Stop, Alert } from '@/lib/data-service';
import { RECORRIDOS_MOCK } from '@/lib/mock/amba-data';

// ─── Rutas (Geometría de alta resolución) ───────────────────
export const MOCK_ROUTES: Record<string, [number, number][]> = {
  'line-200': RECORRIDOS_MOCK.find((r) => r.lineaId === 'line-200')?.coordenadas ?? [],
  'line-210': RECORRIDOS_MOCK.find((r) => r.lineaId === 'line-210')?.coordenadas ?? [],
  'line-215': RECORRIDOS_MOCK.find((r) => r.lineaId === 'line-215')?.coordenadas ?? [],
  'line-220': RECORRIDOS_MOCK.find((r) => r.lineaId === 'line-220')?.coordenadas ?? [],
  'line-225': RECORRIDOS_MOCK.find((r) => r.lineaId === 'line-225')?.coordenadas ?? [],
  'linea-65': RECORRIDOS_MOCK.find((r) => r.lineaId === 'linea-65')?.coordenadas ?? [],
  'linea-90': RECORRIDOS_MOCK.find((r) => r.lineaId === 'linea-90')?.coordenadas ?? [],
  'linea-151': RECORRIDOS_MOCK.find((r) => r.lineaId === 'linea-151')?.coordenadas ?? [],
  'linea-194': RECORRIDOS_MOCK.find((r) => r.lineaId === 'linea-194')?.coordenadas ?? [],
};

// ─── Líneas ────────────────────────────────────────────────
export const MOCK_LINES: Line[] = [
  {
    id: 'line-200',
    name: 'Centro – Sur',
    shortName: '200',
    color: '#1D4ED8',
    direction: 'Sur',
    frequency: 15,
  },
  {
    id: 'line-210',
    name: 'Centro – Oeste',
    shortName: '210',
    color: '#FEA619',
    direction: 'Oeste',
    frequency: 10,
  },
  {
    id: 'line-215',
    name: 'Zona Norte',
    shortName: '215',
    color: '#006B2C',
    direction: 'Norte',
    frequency: 20,
  },
  {
    id: 'line-220',
    name: 'Costanera',
    shortName: '220',
    color: '#7C3AED',
    direction: 'Costanera',
    frequency: 25,
  },
  {
    id: 'line-225',
    name: 'Aeropuerto – Centro',
    shortName: '225',
    color: '#0EA5E9',
    direction: 'Centro',
    frequency: 30,
  },
  {
    id: 'linea-65',
    name: 'Barrancas ⇄ Constitución',
    shortName: '65',
    color: '#f59e0b',
    direction: 'Constitución',
    frequency: 6,
  },
  {
    id: 'linea-90',
    name: 'Devoto ⇄ Constitución',
    shortName: '90',
    color: '#dc2626',
    direction: 'Constitución',
    frequency: 8,
  },
  {
    id: 'linea-151',
    name: 'Saavedra ⇄ Constitución',
    shortName: '151',
    color: '#16a34a',
    direction: 'Constitución',
    frequency: 7,
  },
  {
    id: 'linea-194',
    name: 'Zárate ⇄ Once',
    shortName: '194',
    color: '#0284c7',
    direction: 'Once',
    frequency: 12,
  },
];

// ─── Paradas ───────────────────────────────────────────────
export const MOCK_STOPS: Stop[] = [
  {
    id: 'stop-001',
    name: 'Av. Corrientes y Belgrano',
    lat: -34.6037,
    lng: -58.3816,
    lineIds: ['line-200', 'line-210', 'linea-65'],
  },
  {
    id: 'stop-002',
    name: 'Diagonal Norte y Maipú',
    lat: -34.6042,
    lng: -58.3803,
    lineIds: ['line-200', 'line-215', 'linea-151'],
  },
  {
    id: 'stop-003',
    name: 'Pje. Castelli y Av. Cabildo',
    lat: -34.5632,
    lng: -58.4597,
    lineIds: ['line-215', 'linea-65', 'linea-151'],
  },
  {
    id: 'stop-004',
    name: 'Terminal Central',
    lat: -34.6267,
    lng: -58.3816,
    lineIds: ['line-200', 'line-210', 'line-225', 'linea-90'],
  },
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
    lineIds: ['line-200', 'line-210', 'linea-65'],
  },
  {
    id: 'stop-008',
    name: 'Av. Rivadavia y Once',
    lat: -34.6091,
    lng: -58.4035,
    lineIds: ['line-210', 'linea-65', 'linea-194'],
  },
  {
    id: 'stop-009',
    name: 'Av. Cabildo y Congreso',
    lat: -34.5583,
    lng: -58.4638,
    lineIds: ['line-215', 'linea-65', 'linea-151'],
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
    name: 'Terminal Dellepiane',
    lat: -34.6267,
    lng: -58.378,
    lineIds: ['line-225'],
  },
];

// ─── Alertas ───────────────────────────────────────────────
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    lineId: 'line-200',
    type: 'delay',
    title: 'Retraso estimado',
    description: 'Obra en Av. 9 de Julio. Retraso de 10 min en sentido Centro.',
    severity: 'amber',
    timestamp: Date.now() - 1000 * 60 * 30,
    since: '14:10',
  },
  {
    id: 'alert-004',
    lineId: 'line-210',
    type: 'delay',
    title: 'Retraso estimado',
    description: 'Obra en Av. 9 de Julio. Retraso de 10 min en sentido Oeste.',
    severity: 'amber',
    timestamp: Date.now() - 1000 * 60 * 25,
    since: '14:10',
  },
  {
    id: 'alert-002',
    lineId: 'line-225',
    type: 'suspension',
    title: 'Línea suspendida',
    description: 'Corte en acceso al aeropuerto. Servicio reemplazado por 215.',
    severity: 'red',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    since: '13:05',
  },
  {
    id: 'alert-003',
    lineId: 'line-220',
    type: 'route_change',
    title: 'Cambio de recorrido',
    description: 'Recorrido alterado por evento en Costanera. Vuelve a la normalidad a las 16:00.',
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
    description: 'Retrasos por corte en Av. Rivadavia durante la mañana. Frecuencias restablecidas.',
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
  'linea-65': ['6501', '6502'],
  'linea-90': ['9001', '9002'],
  'linea-151': ['1511', '1512'],
  'linea-194': ['1941', '1942'],
};

// ─── Paradas por línea (ordenadas para timeline) ───────────
export const MOCK_LINE_STOPS: Record<string, string[]> = {
  'line-200': ['stop-006', 'stop-001', 'stop-002', 'stop-005', 'stop-004', 'stop-007'],
  'line-210': ['stop-006', 'stop-001', 'stop-007', 'stop-008'],
  'line-215': ['stop-002', 'stop-010', 'stop-009', 'stop-003'],
  'line-220': ['stop-012', 'stop-011', 'stop-010'],
  'line-225': ['stop-014', 'stop-012', 'stop-001', 'stop-013'],
  'linea-65': ['stop-003', 'stop-007', 'stop-008', 'stop-004'],
  'linea-90': ['stop-004', 'stop-007', 'stop-001'],
  'linea-151': ['stop-003', 'stop-002', 'stop-004'],
  'linea-194': ['stop-008', 'stop-004'],
};
