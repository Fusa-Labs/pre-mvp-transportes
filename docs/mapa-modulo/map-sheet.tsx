/**
 * MapSheet — bottom sheet de la pantalla Mapa (patrón Uber adaptado a MD3)
 *
 * Estados:
 * - idle: buscador (filtra líneas y paradas) + líneas en vivo con
 *   frecuencia/unidades + paradas cercanas con distancia a pie
 * - bus: mini-fila en peek + banner de servicio + tarjeta premium
 *   (GPS en vivo, ETA, ocupación) + CTA dinámico
 *
 * El tap en una línea de la lista = toggle (misma semántica que los chips).
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import type { Line, VehiclePosition } from '@/lib/data-service';
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from '@/mock/data';
import { busProgressOn, getRouteTrack, stopsAlongRoute } from '@/lib/map/route-progress';
import { RouteTimeline } from './route-timeline';
import { cn } from '@/lib/utils';
import { Toast } from '@/components/ui/toast';
import { useFavorites } from '@/hooks/use-favorites';
import { BottomSheet, type SheetDetent, type SheetHandle } from '@/components/ui/bottom-sheet';

export interface SelectedVehicle {
  position: VehiclePosition;
  nearestStop: string;
  nearestStopId: string | null;
  etaMin: number;
}

interface MapSheetProps {
  vehicle: SelectedVehicle | null;
  line: Line | null;
  activeLineIds: string[];
  unitCounts: Record<string, number>;
  onToggleLine: (lineId: string) => void;
  onVehicleClose: () => void;
  onViewLine: (lineId: string) => void;
  onStopOpen: (stopId: string) => void;
  onFollowVehicle: () => void;
  onVisibleHeightChange: (height: number) => void;
  /** Detent vigente (collapsed/medium/expanded) — para pausar el pulso del mapa */
  onDetentChange?: (detent: SheetDetent) => void;
  /** Fix de ubicación real; null = aún sin permiso → fallback al centro del demo. */
  userLocation?: { lat: number; lng: number } | null;
}

/** Fallback del demo (centro del mapa): Obelisco — sólo hasta que el usuario active su ubicación */
const USER_POINT: [number, number] = [-58.3816, -34.6037];

const distM = (a: [number, number], b: [number, number]) => {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Estado de servicio mock por línea (demo para el banner) */
const SERVICE_STATUS: Record<string, 'regular' | 'desvio' | 'reducida'> = {
  'line-215': 'desvio',
  'line-225': 'reducida',
};

const STATUS_META = {
  regular: { label: 'Frecuencia regular', dot: 'bg-[#71EE8A]' },
  desvio: { label: 'Servicio con desvío', dot: 'bg-[#FEA619]' },
  reducida: { label: 'Frecuencia reducida', dot: 'bg-error' },
} as const;

/** Ocupación mock determinística por interno (demo del spec Uber/SUBE) */
function occupancyFor(unitId: string): { level: number; label: string; bar: string; text: string } {
  const h = [...unitId].reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
  if (h === 0) return { level: 0, label: 'Ocupación baja', bar: 'bg-[#71EE8A]', text: 'text-success' };
  if (h === 1) return { level: 1, label: 'Ocupación media', bar: 'bg-[#FEA619]', text: 'text-[#855300]' };
  return { level: 2, label: 'Ocupación alta', bar: 'bg-error', text: 'text-error' };
}

/** Texto legible sobre el color de la línea (contraste WCAG en colores claros).
 *  Exportado: las píldoras del mapa (page) usan el mismo mapeo. */
export const LINE_ONCOLOR: Record<string, string> = {
  'line-210': '#684000', // ámbar → texto ámbar oscuro
  'line-225': '#062F3F', // celeste → texto azul noche
};

/** Paradas más cercanas a un origen (m + minutos a pie a 80 m/min) */
const nearbyStopsFrom = (origin: [number, number]) =>
  [...MOCK_STOPS]
    .map((s) => {
      const m = distM(origin, [s.lng, s.lat]);
      return { stop: s, meters: Math.round(m), walkMin: Math.max(1, Math.round(m / 80)) };
    })
    .sort((a, b) => a.meters - b.meters)
    .slice(0, 3);

const LINE_BY_ID = new Map(MOCK_LINES.map((l) => [l.id, l]));

export function MapSheet({
  vehicle,
  line,
  activeLineIds,
  unitCounts,
  onToggleLine,
  onVehicleClose,
  onViewLine,
  onStopOpen,
  onFollowVehicle,
  onVisibleHeightChange,
  onDetentChange,
  userLocation = null,
}: MapSheetProps) {
  const [query, setQuery] = useState('');
  const sheetRef = useRef<SheetHandle>(null);
  const reduceMotion = useReducedMotion();

  // Toast de guardado desde el sheet — fuera del BottomSheet porque los
  // transforms del motion convierten position:fixed en relativo al sheet
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );
  const feedbackTimer = useRef<number | null>(null);
  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedback({ message, type });
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 2600);
  };
  useEffect(
    () => () => {
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  // Llegada con intención de agregar (/mapa?agregar=1 desde Favoritos):
  // el sheet abre EXPANDED — en medium las "Paradas cercanas" quedan bajo
  // el pliegue (las 5 líneas en vivo ocupan la mitad) y el usuario no
  // encuentra cómo guardar (el motivo del botón "+ Agregar" que "no andaba")
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('agregar')) return;
    const t = window.setTimeout(() => sheetRef.current?.snapTo('expanded'), 450);
    return () => window.clearTimeout(t);
  }, []);

  // Paradas cercanas desde la ubicación vigente (real o fallback del demo)
  const nearestStops = useMemo(
    () =>
      nearbyStopsFrom(
        userLocation ? [userLocation.lng, userLocation.lat] : USER_POINT,
      ),
    [userLocation],
  );

  // Selección de colectivo → expanded (cronograma + CTA completos de
  // una; el mapa queda arriba con el bus seguido en 2D) · deselección
  // → collapsed. (API imperativa: snapTo opera MotionValues)
  const prevVehicle = useRef<string | null>(null);
  const vehicleKey = vehicle
    ? `${vehicle.position.lineId}-${vehicle.position.unitId}`
    : null;
  useEffect(() => {
    if (vehicleKey === prevVehicle.current) return;
    prevVehicle.current = vehicleKey;
    sheetRef.current?.snapTo(vehicleKey ? 'expanded' : 'collapsed');
  }, [vehicleKey]);

  const q = query.trim().toLowerCase();
  const filteredLines = useMemo(
    () =>
      MOCK_LINES.filter(
        (l) => !q || l.shortName.toLowerCase().includes(q) || l.name.toLowerCase().includes(q),
      ),
    [q],
  );
  const filteredStops = useMemo(
    () => (!q ? nearestStops : nearestStops.filter((s) => s.stop.name.toLowerCase().includes(q))),
    [q, nearestStops],
  );
  const noResults = q !== '' && filteredLines.length === 0 && filteredStops.length === 0;
  const isBus = Boolean(vehicle && line);
  const contentKey = isBus ? 'bus' : 'idle';

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        onVisibleHeightChange={onVisibleHeightChange}
        onDetentChange={onDetentChange}
        footer={
          isBus && vehicle && line ? (
            <BusActions
              onFollowVehicle={onFollowVehicle}
              onViewLine={() => onViewLine(line.id)}
              onNavigateStop={
                vehicle.nearestStopId ? () => onStopOpen(vehicle.nearestStopId as string) : null
              }
            />
          ) : null
        }
        header={
          isBus && vehicle && line ? (
            <BusMiniRow vehicle={vehicle} line={line} onClose={onVehicleClose} />
          ) : (
            <SearchPill
              query={query}
              onQuery={setQuery}
              onFocus={() => sheetRef.current?.snapTo('medium')}
            />
          )
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={contentKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          >
            {isBus && vehicle && line ? (
              <BusContent vehicle={vehicle} line={line} />
            ) : (
              <IdleContent
                lines={filteredLines}
                stops={filteredStops}
                query={q}
                noResults={noResults}
                activeLineIds={activeLineIds}
                unitCounts={unitCounts}
                onToggleLine={onToggleLine}
                onStopOpen={onStopOpen}
                onFeedback={showFeedback}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </BottomSheet>

      {feedback && (
        <Toast
          message={feedback.message}
          type={feedback.type}
          className="bottom-44"
        />
      )}
    </>
  );
}

// ─── Idle: buscador ─────────────────────────────────────────

function SearchPill({
  query,
  onQuery,
  onFocus,
}: {
  query: string;
  onQuery: (value: string) => void;
  onFocus: () => void;
}) {
  return (
    <div data-no-drag className="px-4 pb-2.5">
      <div className="flex h-10 items-center gap-2.5 rounded-full border border-outline bg-surface-container-lowest px-4 shadow-sm">
        <span className="material-symbols-outlined text-base text-on-surface-variant">search</span>
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          onFocus={onFocus}
          placeholder="Buscá una línea o parada…"
          aria-label="Buscar línea o parada"
          className="min-w-0 flex-1 bg-transparent text-base text-on-surface outline-none placeholder:text-on-surface-variant sm:text-sm"
        />
        {query && (
          <button
            onClick={() => onQuery('')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Limpiar búsqueda"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Idle: líneas + paradas ─────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-3 pb-1 text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">
      {children}
    </h3>
  );
}

function IdleContent({
  lines,
  stops,
  query,
  noResults,
  activeLineIds,
  unitCounts,
  onToggleLine,
  onStopOpen,
  onFeedback,
}: {
  lines: Line[];
  stops: { stop: (typeof MOCK_STOPS)[number]; meters: number; walkMin: number }[];
  query: string;
  noResults: boolean;
  activeLineIds: string[];
  unitCounts: Record<string, number>;
  onToggleLine: (lineId: string) => void;
  onStopOpen: (stopId: string) => void;
  onFeedback: (message: string, type: 'success' | 'error') => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleToggleStop = (stopId: string, stopName: string) => {
    const ok = toggleFavorite(stopId);
    if (!ok) {
      onFeedback('No pudimos guardar la parada en este dispositivo.', 'error');
      return;
    }
    onFeedback(
      isFavorite(stopId) ? `${stopName} quitada de favoritos` : `${stopName} guardada en favoritos`,
      'success',
    );
  };

  if (noResults) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">search_off</span>
        <p className="text-sm text-on-surface-variant">Sin resultados para “{query}”</p>
      </div>
    );
  }

  return (
    <div>
      {(query === '' || lines.length > 0) && (
        <>
          <SectionTitle>Líneas en vivo</SectionTitle>
          <ul className="space-y-1.5">
            {lines.map((l) => {
              const active = activeLineIds.includes(l.id);
              return (
                <li key={l.id}>
                  <button
                    onClick={() => onToggleLine(l.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center gap-3.5 rounded-2xl border px-3 py-3 text-left transition-all active:scale-[0.99]',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      active
                        ? 'border-outline-variant/70 shadow-sm'
                        : 'border-transparent hover:bg-surface-container-low',
                    )}
                    style={active ? { backgroundColor: `${l.color}0F` } : undefined}
                  >
                    <span
                      className="flex h-10 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold shadow-sm"
                      style={{ backgroundColor: l.color, color: LINE_ONCOLOR[l.id] ?? '#FFFFFF' }}
                    >
                      {l.shortName}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-on-surface">
                        Línea {l.shortName} — {l.name}
                      </span>
                      <span className="block truncate text-xs text-on-surface-variant">
                        {l.direction} · cada {l.frequency} min
                      </span>
                    </span>
                    {active ? (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: l.color, color: LINE_ONCOLOR[l.id] ?? '#FFFFFF' }}
                      >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                          check_circle
                        </span>
                        en el mapa
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-lowest px-2.5 py-1 text-[11px] font-bold tabular-nums text-on-surface-variant ring-1 ring-outline-variant/60 shadow-sm">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#71EE8A]"
                          style={{ animation: 'rutaba-live-pulse 1.8s ease-in-out infinite' }}
                          aria-hidden="true"
                        />
                        {unitCounts[l.id] ?? 0} en vivo
                      </span>
                    )}
                    <span
                      className="material-symbols-outlined shrink-0 text-lg"
                      style={active ? { color: l.color } : undefined}
                      aria-hidden="true"
                    >
                      {active ? 'check_circle' : 'chevron_right'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {stops.length > 0 && (
        <>
          <SectionTitle>Paradas cercanas</SectionTitle>
          <ul>
            {stops.map(({ stop, meters, walkMin }) => {
              const fav = isFavorite(stop.id);
              return (
                <li key={stop.id} className="flex items-stretch">
                  <button
                    onClick={() => onStopOpen(stop.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-l-xl px-2 py-3 text-left transition-colors active:bg-surface-container hover:bg-surface-container-low"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                      <span className="material-symbols-outlined text-xl">place</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-on-surface">
                        {stop.name}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        a {meters} m · {walkMin} min a pie
                        <span className="flex gap-1">
                          {stop.lineIds.map((id) => {
                            const l = LINE_BY_ID.get(id);
                            if (!l) return null;
                            return (
                              <span
                                key={id}
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: l.color }}
                              />
                            );
                          })}
                        </span>
                      </span>
                    </span>
                    <span className="material-symbols-outlined text-lg text-on-surface-variant">
                      chevron_right
                    </span>
                  </button>
                  <button
                    onClick={() => handleToggleStop(stop.id, stop.name)}
                    aria-pressed={fav}
                    aria-label={fav ? `Quitar ${stop.name} de favoritos` : `Guardar ${stop.name} en favoritos`}
                    className={cn(
                      'flex w-12 shrink-0 items-center justify-center rounded-r-xl px-2 transition-colors active:scale-95',
                      fav
                        ? 'text-primary hover:bg-surface-container-low'
                        : 'text-on-surface-variant hover:bg-surface-container-low',
                    )}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={fav ? { fontVariationSettings: "'FILL' 1" } : {}}
                      aria-hidden="true"
                    >
                      {fav ? 'star' : 'star_border'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

// ─── Bus: mini fila (peek) ──────────────────────────────────

function BusMiniRow({
  vehicle,
  line,
  onClose,
}: {
  vehicle: SelectedVehicle;
  line: Line;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 pb-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-sm"
        style={{ backgroundColor: line.color }}
      >
        {line.shortName}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface">
        Línea {line.shortName} · ~{vehicle.etaMin} min
      </p>
      <button
        onClick={onClose}
        className="h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
        style={{ display: 'flex' }}
        aria-label="Cerrar selección"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

// ─── Bus: contenido (half/full) ─────────────────────────────

function BusContent({
  vehicle,
  line,
}: {
  vehicle: SelectedVehicle;
  line: Line;
}) {
  const status = SERVICE_STATUS[line.id] ?? 'regular';
  const statusMeta = STATUS_META[status];
  const occupancy = occupancyFor(vehicle.position.unitId);

  // Cronograma del recorrido: track cacheado por línea, paradas ordenadas
  // y el progreso del colectivo vivo (se re-proyecta con cada fix, 1 Hz)
  const track = useMemo(() => getRouteTrack(line.id, MOCK_ROUTES[line.id] ?? []), [line.id]);
  const timelineStops = useMemo(
    () =>
      track
        ? stopsAlongRoute(
            track,
            MOCK_STOPS.filter((s) => s.lineIds.includes(line.id)),
          )
        : [],
    [track, line.id],
  );
  const busProgress = useMemo(
    () => (track ? busProgressOn(track, vehicle.position) : 0),
    [track, vehicle.position],
  );
  const busAlongM = useMemo(
    () => (track ? track.project(vehicle.position.lng, vehicle.position.lat).alongM : 0),
    [track, vehicle.position],
  );
  const speedKmh = Math.max(4, vehicle.position.speed || 11);
  // Frescura del fix: el "ahora" es estado (1 Hz, callback de interval —
  // nunca Date.now() impuro durante el render). Si el feed se atrasa,
  // "En vivo" pasa a "hace Xs" con dot ámbar.
  const [clockNow, setClockNow] = useState(0);
  useEffect(() => {
    const tick = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  const gpsAgeSec = Math.max(0, Math.round((clockNow - vehicle.position.timestamp) / 1000));
  const gpsLive = gpsAgeSec < 8;

  return (
    <div className="pt-1">
      {/* Banner de servicio (reemplaza el banner de surge de Uber) */}
      <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2">
        <span className={cn('h-2 w-2 rounded-full', statusMeta.dot)} />
        <span className="text-xs font-bold text-on-surface">{statusMeta.label}</span>
        <span className="material-symbols-outlined ml-auto text-lg text-on-surface-variant">info</span>
      </div>

      <section className="mt-3 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-11 min-w-12 shrink-0 items-center justify-center rounded-xl px-2 text-base font-extrabold text-white"
            style={{ backgroundColor: line.color }}
          >
            {line.shortName}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-on-surface">{line.name}</p>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">
              Interno {vehicle.position.unitId} · hacia {line.direction}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="flex items-end gap-0.5" aria-hidden="true">
              {[0, 1, 2].map((seg) => (
                <span
                  key={seg}
                  className={cn('w-1 rounded-sm', seg <= occupancy.level ? occupancy.bar : 'bg-outline-variant')}
                  style={{ height: 4 + seg * 3 }}
                />
              ))}
            </span>
            <span className={cn('text-[11px] font-bold', occupancy.text)}>
              {occupancy.label.replace('Ocupación ', '')}
            </span>
          </span>
        </div>

        <div className="border-t border-outline-variant px-4 py-3">
          <p className="text-xs font-semibold text-on-surface-variant">Próxima parada</p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface">
              {vehicle.nearestStop}
            </p>
            <p className="shrink-0 text-3xl font-extrabold leading-none text-primary" aria-live="polite">
              {vehicle.etaMin}<span className="ml-1 text-sm font-bold">min</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-outline-variant bg-surface-container-low/50">
          <div className="px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Velocidad</p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">{Math.round(vehicle.position.speed)} km/h</p>
          </div>
          <div className="border-l border-outline-variant px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Señal GPS</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-on-surface">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: gpsLive ? '#2E7D32' : '#FEA619' }}
                aria-hidden="true"
              />
              {gpsLive ? 'En vivo' : `hace ${gpsAgeSec} s`}
            </p>
          </div>
        </div>
      </section>

      {/* Cronograma del recorrido: paradas en orden + dot vivo del
          colectivo (círculo = inicio, cuadrado = fin) */}
      {timelineStops.length > 1 && (
        <section className="mt-3 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
          <p className="pb-2 text-xs font-semibold text-on-surface-variant">Recorrido</p>
          <RouteTimeline
            color={line.color}
            onColor={LINE_ONCOLOR[line.id] ?? '#FFFFFF'}
            stops={timelineStops}
            busProgress={busProgress}
            busAlongM={busAlongM}
            speedKmh={speedKmh}
            shortName={line.shortName}
          />
        </section>
      )}

    </div>
  );
}

// ─── Bus: acciones (footer fijo del sheet, fuera del scroll) ──

function BusActions({
  onFollowVehicle,
  onViewLine,
  onNavigateStop,
}: {
  onFollowVehicle: () => void;
  onViewLine: () => void;
  onNavigateStop: (() => void) | null;
}) {
  return (
    <>
      <button
        onClick={onFollowVehicle}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-on-primary transition-colors hover:bg-primary-container active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="material-symbols-outlined text-xl" aria-hidden="true">near_me</span>
        Seguir colectivo en 3D
      </button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={onViewLine}
          className="min-h-11 rounded-xl border border-outline text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low active:scale-[0.98]"
        >
          Ver línea
        </button>
        {onNavigateStop && (
          <button
            onClick={onNavigateStop}
            className="min-h-11 rounded-xl border border-outline text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low active:scale-[0.98]"
          >
            Ir a la parada
          </button>
        )}
      </div>
    </>
  );
}
