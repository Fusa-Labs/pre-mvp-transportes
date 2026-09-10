/**
 * Contratos de dominio de Transporte para la maqueta AMBA.
 * Cumple con docs/fase implementacion oficial transportes.txt y docs/skill-maqueta-oficial.txt
 */

export type EstadoLinea = "normal" | "demoras" | "interrumpido";

export interface CoordenadaGPS {
  lat: number;
  lng: number;
}

export type GpsCoordinate = [number, number]; // [lng, lat] para GeoJSON / MapLibre

export interface Ramal {
  id: string;
  nombre: string;
  sentido: "ida" | "vuelta";
}

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

// Alias de dominio en inglés conforme a skill-maqueta-oficial.txt
export type Line = Linea;

export interface Parada {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  lineasIds: string[];
}

export type Stop = Parada;

export interface Recorrido {
  id: string;
  lineaId: string;
  ramal: string;
  sentido: "ida" | "vuelta";
  coordenadas: [number, number][]; // [lng, lat] GeoJSON coordinates
}

export type Route = Recorrido;

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

export type Vehicle = VehiculoEnVivo;

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
  severidad?: "amber" | "red" | "gray";
  estado?: "activa" | "resuelta";
}

export type ServiceAlert = AlertaServicio;

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

export type Arrival = EstimacionLlegada;
