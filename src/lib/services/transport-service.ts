import { ALERTAS_MOCK, LINEAS_MOCK, PARADAS_MOCK, RECORRIDOS_MOCK, VEHICULOS_INICIALES_MOCK } from "@/lib/mock/amba-data";
import {
  AlertaServicio,
  EstimacionLlegada,
  Linea,
  Parada,
  Recorrido,
  VehiculoEnVivo,
  Line,
  Stop,
  Route,
  Vehicle,
  ServiceAlert,
  Arrival,
} from "@/types/transport";

export interface IDataService {
  getLineas(): Linea[];
  getLineaById(id: string): Linea | undefined;
  getParadas(lineaId?: string): Parada[];
  getRecorrido(lineaId: string): Recorrido | undefined;
  getRecorridosByLinea(lineaId: string): Recorrido[];
  getLlegadas(paradaId: string): EstimacionLlegada[];
  getVehiculos(lineaId?: string): VehiculoEnVivo[];
  getAlertas(lineaId?: string): AlertaServicio[];
}

export class TransportService implements IDataService {
  // --- Métodos en Español (fase implementacion oficial transportes.txt) ---

  public getLineas(): Linea[] {
    return LINEAS_MOCK;
  }

  public getLineaById(id: string): Linea | undefined {
    return LINEAS_MOCK.find((l) => l.id === id || l.numero === id);
  }

  public getParadas(lineaId?: string): Parada[] {
    if (!lineaId) return PARADAS_MOCK;
    return PARADAS_MOCK.filter((p) => p.lineasIds.includes(lineaId));
  }

  public getRecorrido(lineaId: string): Recorrido | undefined {
    return RECORRIDOS_MOCK.find((r) => r.lineaId === lineaId);
  }

  public getRecorridosByLinea(lineaId: string): Recorrido[] {
    return RECORRIDOS_MOCK.filter((r) => r.lineaId === lineaId);
  }

  public getVehiculos(lineaId?: string): VehiculoEnVivo[] {
    if (!lineaId) return VEHICULOS_INICIALES_MOCK;
    return VEHICULOS_INICIALES_MOCK.filter((v) => v.lineaId === lineaId);
  }

  public getAlertas(lineaId?: string): AlertaServicio[] {
    if (!lineaId) return ALERTAS_MOCK;
    return ALERTAS_MOCK.filter((a) => a.lineaId === lineaId);
  }

  public getLlegadas(paradaId: string): EstimacionLlegada[] {
    const parada = PARADAS_MOCK.find((p) => p.id === paradaId);
    if (!parada) return [];

    // Generador determinístico (hash) para evitar hydration mismatches entre SSR y cliente
    const deterministicHash = (str: string): number => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h);
    };

    const llegadas: EstimacionLlegada[] = [];
    parada.lineasIds.forEach((lId) => {
      const linea = LINEAS_MOCK.find((l) => l.id === lId);
      if (!linea) return;

      const seed = deterministicHash(paradaId + lId);
      const baseMin = (seed % 6) + 2;
      const interno1 = 1000 + (seed % 800);
      const interno2 = 2000 + ((seed >> 2) % 800);

      llegadas.push({
        lineaId: linea.id,
        lineaNumero: linea.numero,
        colorHex: linea.colorHex,
        ramal: linea.ramales[0] || "Troncal",
        minutos: baseMin,
        distanciaMetros: baseMin * 260,
        interno: `${interno1}`,
        ocupacion: baseMin < 4 ? "alta" : baseMin < 7 ? "media" : "baja",
      });

      if (linea.frecuenciaPicoMin > 0) {
        llegadas.push({
          lineaId: linea.id,
          lineaNumero: linea.numero,
          colorHex: linea.colorHex,
          ramal: linea.ramales[1] || linea.ramales[0] || "Troncal",
          minutos: baseMin + linea.frecuenciaPicoMin,
          distanciaMetros: (baseMin + linea.frecuenciaPicoMin) * 270,
          interno: `${interno2}`,
          ocupacion: "baja",
        });
      }
    });

    return llegadas.sort((a, b) => a.minutos - b.minutos);
  }

  // --- Aliases estáticos y en inglés (skill-maqueta-oficial.txt) ---

  public static getLines(): Line[] {
    return LINEAS_MOCK;
  }

  public static getLine(id: string): Line | undefined {
    return LINEAS_MOCK.find((l) => l.id === id || l.numero === id);
  }

  public static getRoute(lineId: string): Route | undefined {
    return RECORRIDOS_MOCK.find((r) => r.lineaId === lineId);
  }

  public static getStops(lineId?: string): Stop[] {
    if (!lineId) return PARADAS_MOCK;
    return PARADAS_MOCK.filter((p) => p.lineasIds.includes(lineId));
  }

  public static getVehicles(lineId?: string): Vehicle[] {
    if (!lineId) return VEHICULOS_INICIALES_MOCK;
    return VEHICULOS_INICIALES_MOCK.filter((v) => v.lineaId === lineId);
  }

  public static getServiceAlerts(lineId?: string): ServiceAlert[] {
    if (!lineId) return ALERTAS_MOCK;
    return ALERTAS_MOCK.filter((a) => a.lineaId === lineId);
  }

  public static getArrivals(stopId: string): Arrival[] {
    return new TransportService().getLlegadas(stopId);
  }

  // Compatibilidad con la UI actual
  public static getLineas(): Linea[] {
    return LINEAS_MOCK;
  }

  public static getLineaById(id: string): Linea | undefined {
    return LINEAS_MOCK.find((l) => l.id === id || l.numero === id);
  }

  public static getParadas(): Parada[] {
    return PARADAS_MOCK;
  }

  public static getParadasByLinea(lineaId: string): Parada[] {
    return PARADAS_MOCK.filter((p) => p.lineasIds.includes(lineaId));
  }

  public static getRecorridosByLinea(lineaId: string): Recorrido[] {
    return RECORRIDOS_MOCK.filter((r) => r.lineaId === lineaId);
  }

  public static getAlertas(): AlertaServicio[] {
    return ALERTAS_MOCK;
  }

  public static getAlertasByLinea(lineaId: string): AlertaServicio[] {
    return ALERTAS_MOCK.filter((a) => a.lineaId === lineaId);
  }

  public static getVehiculosIniciales(): VehiculoEnVivo[] {
    return VEHICULOS_INICIALES_MOCK;
  }

  public static getLlegadasPorParada(paradaId: string): EstimacionLlegada[] {
    return new TransportService().getLlegadas(paradaId);
  }
}

export const transportService = new TransportService();
