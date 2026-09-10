/**
 * MockDataServiceImpl — Implementación mock de DataService
 *
 * Maqueta: usa datos ficticios de src/mock/data.ts
 * MVP: se reemplaza por SupabaseDataServiceImpl (mismo contrato)
 */

import type {
  DataService,
  Line,
  Stop,
  Arrival,
  VehiclePosition,
  Alert,
  Unsubscribe,
} from '@/lib/data-service';
import { MOCK_LINES, MOCK_STOPS, MOCK_ALERTS, MOCK_LINE_STOPS, MOCK_UNITS } from './data';
import { subscribeToPositions as mockSubscribe } from './live';

// ─── Helpers ───────────────────────────────────────────────

function generateArrivals(stopId: string): Arrival[] {
  const arrivals: Arrival[] = [];

  for (const line of MOCK_LINES) {
    const lineStops = MOCK_LINE_STOPS[line.id];
    if (!lineStops || !lineStops.includes(stopId)) continue;

    // Generar 2-3 llegadas por línea
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const isLive = Math.random() > 0.3; // 70% en vivo
      const etaMin = i * 5 + Math.floor(Math.random() * 5); // 0-15 min escalonados
      arrivals.push({
        lineId: line.id,
        lineName: line.shortName,
        etaMin,
        live: isLive,
        unitId: isLive ? MOCK_UNITS[line.id]?.[0] : undefined,
      });
    }
  }

  // Ordenar por ETA ascendente
  return arrivals.sort((a, b) => a.etaMin - b.etaMin);
}

// ─── Implementación ────────────────────────────────────────

export class MockDataServiceImpl implements DataService {
  async getLines(): Promise<Line[]> {
    return [...MOCK_LINES];
  }

  async getLine(id: string): Promise<Line> {
    const line = MOCK_LINES.find((l) => l.id === id);
    if (!line) throw new Error(`Línea ${id} no encontrada`);
    return { ...line };
  }

  async getStops(): Promise<Stop[]> {
    return MOCK_STOPS.map((s) => ({ ...s }));
  }

  async getStopsByLine(lineId: string): Promise<Stop[]> {
    const stopIds = MOCK_LINE_STOPS[lineId] ?? [];
    return MOCK_STOPS.filter((s) => stopIds.includes(s.id)).map((s) => ({
      ...s,
    }));
  }

  async getArrivals(stopId: string): Promise<Arrival[]> {
    // Simular latencia de red
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    return generateArrivals(stopId);
  }

  subscribeToPositions(
    lineIds: string[],
    cb: (positions: VehiclePosition[]) => void,
  ): Unsubscribe {
    return mockSubscribe(lineIds, cb);
  }

  async getAlerts(): Promise<Alert[]> {
    return [...MOCK_ALERTS];
  }

  notifyArrival(_stopId: string, _lineId: string): void {
    // Maqueta: push local vía Web Notification API
    // Se implementa en el componente que llama
    console.log(
      `[MockDataServiceImpl] notifyArrival: stop=${_stopId}, line=${_lineId}`,
    );
  }
}
