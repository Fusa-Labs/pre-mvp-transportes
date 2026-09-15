"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import LineSelectorBar, { getRamalLetter, getRamalDisplayName } from "@/components/ui-shell/LineSelectorBar";
import LiveTransportBubble from "@/components/ui-shell/LiveTransportBubble";
import HomeScreen from "@/components/home/HomeScreen";
import BottomNavBar from "@/components/navigation/BottomNavBar";
import ViajeHeader from "@/components/viaje/ViajeHeader";
import ViajePanel from "@/components/viaje/ViajePanel";
import { NavigationTab } from "@/types/home-navigation";
import { TransportService } from "@/lib/services/transport-service";
import { TripPlannerService } from "@/lib/services/trip-planner-service";
import { subscribeToPositions } from "@/mock/live";
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from "@/mock/data";
import { getRouteTrack, stopsAlongRoute, busProgressOn } from "@/lib/map/route-progress";
import type { VehiclePosition } from "@/lib/data-service";
import type { CameraMode } from "@/lib/map/camera-controller";
import type { MapFocusRequest, PlannerMapPoints, PlannerMapPulse } from "@/components/map/MapCanvas";
import { Parada } from "@/types/transport";
import { TripOption, LocationPoint } from "@/types/trip-planner";
import { Navigation, RotateCcw, Eye, X, Search } from "lucide-react";
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

  // ─── Estado del Modo "Viaje" (Ubicaciones Arbitrarias / Paradas / POIs) ──
  const [isTripMode, setIsTripMode] = useState<boolean>(false);
  const [originLocation, setOriginLocation] = useState<LocationPoint | null>(() => {
    return TripPlannerService.resolveLocationPoint("stop-65-05") || null; // Parque Centenario
  });
  const [destinationLocation, setDestinationLocation] = useState<LocationPoint | null>(() => {
    return TripPlannerService.resolveLocationPoint("stop-194-panamericana-parana") || null; // Unicenter
  });
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [mapPickTarget, setMapPickTarget] = useState<"origin" | "destination" | null>(null);

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

  const regularHighlightLines = useMemo(() => {
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

  // ─── Planificación de Viaje Reactiva Basada en Motor Real ────────────
  const tripOptions = useMemo(() => {
    if (!originLocation || !destinationLocation) return [];
    return TripPlannerService.planTrip(originLocation, destinationLocation);
  }, [originLocation, destinationLocation]);

  const selectedTrip = useMemo(() => {
    if (tripOptions.length === 0) return null;
    return tripOptions.find((t: TripOption) => t.id === selectedTripId) || tripOptions[0] || null;
  }, [tripOptions, selectedTripId]);

  // Al cambiar de opción, limpiar el paso seleccionado.
  useEffect(() => {
    setSelectedStepId(null);
  }, [selectedTrip?.id]);

  const effectiveHighlightLines = useMemo(() => {
    if (isTripMode && selectedTrip) {
      return selectedTrip.highlightLines;
    }
    return regularHighlightLines;
  }, [isTripMode, selectedTrip, regularHighlightLines]);

  const plannerPoints: PlannerMapPoints | null = useMemo(() => {
    if (!isTripMode) return null;
    return {
      origin: originLocation ? { lat: originLocation.lat, lng: originLocation.lng } : null,
      destination: destinationLocation
        ? { lat: destinationLocation.lat, lng: destinationLocation.lng }
        : null,
    };
  }, [isTripMode, originLocation, destinationLocation]);

  const plannerPulse: PlannerMapPulse | null = useMemo(() => {
    if (!isTripMode || !selectedTrip?.transferStopCoords) return null;
    return {
      lat: selectedTrip.transferStopCoords.lat,
      lng: selectedTrip.transferStopCoords.lng,
      color: selectedTrip.transferStopCoords.color || "#06B6D4",
    };
  }, [isTripMode, selectedTrip]);

  const focusRequest: MapFocusRequest | null = useMemo(() => {
    if (!isTripMode || !selectedTrip) return null;
    // Si hay un paso seleccionado, enfocar su geometría en vez del trip entero.
    if (selectedStepId) {
      const step = selectedTrip.steps.find((s) => s.id === selectedStepId);
      const leg = step?.legIndex !== undefined ? selectedTrip.legs[step.legIndex] : undefined;
      const coords = leg?.segmentCoordinates;
      if (coords && coords.length >= 2) {
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        for (const [lng, lat] of coords) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
        // Padding mínimo para que el segmento no quede pegado al borde.
        const padLng = Math.max((maxLng - minLng) * 0.3, 0.004);
        const padLat = Math.max((maxLat - minLat) * 0.3, 0.004);
        const nonce = `${selectedTrip.id}|${selectedStepId}`.split("").reduce((acc, c) => acc + c.charCodeAt(0), 1);
        return {
          bounds: [[minLng - padLng, minLat - padLat], [maxLng + padLng, maxLat + padLat]],
          nonce,
          bottomPadding: 220,
        };
      }
    }
    const nonce = selectedTrip.id
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 1);
    return {
      bounds: selectedTrip.bounds,
      nonce,
      bottomPadding: 220,
    };
  }, [isTripMode, selectedTrip, selectedStepId]);

    const handleStartMapPick = useCallback((target: "origin" | "destination") => {
    setMapPickTarget(target);
    setIsLineMenuOpen(false);
  }, []);

  const handleCancelMapPick = useCallback(() => {
    setMapPickTarget(null);
  }, []);

  const handleMapPick = useCallback(
    (lngLat: [number, number]) => {
      if (!mapPickTarget) return;
      const [lng, lat] = lngLat;
      const point = TripPlannerService.createMapLocationPoint(
        lat,
        lng,
        mapPickTarget === "origin" ? "Origen" : "Destino"
      );
      if (mapPickTarget === "origin") {
        setOriginLocation(point);
      } else {
        setDestinationLocation(point);
      }
      setMapPickTarget(null);
    },
    [mapPickTarget]
  );

  const handleToggleTripMode = useCallback(() => {
    if (activeTab !== "mapa") {
      setActiveTab("mapa");
      setIsTripMode(true);
      setIsLineMenuOpen(false);
    } else {
      setIsTripMode((prev) => {
        const next = !prev;
        if (next) {
          setIsLineMenuOpen(false);
        }
        return next;
      });
    }
  }, [activeTab]);

  const handleSwapPoints = useCallback(() => {
    setOriginLocation(destinationLocation);
    setDestinationLocation(originLocation);
  }, [originLocation, destinationLocation]);

  const handleCloseTripMode = useCallback(() => {
    setIsTripMode(false);
  }, []);

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
          {/* Header Flotante Superior: Búsqueda regular o Modo Viaje */}
          <div className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto flex flex-col items-center gap-2">
            {isTripMode ? (
              <ViajeHeader
                originLocation={originLocation}
                destinationLocation={destinationLocation}
                onSelectOrigin={setOriginLocation}
                onSelectDestination={setDestinationLocation}
                onSwapPoints={handleSwapPoints}
                onClose={handleCloseTripMode}
                userSimulatedLocationName="Parque Centenario (Ubicación simulada)"
                mapPickTarget={mapPickTarget}
                onStartMapPick={handleStartMapPick}
                onCancelMapPick={handleCancelMapPick}
              />
            ) : (
              <div className="w-full flex flex-col items-center gap-2">
                {/* Barra principal de búsqueda con Lupita: acceso directo a Modo Viaje */}
                <button
                  type="button"
                  onClick={() => setIsTripMode(true)}
                  title="Planificar viaje en transporte público"
                  aria-label="Abrir planificador de viaje"
                  className="w-full bg-canvas/95 dark:bg-canvas/95 backdrop-blur-xl border border-hairline rounded-full px-3.5 py-2 shadow-sm flex items-center justify-between text-left hover:bg-canvas-soft transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted group-hover:text-ink shrink-0">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-ink block leading-tight truncate">
                        ¿A dónde vas?
                      </span>
                      <span className="text-[10px] text-text-muted font-normal block truncate">
                        Escribí una dirección, lugar o parada
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-electric-blue px-2.5 py-0.5 rounded-full bg-electric-blue/10 shrink-0">
                    Viaje
                  </span>
                </button>

                {/* Píldora del Ramal Seleccionado */}
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
            )}
          </div>

          {/* Selector Vertical Jerárquico de Líneas (visible cuando no estamos en modo Viaje) */}
          {!isTripMode && (
            <LineSelectorBar
              lineas={lineas}
              selectedLineaId={selectedLineaId}
              selectedRamalId={selectedRamalId}
              onSelectLinea={handleSelectLinea}
              onSelectRamal={handleSelectRamal}
            />
          )}

          {/* Canvas de Mapa MapLibre WebGL */}
          <div className="absolute inset-0 z-0">
            <DynamicMap
              positions={filteredPositions}
              highlightLines={effectiveHighlightLines}
              onBusSelect={handleBusSelect}
              onStopSelect={handleSelectStopById}
              selectedStopId={selectedParada?.id || null}
              selectedKey={selectedKey}
              cameraMode={cameraMode}
              onCameraModeChange={setCameraMode}
              cameraBottomPadding={isTripMode ? 220 : 140}
              center={[-58.4250, -34.5950]}
              theme={resolvedTheme}
              focusRequest={focusRequest}
              plannerPoints={plannerPoints}
              plannerPulse={plannerPulse}
                  tripSegments={isTripMode && selectedTrip ? selectedTrip.segments : null}
                  tripUsedStopIds={isTripMode && selectedTrip ? selectedTrip.usedStopIds : null}
                  tripFocus={isTripMode && !!selectedTrip}
                  pickMode={Boolean(mapPickTarget)}
                  onMapPick={handleMapPick}
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

          {/* Panel de Viaje o Burbuja Flotante según el modo activo */}
          {isTripMode ? (
            <ViajePanel
              options={tripOptions}
              selectedOptionId={selectedTrip?.id || null}
              onSelectOption={(id) => { setSelectedTripId(id); setSelectedStepId(null); }}
              onClose={handleCloseTripMode}
              hasPointsSelected={Boolean(originLocation && destinationLocation)}
              originLocation={originLocation}
              destinationLocation={destinationLocation}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStepId}
            />
          ) : (
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
          )}
        </main>
      )}

      {/* Bottom Navigation Bar Flotante (Presente en todas las pestañas) */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLineMenuOpen={isLineMenuOpen}
        onToggleLineMenu={handleToggleLineMenu}
        isTripMode={isTripMode}
        onToggleTripMode={handleToggleTripMode}
      />
    </div>
  );
}
