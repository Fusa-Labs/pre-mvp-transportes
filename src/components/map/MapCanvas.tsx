"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";

interface MapCanvasProps {
  recorridos: Recorrido[];
  lineas: Linea[];
  paradas: Parada[];
  vehiculos: VehiculoEnVivo[];
  selectedLineaId: string | null;
  selectedParada: Parada | null;
  onSelectParada: (parada: Parada) => void;
  onSelectVehiculo?: (vehiculo: VehiculoEnVivo) => void;
}

export default function MapCanvas({
  recorridos,
  lineas,
  paradas,
  vehiculos,
  selectedLineaId,
  selectedParada,
  onSelectParada,
  onSelectVehiculo,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const busMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const stopMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // 1. Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-58.42, -34.60], // Buenos Aires (AMBA)
      zoom: 12.3,
      pitch: 35, // Vista sutil en perspectiva moderna
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");

    map.on("load", () => {
      mapRef.current = map;

      // Fuente GeoJSON para recorridos
      map.addSource("routes-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Capa de trazado (glow inferior para profundidad)
      map.addLayer({
        id: "routes-glow",
        type: "line",
        source: "routes-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 8,
          "line-opacity": 0.25,
        },
      });

      // Capa de trazado principal
      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 4.5,
          "line-opacity": 0.9,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Actualizar trazado de recorridos
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getSource("routes-source")) return;

    const filteredRecorridos = selectedLineaId
      ? recorridos.filter((r) => r.lineaId === selectedLineaId)
      : recorridos;

    const features = filteredRecorridos.map((r) => {
      const linea = lineas.find((l) => l.id === r.lineaId);
      return {
        type: "Feature" as const,
        properties: {
          id: r.id,
          lineaId: r.lineaId,
          ramal: r.ramal,
          color: linea?.colorHex || "#f59e0b",
        },
        geometry: {
          type: "LineString" as const,
          coordinates: r.coordenadas,
        },
      };
    });

    const source = map.getSource("routes-source") as maplibregl.GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features,
    });

    // Si hay una línea seleccionada, ajustar cámara al recorrido
    if (selectedLineaId && filteredRecorridos.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filteredRecorridos.forEach((r) => {
        r.coordenadas.forEach((coord) => bounds.extend(coord));
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 120, bottom: 260, left: 40, right: 40 },
          maxZoom: 14.5,
          duration: 1200,
        });
      }
    }
  }, [recorridos, lineas, selectedLineaId]);

  // 3. Marcadores de Paradas
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const filteredParadas = selectedLineaId
      ? paradas.filter((p) => p.lineasIds.includes(selectedLineaId))
      : paradas;

    // Limpiar marcadores obsoletos
    stopMarkersRef.current.forEach((marker, id) => {
      if (!filteredParadas.some((p) => p.id === id)) {
        marker.remove();
        stopMarkersRef.current.delete(id);
      }
    });

    filteredParadas.forEach((parada) => {
      const existingMarker = stopMarkersRef.current.get(parada.id);

      if (!existingMarker) {
        const el = document.createElement("div");
        el.className = "cursor-pointer group flex flex-col items-center";
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-md flex items-center justify-center text-white transition-transform group-hover:scale-125">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <div class="hidden group-hover:block bg-slate-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-lg whitespace-nowrap mt-1">
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
      }
    });
  }, [paradas, selectedLineaId, onSelectParada]);

  // 4. Centrar en parada seleccionada si cambia
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedParada) return;

    map.flyTo({
      center: [selectedParada.lng, selectedParada.lat],
      zoom: 15.5,
      pitch: 45,
      duration: 1000,
    });
  }, [selectedParada]);

  // 5. Marcadores de Colectivos en tiempo real
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Eliminar marcadores que ya no están en la lista filtrada
    busMarkersRef.current.forEach((marker, id) => {
      if (!vehiculos.some((v) => v.id === id)) {
        marker.remove();
        busMarkersRef.current.delete(id);
      }
    });

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
            <span class="text-[11px] font-black tracking-tight" style="color: ${textColor}; transform: rotate(-${vehiculo.bearing}deg);">${linea?.numero || ""}</span>
            <div class="absolute -top-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-slate-950"></div>
          </div>
          <div class="hidden group-hover:flex absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">
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
        // Actualizar posición y rotación suavemente
        existingMarker.setLngLat([vehiculo.lng, vehiculo.lat]);
        const el = existingMarker.getElement();
        el.style.transform = `rotate(${vehiculo.bearing}deg)`;
        const span = el.querySelector("span");
        if (span) {
          span.style.transform = `rotate(-${vehiculo.bearing}deg)`;
        }
      }
    });
  }, [vehiculos, lineas, onSelectVehiculo]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
