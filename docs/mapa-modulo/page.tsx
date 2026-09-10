/**
 * Pantalla Mapa — Mapa en vivo con vehículos (RutaBA)
 *
 * - Header: back + "Mapa en vivo" + contador + leyenda
 * - Chips por línea: activan el recorrido pintado de esa línea
 * - Recorridos: SOLO se pintan si la línea está seleccionada
 * - Tocar un colectivo → tarjeta premium con GPS en vivo y ETA
 * - Inmersiva (sin BottomNav)
 */

'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from '@/mock/data';
import { subscribeToPositions } from '@/mock/live';
import type { VehiclePosition } from '@/lib/data-service';
import { cn } from '@/lib/utils';
import type { CameraMode } from '@/lib/map/camera-controller';
import { getRouteTrack, stopsAlongRoute } from '@/lib/map/route-progress';
import { useUserLocation } from '@/hooks/use-user-location';
import type { SheetDetent } from '@/components/ui/bottom-sheet';
import { MapSheet, LINE_ONCOLOR, type SelectedVehicle } from '@/components/features/mapa/map-sheet';
import type { MapFocusRequest } from '@/components/features/mapa/map-canvas';
import {
  TripPlannerSheet,
  type PlannerDraft,
  type PlannerPickResult,
} from '@/components/features/planner/trip-planner-sheet';
import type { PlannerField } from '@/components/features/planner/route-input-group';
import type { TripMatch, LocationItem } from '@/lib/planner/types';

/**
 * Principio ZERO SSR LEAKS: MapLibre/WebGL/DOM viven solo en cliente.
 * next/dynamic con ssr:false evita cualquier evaluación de maplibre-gl
 * durante el prerender del servidor.
 */
const MapCanvas = dynamic(
  () => import('@/components/features/mapa/map-canvas').then((m) => m.MapCanvas),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-surface-container-high animate-pulse" /> },
);

const ALL_LINE_IDS = MOCK_LINES.map((l) => l.id);

export default function MapaPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  // Red completa visible al entrar: los colectivos viajan SOBRE sus líneas
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(ALL_LINE_IDS);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<{ lineId: string; unitId: string } | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview');
  const [sheetHeight, setSheetHeight] = useState(116);
  const [sheetDetent, setSheetDetent] = useState<SheetDetent>('collapsed');
  const [showLegend, setShowLegend] = useState(false);
  // ─── Planifica tu viaje (Fase 2) ──────────────────────────
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [pickTarget, setPickTarget] = useState<PlannerField | null>(null);
  const [pickResult, setPickResult] = useState<PlannerPickResult | null>(null);
  // Fase 4: borrador vigente → marcadores + parada con pulso en el mapa.
  const [plannerDraft, setPlannerDraft] = useState<PlannerDraft | null>(null);
  // Fase 3: encuadre del viaje planificado (nonce re-dispara el fitBounds)
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);

  const handlePlanned = useCallback(
    (matches: TripMatch[], origin: LocationItem, destination: LocationItem) => {
      // Las líneas que cubren el viaje quedan pintadas (mismas capas que
      // los chips) y la cámara encuadra origen + destino con aire para
      // el sheet.
      setSelectedRoutes(matches.length > 0 ? matches.map((m) => m.lineId) : []);
      const o = origin.coordinates;
      const d = destination.coordinates;
      const pad = 0.006; // ~650 m de contexto alrededor de cada extremo
      const lngMin = Math.min(o.lng, d.lng) - pad;
      const lngMax = Math.max(o.lng, d.lng) + pad;
      const latMin = Math.min(o.lat, d.lat) - pad;
      const latMax = Math.max(o.lat, d.lat) + pad;
      setFocusRequest((prev) => ({
        bounds: [
          [lngMin, latMin],
          [lngMax, latMax],
        ],
        nonce: (prev?.nonce ?? 0) + 1,
        bottomPadding: sheetHeight,
      }));
    },
    [sheetHeight],
  );

  // Ubicación real: permiso SOLO por acción explícita (toque en el FAB)
  const { state: userLocationState, request: requestUserLocation } = useUserLocation();
  const isTracking =
    userLocationState.status === 'tracking' &&
    userLocationState.lat != null &&
    userLocationState.lng != null;

  // Modo efectivo derivado (sin efectos ni cascadas): mientras el usuario
  // no haya interactuado con la cámara y haya fix vigente, la encuadramos
  // en su ubicación. Un gesto → 'free' → vuelve a mandar la state pura.
  const effectiveCameraMode: CameraMode =
    isTracking && cameraMode === 'overview' ? 'follow-user' : cameraMode;

  // Suscribirse una sola vez — todas las líneas siempre en vivo
  useEffect(() => {
    const unsubscribe = subscribeToPositions(ALL_LINE_IDS, (pos) => {
      setPositions(pos);
    });
    return () => unsubscribe();
  }, []);

  const toggleRoute = useCallback((lineId: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(lineId) ? prev.filter((id) => id !== lineId) : [...prev, lineId],
    );
  }, []);

  const clearRoutes = useCallback(() => setSelectedRoutes([]), []);

  const handleBusSelect = useCallback((position: VehiclePosition | null) => {
    setSelectedVehicleKey(
      position ? { lineId: position.lineId, unitId: position.unitId } : null,
    );
    setCameraMode(position ? 'follow-vehicle' : 'overview');
    // Seleccionar (tap o búsqueda) = modo foco: pintar SU recorrido y su
    // destino. La cámara queda en 2D — el 3D es SOLO el CTA explícito
    // "Seguir colectivo en 3D", que entra con zoom automático al recorrido.
    setSelectedRoutes(position ? [position.lineId] : ALL_LINE_IDS);
  }, []);

  /**
   * Toca una línea del resumen → SOLO esa línea pintada y la cámara
   * encuadra su recorrido completo (el sheet baja a collapsed).
   */
  const handleSelectLine = useCallback(
    (lineId: string) => {
      setSelectedRoutes([lineId]);
      const coords = MOCK_ROUTES[lineId] ?? [];
      if (coords.length === 0) return;
      const lngs = coords.map((c) => c[0]);
      const lats = coords.map((c) => c[1]);
      const pad = 0.004; // ~450 m de aire
      setFocusRequest((prev) => ({
        bounds: [
          [Math.min(...lngs) - pad, Math.min(...lats) - pad],
          [Math.max(...lngs) + pad, Math.max(...lats) + pad],
        ],
        nonce: (prev?.nonce ?? 0) + 1,
        bottomPadding: sheetHeight,
      }));
    },
    [sheetHeight],
  );

  const selectedPosition = useMemo(
    () =>
      selectedVehicleKey
        ? positions.find(
            (position) =>
              position.lineId === selectedVehicleKey.lineId &&
              position.unitId === selectedVehicleKey.unitId,
          ) ?? null
        : null,
    [positions, selectedVehicleKey],
  );

  const selectedVehicle = useMemo<SelectedVehicle | null>(() => {
    if (!selectedPosition) return null;
    // Lógica de paradas SECUENCIAL (misma fuente que el cronograma):
    // el colectivo pasa por cada parada en orden — la "próxima" es la
    // primera parada ADELANTE del bus sobre el recorrido, nunca la
    // "más cercana en línea recta" (eso contradecía al timeline).
    const track = getRouteTrack(selectedPosition.lineId, MOCK_ROUTES[selectedPosition.lineId] ?? []);
    const lineStops = track
      ? stopsAlongRoute(track, MOCK_STOPS.filter((s) => s.lineIds.includes(selectedPosition.lineId)))
      : [];
    const busAlongM = track ? track.project(selectedPosition.lng, selectedPosition.lat).alongM : 0;
    const next = lineStops.find((s) => s.alongM > busAlongM + 5) ?? lineStops[lineStops.length - 1];
    const remainingM = next ? Math.max(0, next.alongM - busAlongM) : 300;
    const speedKmh = Math.max(4, selectedPosition.speed || 11);
    const etaMin = Math.max(1, Math.min(45, Math.round((remainingM / 1000 / speedKmh) * 60)));

    return {
      position: selectedPosition,
      nearestStop: next?.name ?? '—',
      nearestStopId: next?.id ?? null,
      etaMin,
    };
  }, [selectedPosition]);

  const selectedLine = useMemo(
    () =>
      selectedVehicleKey
        ? MOCK_LINES.find((line) => line.id === selectedVehicleKey.lineId) ?? null
        : null,
    [selectedVehicleKey],
  );

  const selectedKey = selectedVehicleKey
    ? `${selectedVehicleKey.lineId}-${selectedVehicleKey.unitId}`
    : null;

  const stablePositions = useMemo(() => positions, [positions]);

  // Unidades en vivo por línea — contador dentro de cada chip
  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of positions) counts[p.lineId] = (counts[p.lineId] ?? 0) + 1;
    return counts;
  }, [positions]);

  // Tema del demo: clase .dark (tokens MD3) + basemap Dark Matter
  const [dark, setDark] = useState(false);
  const toggleDark = useCallback(() => {
    setDark((v) => {
      const next = !v;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Header */}
      <header className="bg-surface flex items-center px-4 h-12 w-full fixed top-0 z-50 shadow-sm">
        <button
          onClick={() => router.back()}
          className="h-12 w-12 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-[18px] font-semibold text-on-surface flex-1 whitespace-nowrap truncate">
          Mapa en vivo
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full whitespace-nowrap">
            {positions.length} en vivo
          </span>
          <button
            onClick={toggleDark}
            className="h-10 w-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Cambiar tema"
            aria-pressed={dark}
          >
            <span className="material-symbols-outlined text-xl">{dark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button
            onClick={() => setShowLegend((v) => !v)}
            className={cn(
              'h-10 w-10 flex items-center justify-center rounded-full transition-colors',
              showLegend
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high',
            )}
            aria-label="Mostrar leyenda"
            aria-pressed={showLegend}
          >
            <span className="material-symbols-outlined text-xl">info</span>
          </button>
        </div>
      </header>

      {/* Mapa */}
      <div data-map-stage className="flex-1 relative mt-12">
        <MapCanvas
          positions={stablePositions}
          highlightLines={selectedRoutes}
          onBusSelect={handleBusSelect}
          selectedKey={selectedKey}
          cameraMode={effectiveCameraMode}
          cameraBottomPadding={sheetHeight}
          onCameraModeChange={setCameraMode}
          theme={dark ? 'dark' : 'light'}
          userLocation={
            isTracking
              ? { lat: userLocationState.lat as number, lng: userLocationState.lng as number, accuracy: userLocationState.accuracy }
              : null
          }
          routePulsePaused={sheetDetent === 'expanded'}
          pickMode={pickTarget !== null}
          onMapPick={(lngLat) => {
            if (!pickTarget) return;
            setPickResult({ field: pickTarget, lng: lngLat[0], lat: lngLat[1] });
            setPickTarget(null);
            setPlannerOpen(true);
          }}
          focusRequest={focusRequest}
          plannerPoints={
            plannerDraft
              ? {
                  origin: plannerDraft.origin?.coordinates ?? null,
                  destination: plannerDraft.destination?.coordinates ?? null,
                }
              : null
          }
          plannerPulse={plannerDraft?.nearestStop ?? null}
          className="absolute inset-0"
        />

        {/* Scrim del planner: encima del MapSheet (z-40), debajo del
            TripPlannerSheet (z-[45]). Tap fuera = cerrar / cancelar. */}
        {(plannerOpen || pickTarget) && (
          <div
            className="absolute inset-0 z-[44] bg-black/25"
            onClick={() => {
              setPlannerOpen(false);
              setPickTarget(null);
            }}
            aria-hidden="true"
          />
        )}

        {/* Modo picker: banner de instrucción + cancelar */}
        {pickTarget && (
          <div className="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-surface px-4 py-2 shadow-lg ring-1 ring-outline-variant">
            <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">pin_drop</span>
            <p className="text-xs font-semibold text-on-surface">
              Tocá el mapa para fijar{' '}
              {pickTarget === 'origin'
                ? 'el origen'
                : pickTarget === 'place-edit'
                  ? 'la nueva ubicación del lugar'
                  : 'el destino'}
            </p>
            <button
              onClick={() => setPickTarget(null)}
              className="ml-1 min-h-11 rounded-full px-2 text-xs font-bold text-primary"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* CTA Planificar viaje — estilo Uber, bajo los chips, a la izquierda */}
        {!plannerOpen && !pickTarget && sheetDetent === 'collapsed' && !selectedVehicle && (
          <button
            onClick={() => setPlannerOpen(true)}
            className="absolute left-3 z-20 flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{ bottom: sheetHeight + 16 }}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">directions</span>
            Planificar viaje
          </button>
        )}

        {/* Planifica tu viaje — drawer Uber sobre el sheet del mapa */}
        {plannerOpen && (
          <TripPlannerSheet
            onClose={() => setPlannerOpen(false)}
            userLocation={
              isTracking
                ? { lat: userLocationState.lat as number, lng: userLocationState.lng as number }
                : null
            }
            pickResult={pickResult}
            onPickConsumed={() => setPickResult(null)}
            onRequestPick={(field: PlannerField) => {
              setPlannerOpen(false);
              setPickTarget(field);
            }}
            onPlanned={handlePlanned}
            onSelectLine={handleSelectLine}
            onDraftChange={setPlannerDraft}
          />
        )}

        {/* Leyenda */}
        {showLegend && (
          <div className="absolute top-4 left-4 right-4 z-10 bg-surface/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-outline-variant">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-on-surface">
                Recorridos en el mapa
              </h3>
              <button
                onClick={() => setShowLegend(false)}
                className="text-on-surface-variant hover:text-on-surface"
                aria-label="Cerrar leyenda"
              >
                <span className="material-symbols-outlined text-lg">
                  close
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {MOCK_LINES.map((line) => (
                <button
                  key={line.id}
                  onClick={() => toggleRoute(line.id)}
                  aria-pressed={selectedRoutes.includes(line.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all active:scale-95',
                    selectedRoutes.includes(line.id)
                      ? 'border-transparent text-white shadow-sm'
                      : 'border-outline-variant bg-surface-container-lowest opacity-60 hover:opacity-100',
                  )}
                  style={
                    selectedRoutes.includes(line.id)
                      ? { backgroundColor: line.color }
                      : undefined
                  }
                >
                  <span className="text-xs font-bold">{line.shortName}</span>
                  <span className="text-xs font-medium">{line.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-on-surface-variant">
              Tocá una línea para pintar su recorrido en el mapa.
            </p>
          </div>
        )}

        {/* Chips de recorrido — right-16 para no tapar el control de navegación.
            Activa: fondo del color de la línea + sombra del MISMO color con
            offset y blur (profundidad propia) + highlight interno. El texto
            usa el on-color de la marca (ámbar/celeste claros). */}
        <div className="absolute top-4 left-4 right-16 z-10">
          {!showLegend && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              {MOCK_LINES.map((line) => {
                const active = selectedRoutes.includes(line.id);
                const onColor = LINE_ONCOLOR[line.id] ?? '#FFFFFF';
                return (
                  <button
                    key={line.id}
                    onClick={() => toggleRoute(line.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-2 h-9 px-3.5 rounded-full border text-[13px] font-bold whitespace-nowrap flex-shrink-0 transition-all active:scale-95',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      !active && 'border-outline-variant/70 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low shadow-sm',
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: line.color,
                            borderColor: line.color,
                            color: onColor,
                            boxShadow: `0 4px 14px ${line.color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className={cn('h-2 w-2 rounded-full', active && 'animate-pulse')}
                      style={!active ? { backgroundColor: line.color } : { backgroundColor: 'rgba(255,255,255,0.95)' }}
                    />
                    {line.shortName}
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none tabular-nums',
                        active ? 'bg-white/30' : 'bg-surface-container-high text-on-surface-variant',
                      )}
                    >
                      {unitCounts[line.id] ?? 0}
                    </span>
                  </button>
                );
              })}
              {selectedRoutes.length > 0 && (
                <button
                  onClick={clearRoutes}
                  className="h-9 px-3.5 rounded-full border border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant text-[13px] font-semibold whitespace-nowrap flex-shrink-0 hover:bg-surface-container-low transition-all active:scale-95 shadow-sm"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}
        </div>

        {selectedVehicle && effectiveCameraMode === 'free' && (
          <button
            onClick={() => setCameraMode('follow-vehicle')}
            className="absolute bottom-32 left-1/2 z-20 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-surface px-4 text-sm font-bold text-on-surface shadow-lg ring-1 ring-outline-variant active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">near_me</span>
            Recentrar colectivo
          </button>
        )}

        {/* Mi ubicación — FAB con estados de permiso/error (plan §5) */}
        <div className="absolute right-3 z-20 flex flex-col items-end" style={{ bottom: sheetHeight + 16 }}>
          {userLocationState.error && (
            <div
              role="status"
              className="mb-2 w-64 rounded-xl bg-surface px-3 py-2.5 shadow-lg ring-1 ring-outline-variant"
            >
              <p className="text-xs font-medium leading-snug text-on-surface">{userLocationState.error}</p>
              <button
                onClick={requestUserLocation}
                className="mt-1.5 min-h-11 text-xs font-bold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Reintentar
              </button>
            </div>
          )}
          <button
            onClick={() =>
              userLocationState.status === 'tracking' ? setCameraMode('follow-user') : requestUserLocation()
            }
            disabled={userLocationState.status === 'requesting'}
            aria-pressed={isTracking}
            aria-label={
              userLocationState.status === 'requesting'
                ? 'Obteniendo ubicación'
                : isTracking
                  ? 'Centrar en mi ubicación'
                  : 'Mi ubicación'
            }
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-full shadow-lg ring-1 ring-outline-variant transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              isTracking
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-on-surface-variant hover:bg-surface-container-low',
              userLocationState.status === 'requesting' && 'opacity-70',
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined text-xl',
                userLocationState.status === 'requesting' && 'animate-spin',
              )}
              aria-hidden="true"
            >
              {userLocationState.status === 'requesting' ? 'progress_activity' : 'my_location'}
            </span>
          </button>
        </div>

        {/* Bottom sheet Uber (idle / bus seleccionado) */}
        <MapSheet
          vehicle={selectedVehicle}
          line={selectedLine}
          activeLineIds={selectedRoutes}
          unitCounts={unitCounts}
          onToggleLine={toggleRoute}
          onVehicleClose={() => {
            setSelectedVehicleKey(null);
            setCameraMode('overview');
            setSelectedRoutes(ALL_LINE_IDS); // restaurar la red completa
          }}
          onFollowVehicle={() => setCameraMode('navigation-vehicle')}
          onVisibleHeightChange={(height) => {
            // Cuantizado a 24px: durante el drag el setState dispara
            // ~1 vez cada 24px en vez de cada píxel — la página deja de
            // re-renderizar a 60fps y el drag va a 60fps reales.
            const q = Math.round(height / 24) * 24;
            setSheetHeight((prev) => (prev === q ? prev : q));
          }}
          onDetentChange={setSheetDetent}
          onViewLine={(lineId) => router.push(`/linea/${lineId}`)}
          onStopOpen={(stopId) => router.push(`/parada/${stopId}`)}
          userLocation={
            isTracking
              ? { lat: userLocationState.lat as number, lng: userLocationState.lng as number }
              : null
          }
        />
      </div>
    </div>
  );
}
