/**
 * Utilidades de Proyección Telemática para el Diagrama de Hilo (Live Line Diagram)
 * Calcula la secuencia de paradas y la posición relativa de cada coche en tiempo real.
 * Soporta líneas troncales simples (Línea 65) y líneas multi-ramal (Línea 194).
 */

import { DATASET, MOCK_STOPS } from "@/mock/data";
import { getRouteTrack, RouteTrack } from "@/lib/map/route-progress";
import type { VehiclePosition } from "@/lib/data-service";

export interface DiagramStop {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  alongM: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface DiagramVehicle {
  unitId: string;
  lineId: string;
  ramalId?: string;
  speed: number;
  heading: number;
  isDwelling?: boolean;
  dwellRemainingSeconds?: number;
  alongM: number;
  progressPercent: number; // 0 a 1 a lo largo del recorrido
  prevStopId?: string;
  nextStopId?: string;
}

export interface LineRamalOption {
  id: string;
  nombre: string;
  codigo?: string;
}

export interface LineDiagramData {
  lineaId: string;
  ramalId?: string;
  ramalesDisponibles: LineRamalOption[];
  sentido: "ida" | "vuelta";
  origen: string;
  destino: string;
  color: string;
  totalLengthM: number;
  stops: DiagramStop[];
  vehicles: DiagramVehicle[];
}

// Caché de RouteTracks para no recalcular en cada tick
const trackCache: Record<string, RouteTrack | null> = {};

export function getLineDiagramData(
  lineaId: string,
  sentido: "ida" | "vuelta",
  positions: VehiclePosition[],
  selectedRamalId?: string | null
): LineDiagramData {
  const linea = DATASET.lineas.find((l) => l.id === lineaId);
  const color = linea?.color || (lineaId === "line-65" ? "#0284C7" : "#16A34A");

  // Lista de ramales oficiales disponibles para esta línea
  const ramalesDisponibles: LineRamalOption[] = (linea?.ramales || []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    codigo: r.codigo,
  }));

  // Determinar ramal activo: el seleccionado explícitamente o el primero por defecto
  const activeRamal =
    linea?.ramales.find((r) => r.id === selectedRamalId) ||
    linea?.ramales[0];

  // Buscar el recorrido del ramal para el sentido indicado
  let recorridoDef = activeRamal?.recorridos.find((r) => r.sentido === sentido);

  // Si el ramal no tiene ese sentido específico (por ejemplo ramales expresos unidireccionales),
  // usar el primer recorrido disponible del ramal
  if (!recorridoDef && activeRamal?.recorridos[0]) {
    recorridoDef = activeRamal.recorridos[0];
  }

  const recorridoId = recorridoDef?.id || `${lineaId}-${sentido}`;
  const origen = recorridoDef?.origen || (sentido === "ida" ? "Plaza Constitución" : "Barrancas de Belgrano");
  const destino = recorridoDef?.destino || (sentido === "ida" ? "Barrancas de Belgrano" : "Plaza Constitución");
  const stopIds = recorridoDef?.paradas || [];

  // Traza de coordenadas para proyección métrica
  let track = trackCache[recorridoId];
  if (track === undefined) {
    const coords = recorridoDef?.coordenadas || [];
    if (coords.length >= 2) {
      track = getRouteTrack(recorridoId, coords as [number, number][]);
      trackCache[recorridoId] = track;
    } else {
      track = null;
      trackCache[recorridoId] = null;
    }
  }

  const totalLengthM = track?.totalM || 18000;

  // 1. Resolver y proyectar paradas ordenadas de este ramal específico
  const stops: DiagramStop[] = [];
  stopIds.forEach((sId, idx) => {
    const stopMock = MOCK_STOPS.find((s) => s.id === sId);
    if (!stopMock) return;

    let alongM = 0;
    if (track) {
      const proj = track.project(stopMock.lng, stopMock.lat);
      alongM = proj.alongM;
    } else {
      alongM = (idx / Math.max(1, stopIds.length - 1)) * totalLengthM;
    }

    stops.push({
      id: stopMock.id,
      nombre: stopMock.name,
      lat: stopMock.lat,
      lng: stopMock.lng,
      alongM,
      isFirst: idx === 0,
      isLast: idx === stopIds.length - 1,
    });
  });

  stops.sort((a, b) => a.alongM - b.alongM);

  // 2. Filtrar vehículos pertenecientes estrictamente a este ramal y sentido
  const lineVehicles = positions.filter((p) => {
    if (p.lineId !== lineaId) return false;

    // Si la línea tiene múltiples ramales, filtrar por el ramal activo
    if (activeRamal && ramalesDisponibles.length > 1) {
      if (p.ramalId && p.ramalId !== activeRamal.id) return false;
    }

    // Filtrar por sentido (si tiene direction asignada)
    if (p.direction) {
      return p.direction === sentido;
    }

    return true;
  });

  // 3. Proyectar cada vehículo sobre la traza de este ramal
  const vehicles: DiagramVehicle[] = lineVehicles.map((v) => {
    let alongM = 0;
    if (track) {
      const proj = track.project(v.lng, v.lat);
      alongM = proj.alongM;
    }

    const progressPercent = Math.min(1, Math.max(0, alongM / Math.max(1, totalLengthM)));

    // Determinar entre qué paradas se encuentra
    let prevStopId: string | undefined;
    let nextStopId: string | undefined;

    for (let i = 0; i < stops.length; i++) {
      if (stops[i].alongM <= alongM) {
        prevStopId = stops[i].id;
      }
      if (stops[i].alongM > alongM && !nextStopId) {
        nextStopId = stops[i].id;
      }
    }

    return {
      unitId: v.unitId,
      lineId: v.lineId,
      ramalId: v.ramalId,
      speed: v.speed,
      heading: v.heading,
      isDwelling: v.isDwelling,
      dwellRemainingSeconds: v.dwellRemainingSeconds,
      alongM,
      progressPercent,
      prevStopId,
      nextStopId,
    };
  });

  return {
    lineaId,
    ramalId: activeRamal?.id,
    ramalesDisponibles,
    sentido,
    origen,
    destino,
    color,
    totalLengthM,
    stops,
    vehicles,
  };
}
