"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import FloatingSearch from "@/components/ui-shell/FloatingSearch";
import LineSelectorBar, { getRamalLetter, getRamalDisplayName } from "@/components/ui-shell/LineSelectorBar";
import LiveTransportBubble from "@/components/ui-shell/LiveTransportBubble";
import HomeScreen from "@/components/home/HomeScreen";
import BottomNavBar from "@/components/navigation/BottomNavBar";
import { NavigationTab } from "@/types/home-navigation";
import { TransportService } from "@/lib/services/transport-service";
import { subscribeToPositions } from "@/mock/live";
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from "@/mock/data";
import { getRouteTrack, stopsAlongRoute, busProgressOn } from "@/lib/map/route-progress";
import type { VehiclePosition } from "@/lib/data-service";
import type { CameraMode } from "@/lib/map/camera-controller";
import { Parada } from "@/types/transport";
import { Navigation, RotateCcw, Eye, X } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const ALL_LINE_IDS = MOCK_LINES.map((l) => l.id);

export default function TransportesAppPage() {
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<NavigationTab>("home");
  const [isLineMenuOpen, setIsLineMenuOpen] = useState<boolean>(false);
  const lineas = useMemo(() => TransportService.getLineas(), []);
  const paradas = useMemo(() => TransportService.getParadas(), []);
  const alertas = useMemo(() => TransportService.getAlertas(), []);

  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: -34.604463,
    lng: -58.434711,
  });
  const [selectedLineaId, setSelectedLineaId] = useState<string | null>("line-65");
  const [selectedRamalId, setSelectedRamalId] = useState<string | null>(null);
  const [selectedParada, setSelectedParada] = useState<Parada | null>(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiclePosition | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>("overview");

  // Suscripción al feed GPS en tiempo real (1 Hz) de todas las unidades
  useEffect(() => {
    const unsubscribe = subscribeToPositions(ALL_LINE_IDS, (latestPositions) => {
      setPositions(latestPositions);

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

  const selectedRamal = useMemo(() => {
    if (!selectedLinea || !selectedRamalId) return null;
    return selectedLinea.ramalesDetalle?.find((r) => r.id === selectedRamalId) || null;
  }, [selectedLinea, selectedRamalId]);

  const highlightLines = useMemo(() => {
    if (selectedRamalId) return [selectedRamalId];
    if (selectedLineaId) return [selectedLineaId];
    return ALL_LINE_IDS;
  }, [selectedLineaId, selectedRamalId]);

  const filteredPositions = useMemo(() => {
    if (selectedRamalId) {
      return positions.filter((p) => p.ramalId === selectedRamalId);
    }
    if (selectedLineaId) {
      return positions.filter((p) => p.lineId === selectedLineaId);
    }
    return positions;
  }, [positions, selectedLineaId, selectedRamalId]);

  const selectedKey = useMemo(() => {
    return selectedVehiculo ? `${selectedVehiculo.lineId}-${selectedVehiculo.unitId}` : null;
  }, [selectedVehiculo]);

  const llegadas = useMemo(() => {
    if (!selectedParada) return [];
    return TransportService.getLlegadasPorParada(selectedParada.id, filteredPositions);
  }, [selectedParada, filteredPositions]);

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

  const handleToggleLineMenu = useCallback(() => {
    if (activeTab !== "mapa") {
      setActiveTab("mapa");
      setIsLineMenuOpen(true);
    } else {
      setIsLineMenuOpen((prev) => !prev);
    }
  }, [activeTab]);

  const handleSelectParada = useCallback((parada: Parada) => {
    setSelectedParada(parada);
    setSelectedVehiculo(null);
    setCameraMode("overview");
    setIsLineMenuOpen(true);
  }, []);

  const handleSelectStopById = useCallback((stopId: string) => {
    if (!stopId) {
      setSelectedParada(null);
      return;
    }
    const found = paradas.find((p) => p.id === stopId);
    if (found) {
      setSelectedParada((prev) => (prev?.id === stopId ? null : found));
      setSelectedVehiculo(null);
      setIsLineMenuOpen(true);
    } else {
      setSelectedParada(null);
    }
  }, [paradas]);

  const handleSelectLinea = useCallback((lineaId: string | null) => {
    setSelectedLineaId(lineaId);
    setSelectedRamalId(null);
    setSelectedVehiculo(null);
    setSelectedParada(null);
    setCameraMode("overview");
  }, []);

  const handleSelectRamal = useCallback((ramalId: string | null) => {
    setSelectedRamalId(ramalId);
    setSelectedVehiculo(null);
    setSelectedParada(null);
  }, []);

  const handleBusSelect = useCallback((pos: VehiclePosition | null) => {
    setSelectedVehiculo(pos);
    if (pos) {
      setSelectedLineaId(pos.lineId);
      setCameraMode("follow-vehicle");
      setIsLineMenuOpen(true);
    }
  }, []);

  const handleToggle3D = useCallback(() => {
    setCameraMode((prev) => (prev === "navigation-vehicle" ? "follow-vehicle" : "navigation-vehicle"));
  }, []);

  const handleResetCamera = useCallback(() => {
    setSelectedLineaId("line-65");
    setSelectedRamalId(null);
    setSelectedVehiculo(null);
    setSelectedParada(null);
    setCameraMode("overview");
  }, []);

  return (
    <div className="relative w-full h-full min-h-dvh overflow-hidden bg-background text-foreground select-none">
      {/* Vista de Home */}
      {activeTab === "home" && <HomeScreen />}

      {/* Vistas Secundarias / Placeholders para Tabs Adicionales */}
      {activeTab === "lineas" && (
        <div className="w-full min-h-screen p-6 flex flex-col items-center justify-center text-center bg-canvas">
          <h2 className="text-xl font-bold text-ink">Buscador y Listado de Líneas</h2>
          <p className="text-sm text-text-muted mt-2">Seleccioná una línea para ver su recorrido en el mapa.</p>
        </div>
      )}

      {activeTab === "paradas" && (
        <div className="w-full min-h-screen p-6 flex flex-col items-center justify-center text-center bg-canvas">
          <h2 className="text-xl font-bold text-ink">Mis Paradas Guardadas</h2>
          <p className="text-sm text-text-muted mt-2">Accedé rápidamente a tus paradas frecuentes.</p>
        </div>
      )}

      {activeTab === "perfil" && (
        <div className="w-full min-h-screen p-6 flex flex-col items-center justify-center text-center bg-canvas">
          <h2 className="text-xl font-bold text-ink">Mi Perfil y Configuración</h2>
          <p className="text-sm text-text-muted mt-2">Ajustes de la cuenta, alertas y temas.</p>
        </div>
      )}

      {/* Vista de Mapa Interactivo WebGL */}
      {activeTab === "mapa" && (
        <main className="relative w-screen h-[100dvh] overflow-hidden select-none bg-canvas text-foreground touch-manipulation">
          {/* Header Flotante Superior */}
          <div className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto flex flex-col items-center gap-2">
            <FloatingSearch
              lineas={lineas}
              paradas={paradas}
              onSelectLinea={handleSelectLinea}
              onSelectParada={handleSelectParada}
            />

            {/* Píldora del Ramal Seleccionado (Ubicada debajo de la barra de búsqueda) */}
            {selectedRamal && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-canvas/95 dark:bg-canvas/95 backdrop-blur-xl border border-hairline shadow-md text-xs pointer-events-auto max-w-full truncate">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedRamal.color || selectedLinea?.colorHex || "#1D4ED8" }}
                >
                  {getRamalLetter(selectedRamal)}
                </span>
                <span className="font-bold text-ink shrink-0">
                  {selectedRamal.codigo}:
                </span>
                <span className="text-text-muted font-medium truncate">
                  {getRamalDisplayName(selectedRamal)}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectRamal(null)}
                  title="Quitar filtro de ramal"
                  aria-label="Cerrar filtro de ramal"
                  className="ml-1 w-4 h-4 rounded-full bg-canvas-soft hover:bg-field border border-hairline flex items-center justify-center text-text-muted hover:text-ink shrink-0 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          {/* Selector Vertical Jerárquico de Líneas */}
          <LineSelectorBar
            lineas={lineas}
            selectedLineaId={selectedLineaId}
            selectedRamalId={selectedRamalId}
            onSelectLinea={handleSelectLinea}
            onSelectRamal={handleSelectRamal}
          />

          {/* Canvas de Mapa MapLibre WebGL */}
          <div className="absolute inset-0 z-0">
            <DynamicMap
              positions={filteredPositions}
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

          {/* Controles Flotantes en el Mapa */}
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

          {/* Burbuja Flotante de Información de Línea y Colectivos (Descansa sobre la Navbar sin taparla) */}
          <LiveTransportBubble
            isOpen={isLineMenuOpen}
            onClose={() => setIsLineMenuOpen(false)}
            selectedLinea={selectedLinea}
            selectedRamal={selectedRamal}
            selectedParada={selectedParada}
            paradas={paradas}
            llegadas={llegadas}
            alertas={alertas}
            totalVehiculosActivos={filteredPositions.length}
            onSelectParada={handleSelectParada}
            selectedVehiculo={selectedVehiculo}
            cameraMode={cameraMode}
            onToggle3D={selectedVehiculo ? handleToggle3D : undefined}
            timelineStops={timelineStops}
            busProgress={busProgress}
            busAlongM={busAlongM}
          />
        </main>
      )}

      {/* Bottom Navigation Bar Flotante (Presente en todas las pestañas) */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLineMenuOpen={isLineMenuOpen}
        onToggleLineMenu={handleToggleLineMenu}
      />
    </div>
  );
}
