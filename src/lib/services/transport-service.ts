import { ALERTAS_MOCK, LINEAS_MOCK, PARADAS_MOCK, RECORRIDOS_MOCK, VEHICULOS_INICIALES_MOCK } from "@/lib/mock/amba-data";
import { AlertaServicio, EstimacionLlegada, Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";

export class TransportService {
  public static getLineas(): Linea[] {
    return LINEAS_MOCK;
  }

  public static getLineaById(id: string): Linea | undefined {
    return LINEAS_MOCK.find((l) => l.id === id);
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
    const parada = PARADAS_MOCK.find((p) => p.id === paradaId);
    if (!parada) return [];

    const llegadas: EstimacionLlegada[] = [];
    parada.lineasIds.forEach((lId) => {
      const linea = LINEAS_MOCK.find((l) => l.id === lId);
      if (!linea) return;

      // Mock de 1 a 2 llegadas por línea
      const baseMin = Math.floor(Math.random() * 8) + 2;
      llegadas.push({
        lineaId: linea.id,
        lineaNumero: linea.numero,
        colorHex: linea.colorHex,
        ramal: linea.ramales[0] || "Troncal",
        minutos: baseMin,
        distanciaMetros: baseMin * 280,
        interno: `${Math.floor(Math.random() * 900) + 100}`,
        ocupacion: baseMin < 4 ? "alta" : baseMin < 7 ? "media" : "baja",
      });

      llegadas.push({
        lineaId: linea.id,
        lineaNumero: linea.numero,
        colorHex: linea.colorHex,
        ramal: linea.ramales[1] || linea.ramales[0] || "Troncal",
        minutos: baseMin + linea.frecuenciaPicoMin,
        distanciaMetros: (baseMin + linea.frecuenciaPicoMin) * 290,
        interno: `${Math.floor(Math.random() * 900) + 100}`,
        ocupacion: "baja",
      });
    });

    return llegadas.sort((a, b) => a.minutos - b.minutos);
  }
}
