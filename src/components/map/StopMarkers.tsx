"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { Parada } from "@/types/transport";

interface StopMarkersProps {
  map: maplibregl.Map | null;
  paradas: Parada[];
  selectedLineaId: string | null;
  selectedParada: Parada | null;
  onSelectParada: (parada: Parada) => void;
}

/**
 * Componente modular StopMarkers.
 * Responsable de la visualización, filtrado e interactividad (click-to-focus) de paradas.
 */
export default function StopMarkers({
  map,
  paradas,
  selectedLineaId,
  selectedParada,
  onSelectParada,
}: StopMarkersProps) {
  const stopMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // 1. Renderizar y actualizar marcadores de paradas
  useEffect(() => {
    if (!map) return;

    const filteredParadas = selectedLineaId
      ? paradas.filter((p) => p.lineasIds.includes(selectedLineaId))
      : paradas;

    // Eliminar marcadores que ya no correspondan al filtro
    stopMarkersRef.current.forEach((marker, id) => {
      if (!filteredParadas.some((p) => p.id === id)) {
        marker.remove();
        stopMarkersRef.current.delete(id);
      }
    });

    filteredParadas.forEach((parada) => {
      const isSelected = selectedParada?.id === parada.id;
      const existingMarker = stopMarkersRef.current.get(parada.id);

      if (!existingMarker) {
        const el = document.createElement("div");
        el.className = "cursor-pointer group flex flex-col items-center transition-transform hover:scale-115";
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full ${
            isSelected
              ? "bg-amber-500 border-2 border-white ring-4 ring-amber-500/40 scale-125"
              : "bg-slate-900 border-2 border-white"
          } shadow-md flex items-center justify-center text-white transition-all">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="${
            isSelected ? "block" : "hidden group-hover:block"
          } bg-slate-900/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap mt-1 border border-slate-700">
            ${parada.nombre}
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onSelectParada(parada);
        });

        const newMarker = new maplibregl.Marker({ element: el })
          .setLngLat([parada.lng, parada.lat])
          .addTo(map);

        stopMarkersRef.current.set(parada.id, newMarker);
      } else {
        existingMarker.setLngLat([parada.lng, parada.lat]);
        const innerCircle = existingMarker.getElement().querySelector(".rounded-full");
        if (innerCircle) {
          if (isSelected) {
            innerCircle.className =
              "w-6 h-6 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-500/40 scale-125 shadow-md flex items-center justify-center text-white transition-all";
          } else {
            innerCircle.className =
              "w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-white transition-all";
          }
        }
      }
    });
  }, [map, paradas, selectedLineaId, selectedParada, onSelectParada]);

  // 2. Centrado automático (Click-to-Focus) al cambiar la parada activa
  useEffect(() => {
    if (!map || !selectedParada) return;

    map.flyTo({
      center: [selectedParada.lng, selectedParada.lat],
      zoom: 15.5,
      pitch: 45,
      duration: 1000,
    });
  }, [map, selectedParada]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      stopMarkersRef.current.forEach((marker) => marker.remove());
      stopMarkersRef.current.clear();
    };
  }, []);

  return null;
}
