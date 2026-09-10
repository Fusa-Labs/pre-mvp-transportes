"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";
import RoutePolyline from "./RoutePolyline";
import StopMarkers from "./StopMarkers";
import LiveBusesLayer from "./LiveBusesLayer";

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

/**
 * Componente principal MapCanvas.
 * Inicializa MapLibre GL, gestiona el canvas de navegación y compone
 * de forma modular las capas RoutePolyline, StopMarkers y LiveBusesLayer.
 */
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
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Inicialización única de MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [-58.42, -34.60], // Coordenadas del Área Metropolitana de Buenos Aires
      zoom: 12.3,
      pitch: 35, // Perspectiva sutil isométrica
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, showZoom: true }),
      "top-right"
    );

    map.on("load", () => {
      setMapInstance(map);
    });

    return () => {
      map.remove();
      setMapInstance(null);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Sub-módulos desacoplados del Map Engine */}
      {mapInstance && (
        <>
          <RoutePolyline
            map={mapInstance}
            recorridos={recorridos}
            lineas={lineas}
            selectedLineaId={selectedLineaId}
          />
          <StopMarkers
            map={mapInstance}
            paradas={paradas}
            selectedLineaId={selectedLineaId}
            selectedParada={selectedParada}
            onSelectParada={onSelectParada}
          />
          <LiveBusesLayer
            map={mapInstance}
            vehiculos={vehiculos}
            lineas={lineas}
            onSelectVehiculo={onSelectVehiculo}
          />
        </>
      )}
    </div>
  );
}
