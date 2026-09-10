import { AlertaServicio, Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";
import snappedRoutes from "@/data/routes.json";

const ALL_SNAPPED = snappedRoutes as unknown as Record<string, [number, number][]>;

/**
 * Dataset AMBA — Fase 1 (Línea Piloto Aislada: Línea 200 Centro - Sur)
 * Geometría de alta resolución OSRM calle por calle (375 puntos).
 * Paradas 100% calibradas sobre el eje de calzada con secuencia monótona.
 */

export const LINEAS_MOCK: Linea[] = [
  {
    id: "line-200",
    numero: "200",
    nombre: "Centro – Sur",
    empresa: "Flota Central AMBA",
    colorHex: "#1D4ED8",
    textColorHex: "#ffffff",
    estado: "demoras",
    frecuenciaPicoMin: 15,
    ramales: ["Circuito Centro - Sur"],
    mensajeEstado: "Tránsito intenso en Av. 9 de Julio. Demoras de 8 min en sentido Centro.",
  },
];

// ─── Paradas Calibradas y Alineadas al Eje de la Calzada ─────
// Coordenadas con distancia = 0.0m respecto a la traza OSRM y secuencia monótona
export const PARADAS_MOCK: Parada[] = [
  {
    id: "stop-006",
    nombre: "Plaza de la República (Obelisco)",
    direccion: "Av. Corrientes y Av. 9 de Julio",
    lat: -34.603304,
    lng: -58.38195,
    lineasIds: ["line-200"],
    conexiones: {
      subte: ["B", "C", "D"],
      metrobus: true,
    },
  },
  {
    id: "stop-002",
    nombre: "Diagonal Norte y Florida",
    direccion: "Av. Pres. Roque Sáenz Peña y Florida",
    lat: -34.604846,
    lng: -58.379766,
    lineasIds: ["line-200"],
    conexiones: {
      subte: ["D"],
    },
  },
  {
    id: "stop-001",
    nombre: "Av. Corrientes y Suipacha",
    direccion: "Av. Corrientes y Suipacha",
    lat: -34.606098,
    lng: -58.381238,
    lineasIds: ["line-200"],
    conexiones: {
      subte: ["B"],
    },
  },
  {
    id: "stop-005",
    nombre: "Av. de Mayo y Perú",
    direccion: "Av. de Mayo 600",
    lat: -34.608872,
    lng: -58.378957,
    lineasIds: ["line-200"],
    conexiones: {
      subte: ["A"],
    },
  },
  {
    id: "stop-004",
    nombre: "Metrobús 9 de Julio y Belgrano",
    direccion: "Av. 9 de Julio y Av. Belgrano",
    lat: -34.611846,
    lng: -58.380944,
    lineasIds: ["line-200"],
    conexiones: {
      subte: ["E"],
      metrobus: true,
    },
  },
  {
    id: "stop-007",
    nombre: "Av. 9 de Julio e Independencia",
    direccion: "Av. 9 de Julio y Av. Independencia",
    lat: -34.613119,
    lng: -58.381747,
    lineasIds: ["line-200"],
    conexiones: {
      subte: ["C", "E"],
      metrobus: true,
    },
  },
];

export const RECORRIDOS_MOCK: Recorrido[] = [
  {
    id: "rec-200",
    lineaId: "line-200",
    ramal: "Circuito Centro - Sur",
    sentido: "ida",
    coordenadas: ALL_SNAPPED["line-200"] || [],
  },
];

export const VEHICULOS_INICIALES_MOCK: VehiculoEnVivo[] = [
  {
    id: "veh-200-1234",
    lineaId: "line-200",
    interno: "1234",
    lat: -34.603304,
    lng: -58.38195,
    bearing: 160,
    velocidadKmH: 15,
    sentido: "ida",
    proximaParadaId: "stop-002",
    retrasoMinutos: 0,
    ocupacion: "media",
  },
  {
    id: "veh-200-0871",
    lineaId: "line-200",
    interno: "0871",
    lat: -34.604846,
    lng: -58.379766,
    bearing: 180,
    velocidadKmH: 17,
    sentido: "ida",
    proximaParadaId: "stop-001",
    retrasoMinutos: 0,
    ocupacion: "baja",
  },
  {
    id: "veh-200-2045",
    lineaId: "line-200",
    interno: "2045",
    lat: -34.608872,
    lng: -58.378957,
    bearing: 190,
    velocidadKmH: 14,
    sentido: "ida",
    proximaParadaId: "stop-004",
    retrasoMinutos: 2,
    ocupacion: "alta",
  },
  {
    id: "veh-200-1892",
    lineaId: "line-200",
    interno: "1892",
    lat: -34.613119,
    lng: -58.381747,
    bearing: 340,
    velocidadKmH: 16,
    sentido: "ida",
    proximaParadaId: "stop-006",
    retrasoMinutos: 0,
    ocupacion: "baja",
  },
];

export const ALERTAS_MOCK: AlertaServicio[] = [
  {
    id: "alert-001",
    lineaId: "line-200",
    lineaNumero: "200",
    tipo: "demora",
    titulo: "Retraso estimado",
    descripcion: "Tránsito intenso en Av. 9 de Julio. Demoras de 8 min en sentido Centro.",
    fechaHora: "14:10",
    afectaRamal: "Circuito Centro - Sur",
    severidad: "amber",
    estado: "activa",
  },
];
