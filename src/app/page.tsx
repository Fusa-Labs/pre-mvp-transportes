"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import FloatingSearch from "@/components/ui-shell/FloatingSearch";
import LineSelectorBar from "@/components/ui-shell/LineSelectorBar";
import BottomSheetPanel from "@/components/ui-shell/BottomSheetPanel";
import { TransportService } from "@/lib/services/transport-service";
import { subscribeToPositions } from "@/mock/live";
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from "@/mock/data";
import { getRouteTrack, stopsAlongRoute, busProgressOn } from "@/lib/map/route-progress";
import type { VehiclePosition } from "@/lib/data-service";
import type { CameraMode } from "@/lib/map/camera-controller";
import { Parada } from "@/types/transport";
import { Navigation, RotateCcw, Bus, Eye } from "lucide-react";

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
  const lineas = useMemo(() => TransportService.getLineas(), []);
  const paradas = useMemo(() => TransportService.getParadas(), []);
  const alertas = useMemo(() => TransportService.getAlertas(), []);

  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [selectedLineaId, setSelectedLineaId] = useState<string | null>(null);
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
    return TransportService.getLlegadasPorParada(selectedParada.id);
  }, [selectedParada]);

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

  const handleSelectParada = useCallback((parada: Parada) => {
    setSelectedParada(parada);
  }, []);

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
    setSelectedLineaId(null);
    setSelectedVehiculo(null);
    setCameraMode("overview");
    if (paradas[0]) setSelectedParada(paradas[0]);
  }, [paradas]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden select-none bg-slate-950 touch-manipulation">
      {/* 1. Header Flotante Superior: Safe-Area-Top (Notch / Dynamic Island) */}
      <div className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto flex flex-col gap-2">
        <FloatingSearch
          lineas={lineas}
          paradas={paradas}
          onSelectLinea={handleSelectLinea}
          onSelectParada={handleSelectParada}
        />

        <LineSelectorBar
          lineas={lineas}
          selectedLineaId={selectedLineaId}
          onSelectLinea={handleSelectLinea}
        />
      </div>

      {/* 2. Canvas de Mapa MapLibre WebGL (Motor Funcional GPU 60fps) */}
      <DynamicMap
        positions={positions}
        highlightLines={highlightLines}
        onBusSelect={handleBusSelect}
        selectedKey={selectedKey}
        cameraMode={cameraMode}
        onCameraModeChange={setCameraMode}
        cameraBottomPadding={140}
        center={[-58.3816, -34.6037]}
        theme="light"
        className="w-full h-full"
      />

      {/* 3. Controles Flotantes en el Mapa con Touch Targets de 44px */}
      <div className="absolute right-4 top-[calc(max(14px,env(safe-area-inset-top))+124px)] z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleResetCamera}
          title="Centrar en AMBA"
          aria-label="Centrar vista en AMBA"
          className="w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white active:scale-90 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {selectedVehiculo && (
          <button
            onClick={handleToggle3D}
            title={cameraMode === "navigation-vehicle" ? "Vista 2D Cenital" : "Seguir en 3D"}
            aria-label="Alternar modo 3D"
            className={`w-11 h-11 rounded-full shadow-lg border flex items-center justify-center active:scale-90 transition-all ${
              cameraMode === "navigation-vehicle"
                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                : "bg-white/95 dark:bg-zinc-900/95 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-zinc-700"
            }`}
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => {
            if (paradas[1]) setSelectedParada(paradas[1]);
          }}
          title="Mi Ubicación Simulada"
          aria-label="Ubicar mi posición simulada"
          className="w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-white active:scale-90 transition-all"
        >
          <Navigation className="w-5 h-5 fill-amber-500/20" />
        </button>
      </div>

      {/* 4. Pastilla Informativa de Flota Activa */}
      <div className="absolute left-4 top-[calc(max(14px,env(safe-area-inset-top))+124px)] z-20 pointer-events-none hidden sm:block">
        <div className="bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-2 rounded-full border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs font-semibold">
          <Bus className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{positions.length} colectivos en vivo</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">AMBA Conectado</span>
        </div>
      </div>

      {/* 5. Panel Inferior Deslizable con Safe-Area-Bottom (Home Indicator) */}
      <BottomSheetPanel
        selectedLinea={selectedLinea}
        selectedParada={selectedParada}
        paradas={paradas}
        llegadas={llegadas}
        alertas={alertas}
        totalVehiculosActivos={positions.length}
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
      />
    </main>
  );
}
