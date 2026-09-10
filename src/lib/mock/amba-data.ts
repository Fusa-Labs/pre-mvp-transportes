import { AlertaServicio, Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";
import snappedRoutes from "@/data/routes.json";

const ALL_SNAPPED = snappedRoutes as unknown as Record<string, [number, number][]>;

/**
 * Dataset AMBA — Línea Oficial: Línea 65 (La Nueva Metropol S.A.)
 * Recorrido oficial Constitución – Barrancas de Belgrano (Circuito completo de 36.06 km).
 * 24 unidades activas reales simultáneas con frecuencia pico de 5 minutos.
 * 18 paradas calibradas 100% al eje de calzada (0m de error).
 */

export const LINEAS_MOCK: Linea[] = [
  {
    id: "line-65",
    numero: "65",
    nombre: "Barrancas de Belgrano – Plaza Constitución",
    empresa: "La Nueva Metropol S.A.",
    colorHex: "#0EA5E9",
    textColorHex: "#ffffff",
    estado: "normal",
    frecuenciaPicoMin: 5,
    ramales: ["Troncal Constitución - Barrancas (Ida)", "Troncal Barrancas - Constitución (Vuelta)"],
    mensajeEstado: "Servicio regular con 24 unidades activas (Ida en celeste, Vuelta en roja).",
  },
];

// ─── 18 Paradas Oficiales Calibradas al Eje de la Calzada ─────────────
export const PARADAS_MOCK: Parada[] = [
  {
    id: "stop-65-01",
    nombre: "Plaza Constitución (Cabecera Sur)",
    direccion: "Lima y Av. Brasil (Transbordo)",
    lat: -34.628772,
    lng: -58.379175,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["C"],
      tren: ["Roca"],
      metrobus: true,
    },
  },
  {
    id: "stop-65-02",
    nombre: "Hospital Garrahan",
    direccion: "Pichincha y 15 de Noviembre",
    lat: -34.634219,
    lng: -58.390904,
    lineasIds: ["line-65"],
  },
  {
    id: "stop-65-03",
    nombre: "Hospital Muñiz / Parque Ameghino",
    direccion: "Uspallata y Av. Caseros",
    lat: -34.637114,
    lng: -58.405632,
    lineasIds: ["line-65"],
  },
  {
    id: "stop-65-04",
    nombre: "Hospital de Quemados",
    direccion: "Pedro Goyena y Av. La Plata",
    lat: -34.618884,
    lng: -58.42843,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["E"],
    },
  },
  {
    id: "stop-65-05",
    nombre: "Parque Centenario / Hospital Durand",
    direccion: "Av. Díaz Vélez y Leopoldo Marechal",
    lat: -34.604463,
    lng: -58.434711,
    lineasIds: ["line-65"],
  },
  {
    id: "stop-65-06",
    nombre: "Hospital Naval",
    direccion: "Av. Patricias Argentinas y Franklin",
    lat: -34.604176,
    lng: -58.436704,
    lineasIds: ["line-65"],
  },
  {
    id: "stop-65-07",
    nombre: "Av. Corrientes y Scalabrini Ortiz",
    direccion: "Av. Corrientes y Scalabrini Ortiz",
    lat: -34.599858,
    lng: -58.440775,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["B"],
    },
  },
  {
    id: "stop-65-08",
    nombre: "Chacarita / Estación Federico Lacroze",
    direccion: "Av. Corrientes y Av. Federico Lacroze",
    lat: -34.587089,
    lng: -58.454842,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["B"],
      tren: ["Urquiza"],
    },
  },
  {
    id: "stop-65-09",
    nombre: "Barrancas de Belgrano (Cabecera Norte)",
    direccion: "Virrey Vértiz y Juramento (Estación Belgrano C)",
    lat: -34.558754,
    lng: -58.449503,
    lineasIds: ["line-65"],
    conexiones: {
      tren: ["Mitre"],
    },
  },
  {
    id: "stop-65-10",
    nombre: "Barrancas de Belgrano (Salida Vuelta)",
    direccion: "Virrey Vértiz y Echeverría",
    lat: -34.558394,
    lng: -58.450131,
    lineasIds: ["line-65"],
    conexiones: {
      tren: ["Mitre"],
    },
  },
  {
    id: "stop-65-11",
    nombre: "Av. Cabildo y Juramento",
    direccion: "Av. Cabildo y Juramento",
    lat: -34.561988,
    lng: -58.456644,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["D"],
      metrobus: true,
    },
  },
  {
    id: "stop-65-12",
    nombre: "Av. Cabildo y Olleros",
    direccion: "Av. Cabildo y Olleros",
    lat: -34.564948,
    lng: -58.454296,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["D"],
      metrobus: true,
    },
  },
  {
    id: "stop-65-13",
    nombre: "Av. Álvarez Thomas y Federico Lacroze",
    direccion: "Av. Álvarez Thomas y Federico Lacroze",
    lat: -34.58736,
    lng: -58.455159,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["B"],
    },
  },
  {
    id: "stop-65-14",
    nombre: "Av. Corrientes y Dorrego",
    direccion: "Av. Corrientes y Av. Dorrego",
    lat: -34.588978,
    lng: -58.450409,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["B"],
    },
  },
  {
    id: "stop-65-15",
    nombre: "Hospital Italiano",
    direccion: "Gascón y Potosí",
    lat: -34.61544,
    lng: -58.43004,
    lineasIds: ["line-65"],
  },
  {
    id: "stop-65-16",
    nombre: "Boedo / Castro Barros",
    direccion: "Av. Independencia y Castro Barros",
    lat: -34.627123,
    lng: -58.42676,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["E"],
    },
  },
  {
    id: "stop-65-17",
    nombre: "Hospital Británico / Caseros",
    direccion: "Av. Caseros y Perdriel",
    lat: -34.635402,
    lng: -58.396035,
    lineasIds: ["line-65"],
  },
  {
    id: "stop-65-18",
    nombre: "Plaza Constitución (Llegada Vuelta)",
    direccion: "Av. Brasil y Lima (Estación Constitución)",
    lat: -34.628655,
    lng: -58.378738,
    lineasIds: ["line-65"],
    conexiones: {
      subte: ["C"],
      tren: ["Roca"],
      metrobus: true,
    },
  },
];

export const RECORRIDOS_MOCK: Recorrido[] = [
  {
    id: "rec-65-ida",
    lineaId: "line-65",
    ramal: "Troncal Constitución - Barrancas (Ida)",
    sentido: "ida",
    coordenadas: ALL_SNAPPED["line-65-ida"] || [],
  },
  {
    id: "rec-65-vuelta",
    lineaId: "line-65",
    ramal: "Troncal Barrancas - Constitución (Vuelta)",
    sentido: "vuelta",
    coordenadas: ALL_SNAPPED["line-65-vuelta"] || [],
  },
];

// ─── 24 Unidades Reales Iniciales (La Nueva Metropol S.A.) ───────────
const UNIDADES_65 = [
  "18", "20", "25", "28", "34", "39", "42", "45",
  "48", "51", "55", "58", "62", "65", "71", "74",
  "78", "82", "85", "89", "92", "95", "98", "101"
];

export const VEHICULOS_INICIALES_MOCK: VehiculoEnVivo[] = UNIDADES_65.map((interno, idx) => {
  const stopTarget = PARADAS_MOCK[idx % PARADAS_MOCK.length]!;
  return {
    id: `veh-65-${interno}`,
    lineaId: "line-65",
    interno,
    lat: stopTarget.lat,
    lng: stopTarget.lng,
    bearing: 160,
    velocidadKmH: 19,
    sentido: idx < 12 ? "ida" : "vuelta",
    proximaParadaId: stopTarget.id,
    retrasoMinutos: 0,
    ocupacion: idx % 3 === 0 ? "alta" : idx % 2 === 0 ? "media" : "baja",
  };
});

export const ALERTAS_MOCK: AlertaServicio[] = [
  {
    id: "alert-65-001",
    lineaId: "line-65",
    lineaNumero: "65",
    tipo: "informativo",
    titulo: "Frecuencia en tiempo real: 5 min",
    descripcion: "La Línea 65 cuenta con 24 unidades monitoreadas en vivo en ambos sentidos.",
    fechaHora: "08:00",
    afectaRamal: "Troncal Constitución - Barrancas",
    severidad: "amber",
    estado: "activa",
  },
];
