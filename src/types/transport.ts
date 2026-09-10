export type EstadoLinea = "normal" | "demoras" | "interrumpido";

export interface Linea {
  id: string;
  numero: string;
  nombre: string;
  empresa: string;
  colorHex: string;
  textColorHex: string;
  estado: EstadoLinea;
  mensajeEstado?: string;
  frecuenciaPicoMin: number;
  ramales: string[];
}

export interface Parada {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  lineasIds: string[];
}

export interface Recorrido {
  id: string;
  lineaId: string;
  ramal: string;
  sentido: "ida" | "vuelta";
  coordenadas: [number, number][]; // [lng, lat] para MapLibre / GeoJSON
}

export interface VehiculoEnVivo {
  id: string;
  lineaId: string;
  interno: string;
  lat: number;
  lng: number;
  bearing: number; // Rumbo en grados (0-360)
  velocidadKmH: number;
  sentido: "ida" | "vuelta";
  proximaParadaId: string;
  retrasoMinutos: number;
  ocupacion: "baja" | "media" | "alta";
}

export type TipoAlerta = "demora" | "corte" | "desvio" | "informativo";

export interface AlertaServicio {
  id: string;
  lineaId: string;
  lineaNumero: string;
  tipo: TipoAlerta;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  afectaRamal?: string;
}

export interface EstimacionLlegada {
  lineaId: string;
  lineaNumero: string;
  colorHex: string;
  ramal: string;
  minutos: number;
  distanciaMetros: number;
  interno: string;
  ocupacion: "baja" | "media" | "alta";
}
