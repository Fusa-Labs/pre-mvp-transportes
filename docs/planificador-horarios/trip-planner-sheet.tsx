/**
 * TripPlannerSheet — "Planifica tu viaje" (adaptación del spec Uber a
 * RutaBA): drawer sobre /mapa con ruta origen→destino (visualizador
 * círculo→línea→cuadrado), pills Casa/Trabajo/Guardados, sugerencias
 * locales (paradas + POIs + guardados + recientes), elegir-en-el-mapa
 * y resumen con las líneas que cubren el viaje.
 *
 * MVP 100% cliente: sin backend ni server actions; los lugares se
 * persisten en localStorage (useTripPlanner).
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { BottomSheet, type SheetHandle } from '@/components/ui/bottom-sheet';
import { Toast } from '@/components/ui/toast';
import { HorariosButton } from '@/components/ui/horarios-button';
import { MOCK_LINES, MOCK_ROUTES, MOCK_STOPS } from '@/mock/data';
import { useTripPlanner } from '@/hooks/use-trip-planner';
import { nearestStop, searchPlaces, type GeoPlaceSource } from '@/lib/planner/geocoder';
import { loadPlannerPois } from '@/lib/planner/pois-source';
import { matchTripLines } from '@/lib/planner/trip-match';
import type { LocationItem, SavedPlace, TripMatch } from '@/lib/planner/types';
import { RouteInputGroup, type PlannerField } from './route-input-group';
import { QuickActionsBar, type QuickActionKind } from './quick-actions-bar';
import { LocationItemRow } from './location-item-row';
import { SavePlaceSheet, type SavePlaceRequest } from './save-place-sheet';
import { SavedPlacesSection } from './saved-places-section';
import { ConfirmDeleteDialog } from './confirm-delete-dialog';
import { SchedulePicker } from './schedule-picker';
import { cn } from '@/lib/utils';

/** Fallback del demo (Obelisco) mientras no haya permiso de ubicación. */
const FALLBACK_LOC: [number, number] = [-58.3816, -34.6037];

/** Breakpoint de presentación: ≥768px → modal centrado; <768px → sheet. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

export interface PlannerPickResult {
  field: PlannerField;
  lng: number;
  lat: number;
}

/** Borrador del viaje que el mapa vive marcando (Fase 4). */
export interface PlannerDraft {
  origin: LocationItem | null;
  destination: LocationItem | null;
  /** Parada más cercana al destino: pulso en el mapa. */
  nearestStop: { lat: number; lng: number; name: string; color?: string } | null;
}

interface TripPlannerSheetProps {
  onClose: () => void;
  /** Fix real de ubicación para distancias; null → fallback Obelisco. */
  userLocation: { lat: number; lng: number } | null;
  /** Resultado del picker del mapa, se consume una vez. */
  pickResult: PlannerPickResult | null;
  onPickConsumed: () => void;
  /** Pide a la página entrar en modo picker para un campo. */
  onRequestPick: (field: PlannerField) => void;
  /** Notifica el viaje planificado (la página resalta las líneas). */
  onPlanned: (matches: TripMatch[], origin: LocationItem, destination: LocationItem) => void;
  /** Toca una línea del resumen → la página la marca y encuadra sola. */
  onSelectLine: (lineId: string) => void;
  /** Notifica el borrador vigente (marcadores + parada con pulso). */
  onDraftChange?: (draft: PlannerDraft) => void;
}



export function TripPlannerSheet({
  onClose,
  userLocation,
  pickResult,
  onPickConsumed,
  onRequestPick,
  onPlanned,
  onSelectLine,
  onDraftChange,
}: TripPlannerSheetProps) {
  const {
    saved,
    recent,
    dismissed,
    addSaved,
    updateSaved,
    removeSaved,
    restoreSaved,
    addRecent,
    dismissSuggestion,
  } = useTripPlanner();
  const sheetRef = useRef<SheetHandle>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();
  const [pois, setPois] = useState<Array<{ type: string; name?: string; lat: number; lng: number }>>([]);
  const [origin, setOrigin] = useState<LocationItem | null>(null);
  const [destination, setDestination] = useState<LocationItem | null>(null);
  const [waypoints, setWaypoints] = useState<LocationItem[]>([]);
  const [focused, setFocused] = useState<PlannerField | null>('destination');
  const [query, setQuery] = useState('');
  const [pickupTime, setPickupTime] = useState<'now' | string>('now');
  const [planned, setPlanned] = useState<TripMatch[] | null>(null);
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<QuickActionKind | null>(null);

  // ── CRUD de lugares (plan_lugares_crud.md) ──
  const [saveRequest, setSaveRequest] = useState<SavePlaceRequest | null>(null);
  /** Lugar esperando re-ubicación por el picker del mapa ('place-edit'). */
  const [pendingPlaceEdit, setPendingPlaceEdit] = useState<SavedPlace | null>(null);
  /** Sugerencia esperando confirmación de eliminación. */
  const [pendingDismiss, setPendingDismiss] = useState<LocationItem | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  const showFeedback = (
    message: string,
    type: 'success' | 'error' | 'info',
    action?: { label: string; onClick: () => void },
    ttlMs = 2600,
  ) => {
    setFeedback({ message, type, action });
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), ttlMs);
  };

  useEffect(
    () => () => {
      if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const handleCreate = (kind: SavedPlace['kind'], item: LocationItem, title: string) => {
    const ok = addSaved(kind, item, title);
    if (!ok) {
      showFeedback('No pudimos guardar el lugar en este dispositivo.', 'error');
      return;
    }
    setSaveRequest(null);
    setSaveHint(null);
    showFeedback(`${title} se guardó`, 'success');
  };

  const handleEditPlace = (place: SavedPlace, patch: { title?: string }) => {
    const ok = updateSaved(place.id, patch);
    if (!ok) {
      showFeedback('No pudimos actualizar el lugar en este dispositivo.', 'error');
      return;
    }
    setSaveRequest(null);
    showFeedback(`${patch.title ?? place.title} se actualizó`, 'success');
  };

  /** Eliminar con Deshacer (5s): el lugar vuelve con su id y datos. */
  const handleRemovePlace = (place: SavedPlace) => {
    const removed = removeSaved(place.id);
    if (!removed) return;
    showFeedback(`${place.title} se eliminó`, 'info', {
      label: 'Deshacer',
      onClick: () => {
        if (restoreSaved(removed)) {
          showFeedback(`${place.title} se restauró`, 'success');
        }
      },
    }, 5000);
  };

  /** Re-ubicar un lugar guardado: cierra el sheet y entra al picker. */
  const handlePickPlaceLocation = (place: SavedPlace) => {
    setSaveRequest(null);
    setPendingPlaceEdit(place);
    onRequestPick('place-edit');
  };

  /** Eliminar sugerencia (con confirmación previa en ConfirmDeleteDialog). */
  const handleConfirmDismiss = (item: LocationItem) => {
    const ok = dismissSuggestion(item.id);
    setPendingDismiss(null);
    if (ok) showFeedback(`${item.title} se eliminó de sugerencias`, 'info');
    else showFeedback('No pudimos eliminar la sugerencia en este dispositivo.', 'error');
  };

  useEffect(() => {
    let alive = true;
    void loadPlannerPois().then((data) => {
      if (alive) setPois(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Modal de desktop: ESC cierra (el sheet móvil ya tiene sus gestos).
  useEffect(() => {
    if (!isDesktop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDesktop, onClose]);

  // Fase 4: el mapa vive el borrador — marcadores de origen/destino y
  // la parada más cercana al destino con pulso (color de su línea).
  useEffect(() => {
    if (!onDraftChange) return;
    const target = destination?.coordinates ?? null;
    let nearest: PlannerDraft['nearestStop'] = null;
    if (target) {
      const result = nearestStop(target, MOCK_STOPS);
      if (result) {
        const lineColor = MOCK_LINES.find((line) =>
          (result.stop as { lineIds?: string[] }).lineIds?.includes(line.id),
        )?.color;
        nearest = {
          lat: result.stop.lat,
          lng: result.stop.lng,
          name: result.stop.name,
          color: lineColor,
        };
      }
    }
    onDraftChange({ origin, destination, nearestStop: nearest });
  }, [origin, destination, onDraftChange]);

  // Resultado del picker del mapa → asignar al campo, o re-ubicar un
  // lugar guardado (canal 'place-edit'), y marcar reciente.
  useEffect(() => {
    if (!pickResult) return;

    if (pickResult.field === 'place-edit' && pendingPlaceEdit) {
      const place = pendingPlaceEdit;
      // Consumo one-shot de un prop externo (pickResult llega una vez y
      // se descarta) — el reset del pending acá es la sincronización
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingPlaceEdit(null);
      const ok = updateSaved(place.id, {
        coordinates: { lat: pickResult.lat, lng: pickResult.lng },
        subtitle: `${pickResult.lat.toFixed(5)}, ${pickResult.lng.toFixed(5)}`,
      });
      if (ok) showFeedback(`${place.title} reubicado`, 'success');
      else showFeedback('No pudimos actualizar el lugar en este dispositivo.', 'error');
      onPickConsumed();
      return;
    }

    const item: LocationItem = {
      id: `map-${pickResult.lng.toFixed(5)}-${pickResult.lat.toFixed(5)}`,
      title: 'Ubicación en el mapa',
      subtitle: `${pickResult.lat.toFixed(5)}, ${pickResult.lng.toFixed(5)}`,
      coordinates: { lat: pickResult.lat, lng: pickResult.lng },
      type: 'map_picker',
    };
    assignField(pickResult.field, item);
    onPickConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickResult]);

  const sources = useMemo<GeoPlaceSource>(
    () => ({ stops: MOCK_STOPS, pois, saved, recent }),
    [pois, saved, recent],
  );
  const results = useMemo(
    () =>
      searchPlaces(
        query,
        sources,
        userLocation ?? { lat: FALLBACK_LOC[1], lng: FALLBACK_LOC[0] },
      ).filter((item) => !dismissed.includes(item.id)),
    [query, sources, userLocation, dismissed],
  );

  function setField(field: PlannerField, item: LocationItem | null) {
    if (field === 'origin') setOrigin(item);
    else if (field === 'destination') setDestination(item);
    else if (field === 'place-edit') return; // canal del CRUD, no un campo
    else setWaypoints((prev) => {
      const next = [...prev];
      next[Number(field.slice('waypoint-'.length))] = item as LocationItem;
      return next;
    });
  }

  function assignField(field: PlannerField, item: LocationItem) {
    setField(field, item);
    setQuery('');
    setPlanned(null);
    setFocusedLineId(null);
    setSaveHint(null);
    addRecent(item);
    if (field === 'origin') setFocused('destination');
    else if (field === 'destination') setFocused(null);
  }

  const canPlan = origin !== null && destination !== null;

  function plan() {
    if (!origin || !destination) return;
    const matches = matchTripLines(
      [origin.coordinates.lng, origin.coordinates.lat],
      [destination.coordinates.lng, destination.coordinates.lat],
      MOCK_ROUTES,
    );
    setPlanned(matches);
    setFocusedLineId(null);
    onPlanned(matches, origin, destination);
    // Coreografía: resumen a medium — el mapa queda visible con las
    // líneas pintadas y el sheet invita a elegir.
    sheetRef.current?.snapTo('medium');
  }

  /**
   * Toca una línea del resumen → la página la marca y encuadra, y el
   * sheet baja a collapsed para dejar ver el mapa (el resumen vuelve
   * con un drag hacia arriba).
   */
  function handleSelectLine(lineId: string) {
    setFocusedLineId(lineId);
    onSelectLine(lineId);
    sheetRef.current?.snapTo('collapsed');
  }

  function handleQuickAction(kind: QuickActionKind) {
    const place = saved.find((p) => p.kind === kind);
    if (place) {
      assignField(focused ?? 'destination', {
        id: place.id,
        title: place.title,
        subtitle: place.subtitle,
        coordinates: place.coordinates,
        type: place.kind === 'home' ? 'home' : place.kind === 'work' ? 'work' : 'saved',
      });
      return;
    }
    if (kind === 'saved') {
      setQuery('');
      setSaveHint(null);
      return;
    }
    setSaveHint(kind);
    setFocused(focused ?? 'destination');
  }

  const readyToEdit = origin || destination;

  // Slots de "Tu ruta" — cada fila vuelve a su campo al tocarla.
  const routeSlots = useMemo(() => {
    const slots: Array<{ field: PlannerField; item: LocationItem }> = [];
    if (origin) slots.push({ field: 'origin', item: origin });
    waypoints.forEach((waypoint, index) => {
      if (waypoint) slots.push({ field: `waypoint-${index}` as PlannerField, item: waypoint });
    });
    if (destination) slots.push({ field: 'destination', item: destination });
    return slots;
  }, [origin, waypoints, destination]);

  const header = (
    <div className="flex items-center gap-3 px-4 pb-2.5" data-no-drag>
      <button
        onClick={onClose}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
        aria-label="Volver"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
      </button>
      <h2 className="flex-1 truncate text-base font-bold text-on-surface">
        {planned ? 'Tu viaje' : 'Planificar viaje'}
      </h2>
      <button
        onClick={onClose}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
        aria-label="Cerrar planificador"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );

  const footer = planned ? (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => setPlanned(null)}
        className="min-h-12 rounded-xl border border-outline text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low active:scale-[0.98]"
      >
        Editar viaje
      </button>
      <button
        onClick={onClose}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-on-primary transition-colors hover:bg-primary-container active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden="true">map</span>
        Ver en el mapa
      </button>
    </div>
  ) : (
    <button
      onClick={plan}
      disabled={!canPlan}
      className={cn(
        'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98]',
        canPlan
          ? 'bg-primary text-on-primary hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          : 'cursor-not-allowed bg-surface-container-high text-on-surface-variant',
      )}
    >
      <span className="material-symbols-outlined text-lg" aria-hidden="true">directions</span>
      Planificar viaje
    </button>
  );

  const body = planned && origin && destination ? (
        <TripSummary
          matches={planned}
          origin={origin}
          destination={destination}
          focusedLineId={focusedLineId}
          onSelectLine={handleSelectLine}
        />
      ) : (
        <div>
          <SchedulePicker pickupTime={pickupTime} onTimeChange={setPickupTime} />
          <div className="mt-3">
            <RouteInputGroup
              origin={origin}
              destination={destination}
              waypoints={waypoints}
              focused={focused}
              query={query}
              onQueryChange={setQuery}
              onFieldFocus={(field) => {
                // Cambiar de campo limpia la búsqueda (patrón Uber: cada
                // campo empieza su búsqueda de cero)
                if (focused !== field) setQuery('');
                setFocused(field);
                setSaveHint(null);
              }}
              onFieldClear={(field) => {
                setField(field, null);
                setPlanned(null);
                setFocusedLineId(null);
              }}
              onFieldMapPick={(field) => onRequestPick(field)}
              onSwap={() => {
                setOrigin(destination);
                setDestination(origin);
                setPlanned(null);
                setFocusedLineId(null);
              }}
              onAddWaypoint={() => {
                setWaypoints((prev) => [...prev, null as unknown as LocationItem]);
                setFocused(`waypoint-${waypoints.length}` as PlannerField);
              }}
              onRemoveWaypoint={(index) =>
                setWaypoints((prev) => prev.filter((_, i) => i !== index))
              }
            />
          </div>
          <QuickActionsBar saved={saved} onQuickAction={handleQuickAction} />

          {/* Ver todos los horarios — brillo + colectivito (componente reutilizado en /inicio) */}
          <HorariosButton />

          {/* CRUD completo de lugares (plan_lugares_crud.md D3) */}
          <SavedPlacesSection
            saved={saved}
            onAssign={(place) =>
              assignField(focused ?? 'destination', {
                id: place.id,
                title: place.title,
                subtitle: place.subtitle,
                coordinates: place.coordinates,
                type: place.kind === 'home' ? 'home' : place.kind === 'work' ? 'work' : 'saved',
              })
            }
            onEdit={(place) => setSaveRequest({ mode: 'edit', place })}
            onPickLocation={handlePickPlaceLocation}
            onRemove={handleRemovePlace}
          />

          {saveHint && (
            <div
              role="status"
              className="mb-2 flex items-start gap-2 rounded-xl bg-primary-container/20 px-3 py-2.5"
            >
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">
                bookmark_add
              </span>
              <p className="text-xs leading-snug text-on-surface">
                Buscá tu dirección y tocá{' '}
                <span className="material-symbols-outlined align-text-bottom text-sm" aria-hidden="true">
                  bookmark_add
                </span>{' '}
                para guardarla como{' '}
                <strong>{saveHint === 'home' ? 'Casa' : 'Trabajo'}</strong>.
              </p>
            </div>
          )}

          {readyToEdit && !query && focused === null && routeSlots.length > 0 && (
            <>
              <SectionTitle>Tu ruta</SectionTitle>
              <ul>
                {routeSlots.map(({ field, item }) => (
                  <LocationItemRow
                    key={field}
                    item={item}
                    selected
                    onSelect={() => {
                      setFocused(field);
                      setQuery('');
                      setSaveHint(null);
                    }}
                  />
                ))}
              </ul>
            </>
          )}

          <SectionTitle>
            {query ? 'Resultados' : saveHint ? 'Guardá tu lugar' : 'Sugerencias'}
          </SectionTitle>
          {results.length === 0 && query !== '' ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              Sin resultados para “{query}”
            </p>
          ) : (
            <ul>
              {results.map((item) => (
                <LocationItemRow
                  key={item.id}
                  item={item}
                  selected={
                    item.coordinates === origin?.coordinates ||
                    item.coordinates === destination?.coordinates
                  }
                  showSave
                  showMenu
                  onDismiss={setPendingDismiss}
                  onSave={(locationItem) =>
                    setSaveRequest({
                      mode: 'create',
                      item: locationItem,
                      kind: saveHint ?? undefined,
                    })
                  }
                  onSelect={(locationItem) => assignField(focused ?? 'destination', locationItem)}
                />
              ))}
            </ul>
          )}

          {/* Acciones finales del spec Uber */}
          <ul className="mt-1 border-t border-outline-variant pt-1">
            <li>
              <button
                onClick={() => onRequestPick(focused ?? 'destination')}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-container-low"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">pin_drop</span>
                </span>
                <span className="flex-1 text-sm font-semibold text-on-surface">
                  Establecé la ubicación en el mapa
                </span>
              </button>
            </li>
            <li>
              <button
                aria-disabled
                className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left opacity-55"
                title="Disponible cuando haya geocoding en red (P1)"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">public</span>
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-on-surface">
                    Buscar en otra ciudad
                  </span>
                  <span className="block text-[11px] text-on-surface-variant">Pronto (P1)</span>
                </span>
              </button>
            </li>
          </ul>
        </div>
  );

  // ─── Desktop (≥768px): modal centrado, no bottom sheet ──────
  if (isDesktop) {
    return (
      <>
        <motion.div
          className="absolute inset-0 z-[45] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={planned ? 'Tu viaje' : 'Planificar viaje'}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', duration: 0.35, bounce: 0.12 }
            }
            className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl"
          >
            {header}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
              {body}
            </div>
            <div className="shrink-0 border-t border-outline-variant bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
              {footer}
            </div>
          </motion.div>
        </motion.div>

        {/* Overlays hermanos: position:fixed dentro del modal con transform
            se posiciona relativo al modal, no al viewport */}
        <SavePlaceSheet
          request={saveRequest}
          existingKinds={saved.map((p) => p.kind)}
          onClose={() => setSaveRequest(null)}
          onCreate={handleCreate}
          onEdit={handleEditPlace}
          onPickLocation={handlePickPlaceLocation}
        />
        <ConfirmDeleteDialog
          item={pendingDismiss}
          onCancel={() => setPendingDismiss(null)}
          onConfirm={handleConfirmDismiss}
        />
        {feedback && (
          <Toast
            message={feedback.message}
            type={feedback.type}
            action={feedback.action}
            className="bottom-8"
          />
        )}
      </>
    );
  }

  // ─── Mobile (<768px): bottom sheet con detents (patrón Uber) ──
  return (
    <>
      <BottomSheet
        ref={sheetRef}
        initialDetent="expanded"
        className="z-[45]"
        header={header}
        footer={footer}
      >
        {body}
      </BottomSheet>

      {/* Hermanos del sheet: el transform de motion rompe fixed interno */}
      <SavePlaceSheet
        request={saveRequest}
        existingKinds={saved.map((p) => p.kind)}
        onClose={() => setSaveRequest(null)}
        onCreate={handleCreate}
        onEdit={handleEditPlace}
        onPickLocation={handlePickPlaceLocation}
      />
      <ConfirmDeleteDialog
        item={pendingDismiss}
        onCancel={() => setPendingDismiss(null)}
        onConfirm={handleConfirmDismiss}
      />
      {feedback && (
        <Toast
          message={feedback.message}
          type={feedback.type}
          action={feedback.action}
          className="bottom-44"
        />
      )}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-3 pb-1 text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">
      {children}
    </h3>
  );
}

function TripSummary({
  matches,
  origin,
  destination,
  focusedLineId,
  onSelectLine,
}: {
  matches: TripMatch[];
  origin: LocationItem;
  destination: LocationItem;
  focusedLineId: string | null;
  onSelectLine: (lineId: string) => void;
}) {
  return (
    <div>
      <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center pt-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-on-surface-variant" />
            <span className="my-1 h-6 w-0.5 bg-outline" />
            <span className="h-2.5 w-2.5 bg-on-surface" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Origen</p>
              <p className="truncate text-sm font-semibold text-on-surface">{origin.title}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Destino</p>
              <p className="truncate text-sm font-semibold text-on-surface">{destination.title}</p>
            </div>
          </div>
        </div>
      </section>

      <SectionTitle>
        {matches.length > 0
          ? `${matches.length} ${matches.length === 1 ? 'línea cubre' : 'líneas cubren'} tu viaje`
          : 'Cobertura'}
      </SectionTitle>
      {matches.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant">route_off</span>
          <p className="text-sm text-on-surface-variant">
            Ninguna línea cubre este viaje todavía (red mock).
          </p>
        </div>
      ) : (
        <>
          <p className="pb-2 text-xs text-on-surface-variant">
            Tocá una línea para marcarla en el mapa.
          </p>
          <ul className="space-y-2">
            {matches.map((match) => {
              const line = MOCK_LINES.find((l) => l.id === match.lineId);
              if (!line) return null;
              const active = focusedLineId === line.id;
              return (
                <li key={match.lineId}>
                  <button
                    onClick={() => onSelectLine(line.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border bg-surface-container-lowest p-3 text-left shadow-sm transition-all',
                      'hover:bg-surface-container-low active:scale-[0.98]',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      active
                        ? 'border-transparent'
                        : 'border-outline-variant',
                    )}
                    style={active ? { boxShadow: `0 0 0 2px ${line.color}` } : undefined}
                  >
                    <span
                      className="flex h-11 min-w-12 shrink-0 items-center justify-center rounded-xl px-2 text-base font-extrabold text-white"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.shortName}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-on-surface">
                        Línea {line.shortName} — {line.name}
                      </span>
                      <span className="block text-xs text-on-surface-variant">
                        cada {line.frequency} min · te deja a ~{match.scoreM} m
                      </span>
                    </span>
                    <span
                      className={cn(
                        'material-symbols-outlined shrink-0 text-lg',
                        active ? 'text-primary' : 'text-on-surface-variant',
                      )}
                      aria-hidden="true"
                    >
                      {active ? 'check_circle' : 'visibility'}
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
