"use client";

import { useEffect } from "react";
import * as maplibregl from "maplibre-gl";
import { Linea, Recorrido } from "@/types/transport";

interface RoutePolylineProps {
  map: maplibregl.Map | null;
  recorridos: Recorrido[];
  lineas: Linea[];
  selectedLineaId: string | null;
}

/**
 * Componente modular RoutePolyline.
 * Responsable exclusivo de las capas de trazas y recorridos en MapLibre GL.
 */
export default function RoutePolyline({
  map,
  recorridos,
  lineas,
  selectedLineaId,
}: RoutePolylineProps) {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    // 1. Asegurar la fuente GeoJSON
    if (!map.getSource("routes-source")) {
      map.addSource("routes-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Capa de glow inferior para dar volumen y visibilidad urbana
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
          "line-opacity": 0.28,
        },
      });

      // Capa principal de la polilínea
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
          "line-opacity": 0.92,
        },
      });
    }

    // 2. Filtrar recorridos según línea seleccionada
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

    const source = map.getSource("routes-source") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features,
      });
    }

    // 3. Ajustar cámara (fitBounds) con animación fluida si hay línea activa
    if (selectedLineaId && filteredRecorridos.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      filteredRecorridos.forEach((r) => {
        r.coordenadas.forEach((coord) => bounds.extend(coord));
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: { top: 110, bottom: 270, left: 40, right: 40 },
          maxZoom: 14.5,
          duration: 1200,
        });
      }
    }
  }, [map, recorridos, lineas, selectedLineaId]);

  return null;
}
