"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import FloatingSearch from "@/components/ui-shell/FloatingSearch";
import BottomSheetPanel from "@/components/ui-shell/BottomSheetPanel";
import { TransportService } from "@/lib/services/transport-service";
import { subscribeToPositions } from "@/mock/live";
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from "@/mock/data";
import { getRouteTrack, stopsAlongRoute, busProgressOn } from "@/lib/map/route-progress";
import type { VehiclePosition } from "@/lib/data-service";
import type { CameraMode } from "@/lib/map/camera-controller";
import { Parada } from "@/types/transport";
import { Navigation, RotateCcw, Eye } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const ALL_LINE_IDS = MOCK_LINES.map((l) => l.id);

/**
 * Vista Principal de la Maqueta de Transportes AMBA.
 * Implementación del Motor Funcional (Colectivos AMBA / MapLibre GL WebGL GPU):
 * - Renderizado en GPU con capas GeoJSON y LOD dinámico (Badge -> Cenital -> Isométrico 3D).
 * - Motor de interpolación LERP a 60fps con dead-reckoning sobre feed de 1 Hz.
 * - Controlador cinemático de cámara (overview, follow-vehicle, navigation-vehicle 3D a 52° de pitch).
 * - Safe areas para notch y home bar en dispositivos móviles (100dvh).
 */
export default function TransportesAppPage() {
  const { resolvedTheme } = useTheme();
  const lineas = useMemo(() => TransportService.getLineas(), []);
  const paradas = useMemo(() => TransportService.getParadas(), []);
  const alertas = useMemo(() => TransportService.getAlertas(), []);

  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: -34.604463,
    lng: -58.434711,
  });
  const [selectedLineaId, setSelectedLineaId] = useState<string | null>("line-65");
  const [selectedParada, setSelectedParada] = useState<Parada | null>(paradas[0] || null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiclePosition | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");

  // Suscripción al feed GPS en tiempo real (1 Hz) de todas las unidades
  useEffect(() => {
    const unsubscribe = subscribeToPositions(ALL_LINE_IDS, (latestPositions) => {
      setPositions(latestPositions);

      // Si hay un colectivo seleccionado, mantener sus coordenadas frescas en el panel
      setSelectedVehiculo((current) => {
        if (!current) return null;
        const updated = latestPositions.find(
          (p) => p.lineId === current.lineId && p.unitId === current.unitId,
        );
        return updated || current;
      });
    });

    return () => unsubscribe();
  }, []);

  const selectedLinea = useMemo(() => {
    return selectedLineaId ? lineas.find((l) => l.id === selectedLineaId) || null : null;
  }, [selectedLineaId, lineas]);

  const highlightLines = useMemo(() => {
    return selectedLineaId ? [selectedLineaId] : ALL_LINE_IDS;
  }, [selectedLineaId]);

  const selectedKey = useMemo(() => {
    return selectedVehiculo ? `${selectedVehiculo.lineId}-${selectedVehiculo.unitId}` : null;
  }, [selectedVehiculo]);

  const llegadas = useMemo(() => {
    if (!selectedParada) return [];
    return TransportService.getLlegadasPorParada(selectedParada.id, positions);
  }, [selectedParada, positions]);

  // Cronograma vertical para el colectivo seleccionado
  const timelineStops = useMemo(() => {
    if (!selectedVehiculo) return [];
    const coords = MOCK_ROUTES[selectedVehiculo.lineId];
    if (!coords || coords.length < 2) return [];
    const track = getRouteTrack(selectedVehiculo.lineId, coords);
    if (!track) return [];
    const lineStops = MOCK_STOPS.filter((s) => s.lineIds.includes(selectedVehiculo.lineId));
    return stopsAlongRoute(track, lineStops);
  }, [selectedVehiculo]);

  const busProgress = useMemo(() => {
    if (!selectedVehiculo) return 0;
    const coords = MOCK_ROUTES[selectedVehiculo.lineId];
    if (!coords || coords.length < 2) return 0;
    const track = getRouteTrack(selectedVehiculo.lineId, coords);
    if (!track) return 0;
    return busProgressOn(track, { lng: selectedVehiculo.lng, lat: selectedVehiculo.lat });
  }, [selectedVehiculo]);

  const busAlongM = useMemo(() => {
    if (!selectedVehiculo) return 0;
    const coords = MOCK_ROUTES[selectedVehiculo.lineId];
    if (!coords || coords.length < 2) return 0;
    const track = getRouteTrack(selectedVehiculo.lineId, coords);
    if (!track) return 0;
    return track.project(selectedVehiculo.lng, selectedVehiculo.lat).alongM;
  }, [selectedVehiculo]);

  const handleSelectParada = useCallback((parada: Parada) => {
    setSelectedParada(parada);
    setSelectedVehiculo(null);
    setCameraMode("overview");
  }, []);

  const handleSelectStopById = useCallback((stopId: string) => {
    const found = paradas.find((p) => p.id === stopId);
    if (found) {
      setSelectedParada(found);
      setSelectedVehiculo(null);
      setCameraMode("overview");
    }
  }, [paradas]);

  const handleSelectLinea = useCallback((lineaId: string | null) => {
    setSelectedLineaId(lineaId);
    setSelectedVehiculo(null);
    setCameraMode("overview");
  }, []);

  const handleBusSelect = useCallback((pos: VehiclePosition | null) => {
    setSelectedVehiculo(pos);
    if (pos) {
      setSelectedLineaId(pos.lineId);
      setCameraMode("follow-vehicle");
    }
  }, []);

  const handleToggle3D = useCallback(() => {
    setCameraMode((prev) => (prev === "navigation-vehicle" ? "follow-vehicle" : "navigation-vehicle"));
  }, []);

  const handleResetCamera = useCallback(() => {
    setSelectedLineaId("line-65");
    setSelectedVehiculo(null);
    setCameraMode("overview");
    if (paradas[0]) setSelectedParada(paradas[0]);
  }, [paradas]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden select-none bg-canvas text-foreground touch-manipulation">
      {/* 1. Header Flotante Superior: Safe-Area-Top (Notch / Dynamic Island) */}
      <div className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto flex flex-col gap-2">
        <FloatingSearch
          lineas={lineas}
          paradas={paradas}
          onSelectLinea={handleSelectLinea}
          onSelectParada={handleSelectParada}
        />
      </div>

      {/* 2. Canvas de Mapa MapLibre WebGL (Motor Funcional GPU 60fps) */}
      <div className="absolute inset-0 z-0">
        <DynamicMap
          positions={positions}
          highlightLines={highlightLines}
          onBusSelect={handleBusSelect}
          onStopSelect={handleSelectStopById}
          selectedStopId={selectedParada?.id || null}
          selectedKey={selectedKey}
          cameraMode={cameraMode}
          onCameraModeChange={setCameraMode}
          cameraBottomPadding={140}
          center={[-58.4250, -34.5950]}
          theme={resolvedTheme}
          className="w-full h-full"
        />
      </div>

      {/* 3. Controles Flotantes en el Mapa con Touch Targets de 44px */}
      <div className="absolute right-4 top-[calc(max(14px,env(safe-area-inset-top))+184px)] z-20 flex flex-col gap-2 pointer-events-auto items-center w-10">
        <ThemeToggle />

        <button
          onClick={handleResetCamera}
          title="Centrar en AMBA"
          aria-label="Centrar vista en AMBA"
          className="w-10 h-10 rounded-full bg-canvas/95 border border-hairline flex items-center justify-center text-foreground hover:bg-canvas-soft active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {selectedVehiculo && (
          <button
            onClick={handleToggle3D}
            title={cameraMode === "navigation-vehicle" ? "Vista 2D Cenital" : "Seguir en 3D"}
            aria-label="Alternar modo 3D"
            className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-all ${
              cameraMode === "navigation-vehicle"
                ? "bg-primary text-primary-foreground border-primary font-medium"
                : "bg-canvas/95 text-foreground border-hairline hover:bg-canvas-soft"
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => {
            setUserLocation((prev) =>
              prev ? null : { lat: -34.604463, lng: -58.434711 }
            );
          }}
          title={userLocation ? "Desactivar mi ubicación simulada" : "Activar mi ubicación simulada (Parque Centenario)"}
          aria-label="Alternar mi posición simulada"
          className={`w-10 h-10 rounded-full border flex items-center justify-center active:scale-95 transition-all ${
            userLocation
              ? "bg-primary text-primary-foreground border-primary font-medium"
              : "bg-canvas/95 text-text-muted border-hairline hover:bg-canvas-soft"
          }`}
        >
          <Navigation className={`w-4 h-4 ${userLocation ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* 4. Panel Inferior Deslizable con Safe-Area-Bottom (Home Indicator) */}
      <BottomSheetPanel
        selectedLinea={selectedLinea}
        selectedParada={selectedParada}
        paradas={paradas}
        llegadas={llegadas}
        alertas={alertas}
        totalVehiculosActivos={positions.length}
        positions={positions}
        userLocation={userLocation}
        onSelectParada={handleSelectParada}
        onClearSelection={() => {
          setSelectedLineaId(null);
          setSelectedParada(null);
          setSelectedVehiculo(null);
          setCameraMode("overview");
        }}
        selectedVehiculo={selectedVehiculo}
        cameraMode={cameraMode}
        onToggle3D={selectedVehiculo ? handleToggle3D : undefined}
        timelineStops={timelineStops}
        busProgress={busProgress}
        busAlongM={busAlongM}
      />
    </main>
  );
}
