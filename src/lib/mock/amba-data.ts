import { AlertaServicio, Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";

export const LINEAS_MOCK: Linea[] = [
  {
    id: "linea-65",
    numero: "65",
    nombre: "Barrancas de Belgrano ⇄ Plaza Constitución",
    empresa: "La Nueva Metropol",
    colorHex: "#f59e0b", // Amarillo Metropol
    textColorHex: "#000000",
    estado: "normal",
    frecuenciaPicoMin: 6,
    ramales: ["Por Av. Corrientes", "Por Plaza Miserere"],
    mensajeEstado: "Servicio regular con demoras de 3 min en zona Constitución.",
  },
  {
    id: "linea-194",
    numero: "194",
    nombre: "Zárate / Campana ⇄ Plaza Miserere (Once)",
    empresa: "Metropol Express",
    colorHex: "#0284c7", // Azul Express
    textColorHex: "#ffffff",
    estado: "demoras",
    frecuenciaPicoMin: 12,
    ramales: ["Semirápido Panamericana", "Común por Ruta 9"],
    mensajeEstado: "Demoras de 10 min en Acceso Norte por obras viales.",
  },
  {
    id: "linea-90",
    numero: "90",
    nombre: "Villa Devoto ⇄ Plaza Constitución",
    empresa: "Modo S.A. (Metropol)",
    colorHex: "#dc2626", // Rojo
    textColorHex: "#ffffff",
    estado: "normal",
    frecuenciaPicoMin: 8,
    ramales: ["Ramal A Chacarita", "Ramal B Palermo"],
    mensajeEstado: "Operando en horario programado.",
  },
  {
    id: "linea-151",
    numero: "151",
    nombre: "Puente Saavedra ⇄ Plaza Constitución",
    empresa: "Transportes San Roque (Metropol)",
    colorHex: "#16a34a", // Verde
    textColorHex: "#ffffff",
    estado: "normal",
    frecuenciaPicoMin: 7,
    ramales: ["Por Av. Cabildo y Santa Fe"],
    mensajeEstado: "Servicio funcionando con normalidad.",
  },
];

export const PARADAS_MOCK: Parada[] = [
  {
    id: "parada-1",
    nombre: "Barrancas de Belgrano",
    direccion: "Virrey Vértiz y Juramento",
    lat: -34.5615,
    lng: -58.4505,
    lineasIds: ["linea-65", "linea-151"],
  },
  {
    id: "parada-2",
    nombre: "Cabildo y Juramento",
    direccion: "Av. Cabildo 2100",
    lat: -34.5627,
    lng: -58.456,
    lineasIds: ["linea-65", "linea-151"],
  },
  {
    id: "parada-3",
    nombre: "Cabildo y Federico Lacroze",
    direccion: "Av. Cabildo 600",
    lat: -34.5724,
    lng: -58.4428,
    lineasIds: ["linea-65", "linea-151"],
  },
  {
    id: "parada-4",
    nombre: "Estación Federico Lacroze (Chacarita)",
    direccion: "Av. Corrientes y Av. Federico Lacroze",
    lat: -34.5872,
    lng: -58.4552,
    lineasIds: ["linea-65", "linea-90"],
  },
  {
    id: "parada-5",
    nombre: "Corrientes y Dorrego",
    direccion: "Av. Corrientes 6000",
    lat: -34.5912,
    lng: -58.4455,
    lineasIds: ["linea-65", "linea-90"],
  },
  {
    id: "parada-6",
    nombre: "Corrientes y Medrano (Almagro)",
    direccion: "Av. Corrientes 3900",
    lat: -34.6025,
    lng: -58.4231,
    lineasIds: ["linea-65"],
  },
  {
    id: "parada-7",
    nombre: "Plaza Miserere (Once)",
    direccion: "Av. Rivadavia 2800",
    lat: -34.6099,
    lng: -58.4093,
    lineasIds: ["linea-65", "linea-194"],
  },
  {
    id: "parada-8",
    nombre: "Congreso de la Nación",
    direccion: "Av. Rivadavia y Av. Entre Ríos",
    lat: -34.6097,
    lng: -58.3926,
    lineasIds: ["linea-65", "linea-90"],
  },
  {
    id: "parada-9",
    nombre: "Entre Ríos e Independencia",
    direccion: "Av. Entre Ríos 800",
    lat: -34.6178,
    lng: -58.3885,
    lineasIds: ["linea-65", "linea-90"],
  },
  {
    id: "parada-10",
    nombre: "Plaza Constitución (Centro de Trasbordo)",
    direccion: "Lima y Brasil",
    lat: -34.6277,
    lng: -58.3815,
    lineasIds: ["linea-65", "linea-90", "linea-151"],
  },
  {
    id: "parada-11",
    nombre: "Puente Saavedra",
    direccion: "Av. Maipú y Av. Gral Paz",
    lat: -34.5398,
    lng: -58.4735,
    lineasIds: ["linea-151", "linea-194"],
  },
  {
    id: "parada-12",
    nombre: "Plaza Italia (Palermo)",
    direccion: "Av. Santa Fe 4100",
    lat: -34.5815,
    lng: -58.4208,
    lineasIds: ["linea-151", "linea-194"],
  },
  {
    id: "parada-13",
    nombre: "Santa Fe y Pueyrredón",
    direccion: "Av. Santa Fe 2500",
    lat: -34.5939,
    lng: -58.4035,
    lineasIds: ["linea-151"],
  },
  {
    id: "parada-14",
    nombre: "Obelisco / Metrobus 9 de Julio",
    direccion: "Av. 9 de Julio y Corrientes",
    lat: -34.6037,
    lng: -58.3816,
    lineasIds: ["linea-151"],
  },
];

export const RECORRIDOS_MOCK: Recorrido[] = [
  {
    id: "rec-65-ida",
    lineaId: "linea-65",
    ramal: "Por Av. Corrientes",
    sentido: "ida",
    coordenadas: [
      [-58.4505, -34.5615], // Barrancas
      [-58.456, -34.5627],  // Cabildo & Juramento
      [-58.4428, -34.5724], // Lacroze
      [-58.4552, -34.5872], // Chacarita
      [-58.4455, -34.5912], // Dorrego
      [-58.4231, -34.6025], // Medrano
      [-58.4093, -34.6099], // Once
      [-58.3926, -34.6097], // Congreso
      [-58.3885, -34.6178], // Entre Ríos
      [-58.3815, -34.6277], // Constitución
    ],
  },
  {
    id: "rec-151-ida",
    lineaId: "linea-151",
    ramal: "Por Av. Cabildo y Santa Fe",
    sentido: "ida",
    coordenadas: [
      [-58.4735, -34.5398], // Puente Saavedra
      [-58.456, -34.5627],  // Cabildo & Juramento
      [-58.4428, -34.5724], // Lacroze
      [-58.4208, -34.5815], // Plaza Italia
      [-58.4035, -34.5939], // Santa Fe & Pueyrredón
      [-58.3816, -34.6037], // Obelisco
      [-58.3815, -34.6277], // Constitución
    ],
  },
  {
    id: "rec-194-ida",
    lineaId: "linea-194",
    ramal: "Semirápido Panamericana",
    sentido: "ida",
    coordenadas: [
      [-58.5205, -34.505],  // Acceso Norte Panamericana
      [-58.4735, -34.5398], // Puente Saavedra
      [-58.4208, -34.5815], // Plaza Italia
      [-58.4093, -34.6099], // Once
    ],
  },
  {
    id: "rec-90-ida",
    lineaId: "linea-90",
    ramal: "Ramal A Chacarita",
    sentido: "ida",
    coordenadas: [
      [-58.5147, -34.5976], // Villa Devoto
      [-58.4552, -34.5872], // Chacarita
      [-58.4455, -34.5912], // Dorrego
      [-58.3926, -34.6097], // Congreso
      [-58.3815, -34.6277], // Constitución
    ],
  },
];

export const VEHICULOS_INICIALES_MOCK: VehiculoEnVivo[] = [
  {
    id: "veh-65-01",
    lineaId: "linea-65",
    interno: "2014",
    lat: -34.575,
    lng: -58.448,
    bearing: 145,
    velocidadKmH: 26,
    sentido: "ida",
    proximaParadaId: "parada-4",
    retrasoMinutos: 1,
    ocupacion: "media",
  },
  {
    id: "veh-65-02",
    lineaId: "linea-65",
    interno: "2088",
    lat: -34.606,
    lng: -58.416,
    bearing: 130,
    velocidadKmH: 18,
    sentido: "ida",
    proximaParadaId: "parada-7",
    retrasoMinutos: 3,
    ocupacion: "alta",
  },
  {
    id: "veh-65-03",
    lineaId: "linea-65",
    interno: "2105",
    lat: -34.619,
    lng: -58.386,
    bearing: 170,
    velocidadKmH: 31,
    sentido: "ida",
    proximaParadaId: "parada-10",
    retrasoMinutos: 0,
    ocupacion: "baja",
  },
  {
    id: "veh-151-01",
    lineaId: "linea-151",
    interno: "104",
    lat: -34.552,
    lng: -58.463,
    bearing: 140,
    velocidadKmH: 34,
    sentido: "ida",
    proximaParadaId: "parada-2",
    retrasoMinutos: 0,
    ocupacion: "media",
  },
  {
    id: "veh-151-02",
    lineaId: "linea-151",
    interno: "128",
    lat: -34.598,
    lng: -58.395,
    bearing: 155,
    velocidadKmH: 22,
    sentido: "ida",
    proximaParadaId: "parada-14",
    retrasoMinutos: 2,
    ocupacion: "alta",
  },
  {
    id: "veh-194-01",
    lineaId: "linea-194",
    interno: "401",
    lat: -34.525,
    lng: -58.498,
    bearing: 135,
    velocidadKmH: 52,
    sentido: "ida",
    proximaParadaId: "parada-11",
    retrasoMinutos: 8,
    ocupacion: "alta",
  },
  {
    id: "veh-90-01",
    lineaId: "linea-90",
    interno: "312",
    lat: -34.593,
    lng: -58.481,
    bearing: 110,
    velocidadKmH: 28,
    sentido: "ida",
    proximaParadaId: "parada-4",
    retrasoMinutos: 0,
    ocupacion: "baja",
  },
];

export const ALERTAS_MOCK: AlertaServicio[] = [
  {
    id: "alt-1",
    lineaId: "linea-194",
    lineaNumero: "194",
    tipo: "demora",
    titulo: "Demora en Panamericana",
    descripcion: "Congestión por obras de bacheo entre Km 42 y Márquez. Demoras de 10 a 15 minutos.",
    fechaHora: "Hace 12 min",
    afectaRamal: "Semirápido Panamericana",
  },
  {
    id: "alt-2",
    lineaId: "linea-65",
    lineaNumero: "65",
    tipo: "desvio",
    titulo: "Desvío preventivo en Constitución",
    descripcion: "Corte parcial por reparación de calzada sobre Av. Brasil. Desvío por calle Salta.",
    fechaHora: "Hace 25 min",
  },
  {
    id: "alt-3",
    lineaId: "linea-90",
    lineaNumero: "90",
    tipo: "informativo",
    titulo: "Frecuencia reforzada",
    descripcion: "Adición de 4 coches por hora pico de regreso entre las 17:00 y 20:30 hs.",
    fechaHora: "Hace 1 hora",
  },
];
