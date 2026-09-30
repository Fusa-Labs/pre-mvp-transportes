"use client";

import React, { useMemo, useState } from "react";
import { X, ArrowLeftRight, BusFront, ChevronUp, ChevronDown } from "lucide-react";
import type { VehiclePosition } from "@/lib/data-service";
import type { Parada } from "@/types/transport";
import { MOCK_STOPS } from "@/mock/data";
import { getLineDiagramData, DiagramStop, DiagramVehicle } from "@/lib/map/line-diagram-utils";

interface LiveLineDiagramProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLineaId: string;
  onSelectLineaId: (lineaId: string) => void;
  selectedRamalId?: string | null;
  onSelectRamalId?: (ramalId: string | null) => void;
  sentido: "ida" | "vuelta";
  onToggleSentido: () => void;
  positions: VehiclePosition[];
  selectedParadaId?: string | null;
  onSelectParada: (parada: Parada) => void;
  selectedUnitId?: string | null;
  onSelectVehiculo?: (vehiculo: VehiclePosition) => void;
}

export default function LiveLineDiagram({
  isOpen,
  onClose,
  selectedLineaId,
  onSelectLineaId,
  selectedRamalId,
  onSelectRamalId,
  sentido,
  onToggleSentido,
  positions,
  selectedParadaId,
  onSelectParada,
  selectedUnitId,
  onSelectVehiculo,
}: LiveLineDiagramProps) {
  // Por defecto arranca minimizado (<= 20% de pantalla) para no tapar el mapa
  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  // 1. Datos calculados del diagrama telemático (paradas + coches proyectados por ramal)
  const diagram = useMemo(() => {
    return getLineDiagramData(selectedLineaId, sentido, positions, selectedRamalId);
  }, [selectedLineaId, sentido, positions, selectedRamalId]);

  if (!isOpen) return null;

  // Intercalar elementos en la arteria vertical: paradas y coches ordenados por alongM
  type TimelineItem =
    | { type: "stop"; data: DiagramStop; alongM: number }
    | { type: "vehicle"; data: DiagramVehicle; alongM: number };

  const timelineItems: TimelineItem[] = [];

  diagram.stops.forEach((stop) => {
    timelineItems.push({ type: "stop", data: stop, alongM: stop.alongM });
  });

  diagram.vehicles.forEach((veh) => {
    timelineItems.push({ type: "vehicle", data: veh, alongM: veh.alongM });
  });

  // Ordenar secuencialmente desde el origen (alongM: 0) hasta el destino (alongM: total)
  timelineItems.sort((a, b) => a.alongM - b.alongM);

  const handleStopClick = (stopItem: DiagramStop) => {
    const fullStop = MOCK_STOPS.find((s) => s.id === stopItem.id);
    if (fullStop) {
      onSelectParada({
        id: fullStop.id,
        nombre: fullStop.name,
        direccion: fullStop.name,
        lat: fullStop.lat,
        lng: fullStop.lng,
        lineasIds: fullStop.lineIds,
      });
    }
  };

  const handleVehicleClick = (v: DiagramVehicle) => {
    const fullVeh = positions.find((p) => p.lineId === v.lineId && p.unitId === v.unitId);
    if (fullVeh && onSelectVehiculo) {
      onSelectVehiculo(fullVeh);
    }
  };

  // Al seleccionar un troncal/línea: actualiza y minimiza automáticamente para ver el mapa
  const handleSelectTroncal = (lineId: string) => {
    onSelectLineaId(lineId);
    if (lineId === "line-65") {
      onSelectRamalId?.(null);
    } else {
      onSelectRamalId?.("ramal-194-a");
    }
    // Minimizar inmediatamente al seleccionar troncal
    setIsMinimized(true);
  };

  const hasMultipleRamales = diagram.ramalesDisponibles.length > 1;

  return (
    <div className="fixed bottom-[88px] inset-x-0 z-40 pointer-events-none flex justify-center px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <aside
        aria-label="Diagrama en vivo del recorrido de la línea"
        style={{
          // En modo minimizado ocupa máximo el 20% de la pantalla (o ~135px/170px si tiene ramales)
          maxHeight: isMinimized
            ? hasMultipleRamales ? "175px" : "135px"
            : "58dvh",
        }}
        className="pointer-events-auto w-full max-w-[420px] bg-canvas dark:bg-canvas border border-hairline rounded-[28px] shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col relative animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden transition-[max-height] duration-300 ease-out"
      >
        {/* Grip de arrastre / botón de toggle minimizar-expandir */}
        <button
          type="button"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="pt-2 pb-1 flex justify-center items-center gap-1 shrink-0 w-full hover:bg-canvas-soft/50 transition-colors"
          title={isMinimized ? "Expandir recorrido completo" : "Minimizar panel"}
        >
          <div className="w-10 h-1 rounded-full bg-hairline" />
        </button>

        {/* ─── Cabecera Oficial ────────────────────────────────────────── */}
        <div className="px-4 py-2 border-b border-hairline-soft shrink-0 select-none">
          {/* Fila 1: Selector de Troncal con Chips circulares [65] y [194] + Botón Cerrar */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectTroncal("line-65")}
                title="Línea 65"
                className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center shrink-0 ${
                  selectedLineaId === "line-65"
                    ? "bg-[#0284C7] text-white shadow-sm scale-105 ring-2 ring-sky-400/30"
                    : "bg-canvas-soft text-text-muted hover:text-ink border border-hairline"
                }`}
              >
                65
              </button>
              <button
                type="button"
                onClick={() => handleSelectTroncal("line-194")}
                title="Línea 194"
                className={`w-8 h-8 rounded-full text-xs font-black transition-all flex items-center justify-center shrink-0 ${
                  selectedLineaId === "line-194"
                    ? "bg-[#16A34A] text-white shadow-sm scale-105 ring-2 ring-emerald-400/30"
                    : "bg-canvas-soft text-text-muted hover:text-ink border border-hairline"
                }`}
              >
                194
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                aria-label={isMinimized ? "Expandir" : "Minimizar"}
                className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted hover:text-ink active:scale-95 transition-all"
              >
                {isMinimized ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar panel de líneas"
                className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted hover:text-ink active:scale-95 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Fila 2: Chips Circulares de Ramales (para líneas multiramal como la 194) */}
          {hasMultipleRamales && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-2">
              {diagram.ramalesDisponibles.map((ramal) => {
                const isRamalSelected = (selectedRamalId || diagram.ramalesDisponibles[0]?.id) === ramal.id;
                const letra = ramal.codigo || ramal.nombre.match(/Ramal\s+([A-Z])/i)?.[1] || ramal.nombre.charAt(0);
                return (
                  <button
                    key={ramal.id}
                    type="button"
                    onClick={() => {
                      onSelectRamalId?.(ramal.id);
                      setIsMinimized(true);
                    }}
                    title={ramal.nombre}
                    className={`w-7 h-7 rounded-full text-xs font-black shrink-0 transition-all flex items-center justify-center ${
                      isRamalSelected
                        ? "bg-[#16A34A] text-white shadow-xs scale-105 ring-2 ring-emerald-400/30"
                        : "bg-canvas-soft border border-hairline text-text-muted hover:text-ink"
                    }`}
                  >
                    {letra}
                  </button>
                );
              })}
            </div>
          )}

          {/* Fila 3: Botón de Sentido con Destino Dinámico + Conteo de Colectivos */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleSentido}
              title="Cambiar sentido del recorrido"
              className="flex items-center gap-2 group text-left min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink group-hover:bg-field transition-colors shrink-0">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block leading-none mb-0.5">
                  Sentido
                </span>
                <span className="text-xs font-bold text-ink truncate block leading-tight">
                  Hacia {diagram.destino}
                </span>
              </div>
            </button>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-soft border border-hairline text-text-muted text-[11px] font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{diagram.vehicles.length} en vivo</span>
            </span>
          </div>
        </div>

        {/* ─── Arteria Vertical Continua (Live Line Diagram) ────────────── */}
        <div className="flex-1 p-4 overflow-y-auto no-scrollbar overscroll-contain">
          <div className="relative pl-6">
            {/* Línea vertical continua que une de primera a última parada */}
            <div
              className="absolute left-[7px] top-2 bottom-3 w-[3px] rounded-full transition-colors"
              style={{ backgroundColor: diagram.color }}
            />

            {/* Elementos secuenciales: Paradas y Colectivos intercalados */}
            <div className="space-y-4">
              {timelineItems.map((item) => {
                if (item.type === "stop") {
                  const stop = item.data;
                  const isSelected = selectedParadaId === stop.id;
                  return (
                    <div
                      key={`stop-${stop.id}`}
                      onClick={() => handleStopClick(stop)}
                      className="relative flex items-start gap-3 cursor-pointer group"
                    >
                      {/* Nodo circular en la línea */}
                      <div
                        className={`absolute -left-[24px] top-0.5 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center bg-canvas ${
                          isSelected
                            ? "ring-4 ring-sky-400/30 scale-125"
                            : "group-hover:scale-110"
                        }`}
                        style={{ borderColor: diagram.color }}
                      >
                        {isSelected && (
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: diagram.color }}
                          />
                        )}
                      </div>

                      {/* Información de la Parada */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-tight transition-colors ${
                            isSelected
                              ? "font-black text-sky-600 dark:text-sky-400"
                              : "font-semibold text-ink group-hover:text-sky-600"
                          }`}
                        >
                          {stop.nombre}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Nodo de Colectivo en Vivo
                const veh = item.data;
                const isSelectedVeh = selectedUnitId === veh.unitId;
                return (
                  <div
                    key={`veh-${veh.lineId}-${veh.unitId}`}
                    onClick={() => handleVehicleClick(veh)}
                    className="relative ml-2 my-1 cursor-pointer group"
                  >
                    {/* Conector horizontal hacia la línea */}
                    <div
                      className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-4 h-[1.5px]"
                      style={{ backgroundColor: diagram.color }}
                    />

                    {/* Pastilla flotante del coche en vivo */}
                    <div
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-xs transition-all ${
                        isSelectedVeh
                          ? "bg-sky-500 text-white border-sky-400 scale-105"
                          : "bg-canvas-soft hover:bg-field border-hairline text-ink"
                      }`}
                    >
                      <BusFront className="w-3.5 h-3.5 shrink-0 text-sky-500 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-black">
                        Int. {veh.unitId}
                      </span>
                      <span className="text-[10px] font-medium opacity-80 border-l border-hairline pl-1.5 tabular-nums">
                        {veh.isDwelling ? (
                          <span className="text-amber-500 font-bold">En parada</span>
                        ) : (
                          `${Math.round(veh.speed)} km/h`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
