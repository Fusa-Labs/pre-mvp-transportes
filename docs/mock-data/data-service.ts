/**
 * DataService — Contrato de datos para la UI
 *
 * REGLA DE ORO: ningún componente importa src/mock/*.
 * Toda la UI consume ESTA interfaz.
 *
 * Maqueta: MockDataServiceImpl
 * MVP: SupabaseDataServiceImpl (mismo contrato)
 */

// ─── Modelos ───────────────────────────────────────────────

export interface Line {
  id: string;
  name: string;
  shortName: string; // "200", "210", etc.
  color: string; // hex
  direction: string; // "Sur", "Oeste", etc.
  frequency: number; // minutos entre colectivos
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lineIds: string[];
}

export interface Arrival {
  lineId: string;
  lineName: string;
  etaMin: number; // minutos hasta la llegada
  live: boolean; // true = GPS en tiempo real, false = por horario
  unitId?: string; // "1234", "0871"
}

export interface VehiclePosition {
  lineId: string;
  unitId: string;
  lat: number;
  lng: number;
  heading: number; // grados 0-360
  speed: number; // km/h
  timestamp: number; // Date.now()
}

export interface Alert {
  id: string;
  lineId: string;
  type: 'delay' | 'suspension' | 'route_change';
  /** 'resolved' = incidencia cerrada (chip verde en el listado). Default: active. */
  status?: 'active' | 'resolved';
  title: string;
  description: string;
  severity: 'amber' | 'red' | 'gray';
  timestamp: number;
  since?: string; // "14:10", "13:05"
}

export type Unsubscribe = () => void;

// ─── Interfaz Principal ────────────────────────────────────

export interface DataService {
  getLines(): Promise<Line[]>;
  getLine(id: string): Promise<Line>;
  getStops(): Promise<Stop[]>;
  getStopsByLine(lineId: string): Promise<Stop[]>;
  getArrivals(stopId: string): Promise<Arrival[]>;
  subscribeToPositions(
    lineIds: string[],
    cb: (positions: VehiclePosition[]) => void,
  ): Unsubscribe;
  getAlerts(): Promise<Alert[]>;
  notifyArrival(stopId: string, lineId: string): void;
}

// ─── Singleton (se setea en el provider de la app) ─────────

let dataService: DataService | null = null;

export function getDataService(): DataService {
  if (!dataService) {
    throw new Error(
      'DataService no inicializado. Llamar a setDataService() en el provider.',
    );
  }
  return dataService;
}

export function setDataService(service: DataService): void {
  dataService = service;
}
