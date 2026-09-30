"use client";

import { useEffect } from "react";
import { ArrowUpDown, X, Crosshair, MapPin } from "lucide-react";
import { LocationPoint } from "@/types/trip-planner";
import { GreenFlagUiIcon, CheckeredFlagUiIcon } from "@/components/viaje/ViajePanel";

interface ViajeHeaderProps {
  originLocation: LocationPoint | null;
  destinationLocation: LocationPoint | null;
  onSelectOrigin?: (location: LocationPoint) => void;
  onSelectDestination?: (location: LocationPoint) => void;
  onSwapPoints: () => void;
  onClose: () => void;
  userSimulatedLocationName?: string;
  onStartMapPick?: (target: "origin" | "destination") => void;
  mapPickTarget?: "origin" | "destination" | null;
  onCancelMapPick?: () => void;
  onClear?: () => void;
  onUseDeviceLocation?: () => void;
  geoLoading?: boolean;
  geoError?: string | null;
  initialCollapsed?: boolean;
  collapseWhenComplete?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/**
 * Cabecera de Modo Viaje: dos cápsulas informativas y simétricas.
 * - Cápsula Superior: Banderita verde + Parada de inicio + Pin de fijar en mapa.
 * - Cápsula Inferior: Banderita a cuadros + Parada de destino + Mismo pin de fijar en mapa.
 * - Botonera lateral: Swap (ArrowUpDown) y Cerrar Modo Viaje (X).
 */
export default function ViajeHeader({
  originLocation,
  destinationLocation,
  onSwapPoints,
  onClose,
  userSimulatedLocationName,
  onStartMapPick,
  mapPickTarget,
  onCancelMapPick,
  onCollapsedChange,
}: ViajeHeaderProps) {
  useEffect(() => {
    onCollapsedChange?.(false);
  }, [onCollapsedChange]);

  // ─── Modo Activo de Selección en el Mapa (Map Picker) ───────────────────
  if (mapPickTarget) {
    const isOrigin = mapPickTarget === "origin";
    return (
      <div className="relative w-full max-w-md mx-auto pointer-events-auto animate-in fade-in slide-in-from-top-3 duration-200">
        <div className="bg-canvas dark:bg-canvas border-2 border-electric-blue rounded-[26px] p-3.5 shadow-[0_16px_45px_-6px_rgba(0,102,255,0.3)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-electric-blue text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Crosshair className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-black text-ink block leading-tight truncate">
                Fijar {isOrigin ? "Origen" : "Destino"} en el mapa
              </span>
              <span className="text-[11px] text-text-muted font-medium block truncate mt-0.5">
                Tocá cualquier punto del mapa para colocar el pin
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelMapPick}
            className="px-3 py-1.5 rounded-full bg-canvas-soft hover:bg-field border border-hairline text-xs font-bold text-ink shrink-0 transition-all active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto pointer-events-auto">
      {/* Layout de dos cápsulas separadas e informativas con botones laterales */}
      <div className="flex items-center gap-2 w-full">
        {/* Columna de las dos cápsulas */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Cápsula 1 (Superior): Origen con Banderita Verde + Pin */}
          <div className="relative flex items-center bg-canvas dark:bg-canvas border border-hairline rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-5 flex justify-center shrink-0 mr-1.5">
              <GreenFlagUiIcon className="w-4 h-4 shrink-0" />
            </div>
            <span className="text-xs font-bold text-ink truncate flex-1 leading-tight select-none">
              {originLocation?.name || userSimulatedLocationName || "Parada de origen"}
            </span>
            <button
              type="button"
              onClick={() => onStartMapPick?.("origin")}
              title="Fijar pin de origen en el mapa"
              aria-label="Fijar origen en el mapa"
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-ink hover:bg-canvas-soft transition-colors active:scale-90 shrink-0 ml-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

          {/* Cápsula 2 (Inferior): Destino con Banderita a Cuadros + Pin */}
          <div className="relative flex items-center bg-canvas dark:bg-canvas border border-hairline rounded-full px-3 py-1.5 shadow-sm">
            <div className="w-5 flex justify-center shrink-0 mr-1.5">
              <CheckeredFlagUiIcon className="w-4 h-4 shrink-0" />
            </div>
            <span className="text-xs font-bold text-ink truncate flex-1 leading-tight select-none">
              {destinationLocation?.name || "Parada de destino"}
            </span>
            <button
              type="button"
              onClick={() => onStartMapPick?.("destination")}
              title="Fijar pin de destino en el mapa"
              aria-label="Fijar destino en el mapa"
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-ink hover:bg-canvas-soft transition-colors active:scale-90 shrink-0 ml-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-text-muted hover:text-ink" />
            </button>
          </div>
        </div>

        {/* Columna lateral de acciones: Swap (ArrowUpDown) y Cerrar Modo Viaje (X) */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onSwapPoints}
            title="Invertir origen y destino"
            aria-label="Invertir origen y destino"
            className="w-8 h-8 rounded-full bg-canvas dark:bg-canvas border border-hairline flex items-center justify-center text-ink shadow-sm hover:bg-canvas-soft active:scale-90 transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Salir de Modo Viaje"
            aria-label="Cerrar Modo Viaje"
            className="w-8 h-8 rounded-full bg-canvas dark:bg-canvas border border-hairline flex items-center justify-center text-text-muted hover:text-ink shadow-sm hover:bg-canvas-soft active:scale-90 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
