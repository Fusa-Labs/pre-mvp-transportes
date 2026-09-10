"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { Linea, VehiculoEnVivo } from "@/types/transport";

interface LiveBusesLayerProps {
  map: maplibregl.Map | null;
  vehiculos: VehiculoEnVivo[];
  lineas: Linea[];
  onSelectVehiculo?: (vehiculo: VehiculoEnVivo) => void;
}

/**
 * Componente modular LiveBusesLayer.
 * Responsable de la renderización reactiva de vehículos en tiempo real,
 * orientación por rumbo (bearing) e indicadores de línea y estado.
 */
export default function LiveBusesLayer({
  map,
  vehiculos,
  lineas,
  onSelectVehiculo,
}: LiveBusesLayerProps) {
  const busMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    // 1. Eliminar marcadores de vehículos que ya no están activos
    busMarkersRef.current.forEach((marker, id) => {
      if (!vehiculos.some((v) => v.id === id)) {
        marker.remove();
        busMarkersRef.current.delete(id);
      }
    });

    // 2. Renderizar / actualizar vehículos
    vehiculos.forEach((vehiculo) => {
      const linea = lineas.find((l) => l.id === vehiculo.lineaId);
      const color = linea?.colorHex || "#f59e0b";
      const textColor = linea?.textColorHex || "#000000";
      const existingMarker = busMarkersRef.current.get(vehiculo.id);

      if (!existingMarker) {
        const el = document.createElement("div");
        el.className = "relative cursor-pointer transition-transform duration-300 group";
        el.style.transform = `rotate(${vehiculo.bearing}deg)`;

        el.innerHTML = `
          <div class="bus-marker-pulse relative flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 border-white" style="background-color: ${color};">
            <span class="text-[11px] font-black tracking-tight select-none" style="color: ${textColor}; transform: rotate(-${vehiculo.bearing}deg);">${linea?.numero || ""}</span>
            <div class="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-slate-950"></div>
          </div>
          <div class="hidden group-hover:flex absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50 border border-slate-700">
            Int. ${vehiculo.interno} • ${vehiculo.velocidadKmH} km/h
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectVehiculo?.(vehiculo);
        });

        const newMarker = new maplibregl.Marker({ element: el })
          .setLngLat([vehiculo.lng, vehiculo.lat])
          .addTo(map);

        busMarkersRef.current.set(vehiculo.id, newMarker);
      } else {
        // Actualizar coordenadas y rumbo sin destruir el nodo DOM
        existingMarker.setLngLat([vehiculo.lng, vehiculo.lat]);
        const el = existingMarker.getElement();
        el.style.transform = `rotate(${vehiculo.bearing}deg)`;

        // Contrarrotar el texto del número para que siempre se lea derecho
        const span = el.querySelector("span");
        if (span) {
          span.style.transform = `rotate(-${vehiculo.bearing}deg)`;
        }
      }
    });
  }, [map, vehiculos, lineas, onSelectVehiculo]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      busMarkersRef.current.forEach((marker) => marker.remove());
      busMarkersRef.current.clear();
    };
  }, []);

  return null;
}
