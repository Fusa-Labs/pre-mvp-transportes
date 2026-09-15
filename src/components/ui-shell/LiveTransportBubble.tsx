"use client";

import React, { useState } from "react";
import { X, Clock, MapPin, AlertTriangle, BusFront, Eye, Radio } from "lucide-react";
import { Linea, Parada, EstimacionLlegada, AlertaServicio, RamalDefinition } from "@/types/transport";
import type { VehiclePosition } from "@/lib/data-service";
import type { CameraMode } from "@/lib/map/camera-controller";
import type { StopAlongRoute } from "@/lib/map/route-progress";
import { RouteTimeline } from "@/components/map/RouteTimeline";

interface LiveTransportBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLinea: Linea | null;
  selectedRamal?: RamalDefinition | null;
  selectedParada: Parada | null;
  paradas: Parada[];
  llegadas: EstimacionLlegada[];
  alertas: AlertaServicio[];
  totalVehiculosActivos: number;
  onSelectParada: (parada: Parada) => void;
  selectedVehiculo?: VehiclePosition | null;
  cameraMode?: CameraMode;
  onToggle3D?: () => void;
  timelineStops?: StopAlongRoute[];
  busProgress?: number;
  busAlongM?: number;
}

export default function LiveTransportBubble({
  isOpen,
  onClose,
  selectedLinea,
  selectedRamal,
  selectedParada,
  paradas,
  llegadas,
  alertas,
  totalVehiculosActivos,
  onSelectParada,
  selectedVehiculo,
  cameraMode,
  onToggle3D,
  timelineStops = [],
  busProgress = 0,
  busAlongM = 0,
}: LiveTransportBubbleProps) {
  const [activeTab, setActiveTab] = useState<"llegadas" | "paradas" | "alertas">("llegadas");

  if (!isOpen) return null;

  const filteredAlerts = selectedLinea
    ? alertas.filter((a) => a.lineaId === selectedLinea.id)
    : alertas;

  return (
    <aside
      aria-label="Panel de información en vivo de la línea"
      className="fixed bottom-[84px] left-3 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[410px] max-h-[58dvh] bg-canvas/95 dark:bg-canvas/95 backdrop-blur-2xl border border-hairline rounded-[28px] shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Puntero triangular tipo burbuja apuntando al botón de Líneas en la navbar */}
      <div
        className="absolute -bottom-2 left-[10%] sm:left-8 w-4 h-4 bg-canvas/95 border-r border-b border-hairline rotate-45 pointer-events-none"
        aria-hidden="true"
      />

      {/* 1. Header de la Burbuja: Línea y Estado en Vivo */}
      <div className="p-3.5 pb-2.5 border-b border-hairline-soft flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 truncate">
          {selectedLinea ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 shadow-xs"
                style={{
                  backgroundColor: selectedLinea.colorHex || "#1D4ED8",
                  color: selectedLinea.textColorHex || "#FFFFFF",
                }}
              >
                Línea {selectedLinea.numero}
              </span>
              <div className="truncate">
                <p className="text-xs font-bold text-ink truncate leading-tight">
                  {selectedRamal ? selectedRamal.nombre : selectedLinea.nombre}
                </p>
                <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {totalVehiculosActivos} colectivos en circulación
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-electric-blue animate-pulse" />
              <span className="text-xs font-bold text-ink">Red de Colectivos AMBA</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel flotante"
          className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted hover:text-ink active:scale-95 transition-all shrink-0 ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Selector de Pestañas (Llegadas / Paradas / Alertas) */}
      <div className="px-3 py-1.5 border-b border-hairline-soft shrink-0 bg-canvas/40">
        <div className="flex items-center justify-between gap-1 p-0.5 rounded-full bg-canvas-soft border border-hairline-soft">
          <button
            type="button"
            onClick={() => setActiveTab("llegadas")}
            className={`flex-1 py-1 px-2 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "llegadas"
                ? "bg-canvas text-ink shadow-xs border border-hairline-soft"
                : "text-text-muted hover:text-ink"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Llegadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paradas")}
            className={`flex-1 py-1 px-2 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "paradas"
                ? "bg-canvas text-ink shadow-xs border border-hairline-soft"
                : "text-text-muted hover:text-ink"
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Paradas ({paradas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("alertas")}
            className={`flex-1 py-1 px-2 rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "alertas"
                ? "bg-canvas text-ink shadow-xs border border-hairline-soft"
                : "text-text-muted hover:text-ink"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Alertas ({filteredAlerts.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Contenido Desplazable de la Burbuja */}
      <div className="flex-1 p-3 overflow-y-auto no-scrollbar space-y-2.5 overscroll-contain">
        
        {/* Si hay un colectivo seleccionado */}
        {selectedVehiculo && (
          <div className="p-3 rounded-2xl bg-canvas-soft border border-hairline space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BusFront className="w-4 h-4 text-electric-blue" />
                <span className="text-xs font-bold text-ink">
                  Unidad #{selectedVehiculo.unitId}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 tabular-nums">
                {Math.round(selectedVehiculo.speed || 0)} km/h
              </span>
            </div>

            {onToggle3D && (
              <button
                type="button"
                onClick={onToggle3D}
                className="w-full py-1.5 px-3 rounded-full text-[11px] font-semibold bg-canvas border border-hairline flex items-center justify-center gap-1.5 hover:bg-field text-ink transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{cameraMode === "navigation-vehicle" ? "Modo 2D Cenital" : "Seguir en 3D"}</span>
              </button>
            )}

            {timelineStops.length > 0 && (
              <div className="pt-2 border-t border-hairline-soft">
                <p className="text-[10px] font-semibold text-text-muted mb-1.5">
                  Progreso del recorrido
                </p>
                <RouteTimeline
                  color={selectedLinea?.colorHex || "#0284C7"}
                  onColor="#FFFFFF"
                  stops={timelineStops}
                  busProgress={busProgress}
                  busAlongM={busAlongM}
                  speedKmh={selectedVehiculo.speed || 15}
                  shortName={selectedLinea?.numero || selectedVehiculo.lineId.replace("line-", "")}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 1: LLEGADAS */}
        {activeTab === "llegadas" && (
          <div className="space-y-2">
            {selectedParada ? (
              <div className="p-2.5 rounded-xl bg-canvas-soft border border-hairline-soft space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink truncate">
                    📍 {selectedParada.nombre}
                  </span>
                  <span className="text-[10px] text-text-muted">Parada seleccionada</span>
                </div>
                {llegadas.length > 0 ? (
                  <div className="space-y-1 pt-1">
                    {llegadas.map((llegada, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-canvas text-xs"
                      >
                        <span className="font-semibold text-ink">
                          Línea {llegada.lineaNumero}
                        </span>
                        <span className="font-bold text-electric-blue">
                          {llegada.minutos} min
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-text-muted pt-1">
                    No hay arribos inminentes para esta parada.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-canvas-soft border border-hairline-soft space-y-2">
                <p className="text-xs font-bold text-ink">
                  Frecuencia regular: ~5-8 min
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Tocá cualquier parada o colectivo en el mapa para ver la predicción exacta de arribo y la distancia en metros.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PARADAS */}
        {activeTab === "paradas" && (
          <div className="space-y-1.5">
            {paradas.slice(0, 15).map((p, idx) => {
              const isSelected = selectedParada?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectParada(p)}
                  className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-electric-blue/10 border border-electric-blue/30 text-electric-blue"
                      : "bg-canvas-soft hover:bg-field text-ink border border-hairline-soft"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-bold text-text-muted w-4">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold truncate">{p.nombre}</span>
                  </div>
                  <span className="text-[10px] text-text-muted shrink-0 ml-1">Ver</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TAB 3: ALERTAS */}
        {activeTab === "alertas" && (
          <div className="space-y-2">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alerta) => (
                <div
                  key={alerta.id}
                  className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{alerta.titulo}</span>
                  </div>
                  <p className="text-[11px] text-text-muted">{alerta.descripcion}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-text-muted text-xs">
                Servicio regular operando sin cortes ni desvíos reportados.
              </div>
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
