/**
 * Pantalla Inicio — /inicio (port de colectivos-amba/src/app/inicio)
 *
 * Hero llegada destacada, paradas favoritas (localStorage), alertas y dock.
 * Tokens: DESIGN.MD (canvas/ink/hairline). Íconos: lucide-react.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Route,
  CheckCircle2,
} from 'lucide-react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { LineBadge } from '@/components/ui/line-badge';
import { AssistantBar } from '@/components/home/AssistantBar';
import { AssistantAnswerSheet } from '@/components/home/AssistantAnswerSheet';
import { tripMapUrl } from '@/components/home/AssistantAnswerCard';
import { requestDeviceLocation, SIMULATED_USER_LOCATION } from '@/lib/config/user-location';
import { nearbyStopsFor as findNearbyStops } from '@/lib/services/assistant-intent-service';
import { LocationConsentModal } from '@/components/home/LocationConsentModal';
import { PlaceSelector } from '@/components/home/PlaceSelector';
import { AssistantWizard } from '@/components/home/AssistantWizard';
import { MetropolRose } from '@/components/brand/metropol-logo';

import { MOCK_STOPS, MOCK_LINES, MOCK_ALERTS } from '@/mock/data';
import { subscribeToPositions } from '@/mock/live';
import { useFavorites } from '@/hooks/use-favorites';
import { useAssistantSession } from '@/hooks/use-assistant-session';
import { useIntermittentDelay } from '@/hooks/use-intermittent-delay';
import { assistantRefFromSession } from '@/lib/assistant-session';
import { TripPlannerService } from '@/lib/services/trip-planner-service';
import { TransportService } from '@/lib/services/transport-service';
import {
  nearbyStopsFor,
  resolveAssistantQuery,
  type AssistantAnswer,
  type AssistantQuery,
} from '@/lib/services/assistant-intent-service';
import type { TripOption } from '@/types/trip-planner';
import type { VehiclePosition } from '@/lib/data-service';
import type { LocationPoint } from '@/types/trip-planner';

const ACTIVE_ALERTS = MOCK_ALERTS.filter((a) => a.status !== 'resolved');
const ALL_LINE_IDS = MOCK_LINES.map((l) => l.id);

/**
 * Aviso de alerta para un recorrido: si su línea tiene una alerta activa,
 * la tarjeta muestra un badge titilando ("RETRASO"/"DESVÍO"/"CORTE").
 * Solo Home: el mapa todavía NO refleja la demora (ver backlog en el .md).
 */
const ALERT_BADGE_LABEL: Record<string, string> = {
  delay: 'RETRASO',
  suspension: 'CORTE',
  route_change: 'DESVÍO',
};

function activeAlertLabelForLine(lineId: string, delayMinutes?: number): string | null {
  const alert = ACTIVE_ALERTS.find((a) => a.lineId === lineId && a.disrupcion);
  if (!alert) return null;
  if (alert.type === 'delay') {
    return `${delayMinutes ?? 4} min de retraso`;
  }
  return ALERT_BADGE_LABEL[alert.type] ?? 'ALERTA';
}

/**
 * B2 · "Historial de paradas": recorridos demo precargados que ya funcionan
 * sobre los datos existentes (líneas 65 y 194). Cada uno es un viaje
 * origen→destino independiente; un tap lo inicia en el mapa.
 */
interface SeededRoute {
  id: string;
  originStopId: string;
  destinationStopId: string;
  lineId: string;
  originLabel: string;
  destinationLabel: string;
}

const SEEDED_ROUTES: SeededRoute[] = [
  {
    id: 'seed-65-centenario-barrancas',
    originStopId: 'stop-65-05',
    destinationStopId: 'stop-65-09',
    lineId: 'line-65',
    originLabel: 'Parque Centenario',
    destinationLabel: 'Barrancas de Belgrano',
  },
  {
    id: 'seed-65-constitucion-barrancas',
    originStopId: 'stop-65-01',
    destinationStopId: 'stop-65-09',
    lineId: 'line-65',
    originLabel: 'Plaza Constitución',
    destinationLabel: 'Barrancas de Belgrano',
  },
  {
    id: 'seed-194-once-escobar',
    originStopId: 'stop-194-once',
    destinationStopId: 'stop-194-escobar-estacion',
    lineId: 'line-194',
    originLabel: 'Terminal Once',
    destinationLabel: 'Estación Escobar',
  },
  {
    id: 'seed-194-once-zarate',
    originStopId: 'stop-194-once',
    destinationStopId: 'stop-194-zarate-transferencia',
    lineId: 'line-194',
    originLabel: 'Terminal Once',
    destinationLabel: 'Zárate Centro',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const delayMinutes = useIntermittentDelay(2, 9);

  // ─── Asistente del inicio (PBI-017 + PBI-019): fases, permiso decorativo,
  //     selector de lugar y respuesta persistida que refresca con GPS live ───
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  // La consulta exhibida; la respuesta se DERIVA (useAnswer) para refrescar
  // con el GPS live sin setState dentro de un effect.
  const [activeQuery, setActiveQuery] = useState<AssistantQuery | null>(null);
  // Parada en foco de la hoja → refinamiento contextual ("¿cuándo llega?" aquí).
  const [paradaRef, setParadaRef] = useState<string | undefined>(undefined);
  // Máquina de fases del flujo: idle → consent → selector → answer.
  const [phase, setPhase] = useState<'idle' | 'consent' | 'selector' | 'answer'>('idle');
  // Wizard de viaje en 3 pasos (PBI-020): overlay propio del chip "¿Cómo llego a…?".
  const [wizardOpen, setWizardOpen] = useState(false);
  // true = al terminar el selector de lugar, reabrir el wizard (paso 1 "Cambiar").
  const [wizardResume, setWizardResume] = useState(false);
  // Destino elegido explícitamente en Home. Se conserva a través del gate de
  // ubicación para omitir el paso Destino, pero nunca se infiere de texto libre.
  const [pendingDestino, setPendingDestino] = useState<LocationPoint | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const { session, setConsentido, setLugar, setParadaSelId, setLastQuery } = useAssistantSession();

  useEffect(() => {
    const unsubscribe = subscribeToPositions(ALL_LINE_IDS, setPositions);
    return unsubscribe;
  }, []);

  const runAssistant = useCallback(
    (query: AssistantQuery, ctxOverride?: { paradaRef?: string }) => {
      setActiveQuery(query);
      setPhase('answer');
      setLastQuery({
        intent: query.intent,
        destinoText: query.destinoText,
        lineaNumero: query.lineaNumero,
        originStopId: query.originStopId ?? ctxOverride?.paradaRef,
      });
      if (ctxOverride) setParadaRef(ctxOverride.paradaRef);
    },
    [setLastQuery],
  );

  // Respuesta derivada: se recalcula sola cuando llega el tick de GPS (1 Hz)
  // o cambia el contexto (lugar, parada en foco, favoritos).
  const answer = useMemo<AssistantAnswer | null>(() => {
    if (phase !== 'answer' || !activeQuery) return null;
    return resolveAssistantQuery(activeQuery, {
      ref: assistantRefFromSession(session),
      paradaRef,
      favorites: favorites.map((f) => f.stopId),
      positions,
    });
  }, [phase, activeQuery, session, paradaRef, favorites, positions]);

  /**
   * §2 Wizard de viaje en 3 pasos: ubicación → parada → destino.
   * Requiere el gate de consentimiento/lugar antes de abrirse.
   * SIEMPRE muestra el wizard: si ya existe una guía completa (PBI-019), el
   * paso "Destino" se reanuda con la parada y el destino anteriores cargados
   * para confirmar o cambiar — nunca se los saltea.
   */
  const openTripWizard = useCallback((destination?: LocationPoint) => {
    setPendingDestino(destination ?? null);
    setWizardError(null);
    setParadaRef(undefined);
    if (!session.consentido) {
      setWizardResume(true);
      setPhase('consent');
      return;
    }
    if (!session.lugar) {
      setWizardResume(true);
      setPhase('selector');
      return;
    }
    setWizardOpen(true);
  }, [session.consentido, session.lugar]);

  /** Reanudación del wizard con la última guía completa persistida. */
  const wizardResumeGuide =
    session.paradaSelId &&
    session.lastQuery?.intent === 'trip_plan' &&
    session.lastQuery.destinoText
      ? {
          paradaId: session.paradaSelId,
          destino: session.lastQuery.destinoText,
        }
      : null;

  // ─── Ubicación real o demo. La API se invoca exclusivamente desde el CTA. ───
  const openWizardForLocation = useCallback((location: LocationPoint) => {
    const nearby = findNearbyStops({
      ref: { lat: location.lat, lng: location.lng, name: location.name, isSimulated: Boolean(location.source === 'simulated') },
      favorites: [],
      positions,
    }, 1);
    if (nearby.length === 0) {
      throw new Error('No encontramos paradas de la red cerca de tu ubicación. Podés usar Parque Centenario.');
    }
    setConsentido(true);
    setLugar({ name: location.name, address: location.address, lat: location.lat, lng: location.lng, stopId: location.stopId });
    setParadaSelId(null);
    setPhase('idle');
    setWizardResume(false);
    setWizardError(null);
    setWizardOpen(true);
  }, [positions, setConsentido, setLugar, setParadaSelId]);

  const handleConsentUseReal = useCallback(async () => {
    const location = await requestDeviceLocation();
    openWizardForLocation({ ...location, source: 'text' });
  }, [openWizardForLocation]);

  const handleConsentUseDemo = useCallback(() => {
    openWizardForLocation({ ...SIMULATED_USER_LOCATION, source: 'simulated' });
  }, [openWizardForLocation]);

  const handleConsentClose = useCallback(() => {
    setPhase('idle');
    setPendingDestino(null);
  }, []);

  // ─── Handler del selector de lugar ───
  const handlePlaceSelect = useCallback(
    (place: LocationPoint) => {
      const lugar = {
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        stopId: place.stopId,
      };
      setLugar(lugar);
      // Cambiar de lugar invalida la parada elegida en el wizard.
      setParadaSelId(null);
      // El wizard pidió "Cambiar ubicación": se reabre en el paso 1 con el
      // nuevo lugar, sin ejecutar la consulta de llegadas pendiente.
      if (wizardResume) {
        setWizardResume(false);
        setWizardError(null);
        setWizardOpen(true);
        return;
      }
      const query =
        session.lastQuery
          ? {
              intent: session.lastQuery.intent,
              destinoText: session.lastQuery.destinoText,
              lineaNumero: session.lastQuery.lineaNumero,
            }
          : { intent: 'next_arrival' as const };
      // El snapshot de sesión se actualiza con el notify() de setLugar en el
      // mismo batch; el useMemo de answer resuelve ya con el lugar nuevo.
      runAssistant(query, { paradaRef: place.stopId });
    },
    [session.lastQuery, setLugar, setParadaSelId, wizardResume, runAssistant],
  );

  const handlePlaceCancel = useCallback(() => {
    setPhase('idle');
    setWizardResume(false);
    setPendingDestino(null);
  }, []);

  // ─── Wizard de viaje (PBI-020) ───
  const wizardNearbyStops = useMemo(
    () =>
      nearbyStopsFor(
        {
          ref: assistantRefFromSession(session),
          favorites: favorites.map((f) => f.stopId),
          positions,
        },
        3,
      ),
    [session, favorites, positions],
  );

  const handleWizardComplete = useCallback(
    (paradaId: string, destinoText: string, selectedDestination?: LocationPoint) => {
      if (selectedDestination) {
        setWizardError(null);
        const trip = TripPlannerService.planTrip(paradaId, selectedDestination).find((option) =>
          option.legs.some((leg) => leg.type === 'ride' && leg.fromStop.id === paradaId),
        );
        if (!trip) {
          setWizardError('No encontramos un colectivo para ese destino desde esta parada. Elegí otra parada cercana.');
          return false;
        }
        setWizardOpen(false);
        setPendingDestino(null);
        setParadaSelId(paradaId);
        setPhase('idle');
        router.push(tripMapUrl(trip, trip.origin, { boardingStopId: paradaId }));
        return true;
      }
      setWizardOpen(false);
      setPendingDestino(null);
      setParadaSelId(paradaId);
      runAssistant(
        { intent: 'trip_plan', destinoText, originStopId: paradaId },
        { paradaRef: paradaId },
      );
      return true;
    },
    [router, setParadaSelId, runAssistant],
  );

  const handleWizardChangeLocation = useCallback(() => {
    setWizardOpen(false);
    setWizardResume(true);
    setPhase('selector');
  }, []);

  const handleWizardClose = useCallback(() => {
    setWizardOpen(false);
    setWizardResume(false);
    setPendingDestino(null);
  }, []);

  /**
   * §3: tocar el viaje en la hoja final cierra la hoja y navega al mapa con
   * trip=1 + origen + destino + línea/ramal → Modo Viaje con el recorrido
   * trazado, la línea resaltada y sus unidades activas a la vista.
   */
  const handleOpenTripOnMap = useCallback(
    (trip: TripOption, origin: LocationPoint, boardingStopId?: string, arrival?: import('@/types/transport').EstimacionLlegada) => {
      setPhase('idle');
      router.push(tripMapUrl(trip, origin, { boardingStopId: boardingStopId ?? origin.stopId, arrival }));
    },
    [router],
  );

  const handleAskArrivalsAt = useCallback(
    (stopId: string) => {
      setParadaRef(stopId);
      // setParadaRef es async: se pasa el foco explícito en el override de ctx.
      runAssistant({ intent: 'next_arrival', paradaId: stopId }, { paradaRef: stopId });
    },
    [runAssistant],
  );

  const handleSelectCandidate = useCallback(
    (candidate: LocationPoint) => {
      runAssistant({
        intent: 'trip_plan',
        destinoText: candidate.name,
        ...(session.paradaSelId ? { originStopId: session.paradaSelId } : {}),
      });
    },
    [runAssistant, session.paradaSelId],
  );

  /** El buscador es destino directo: no se pasa por el parser de preguntas. */
  const handleDestinationSearch = useCallback(
    (destination: LocationPoint) => {
      openTripWizard(destination);
    },
    [openTripWizard],
  );

  const closeAnswer = useCallback(() => {
    setActiveQuery(null);
    setParadaRef(undefined);
    setPhase('idle');
  }, []);

  /** "Cambiar lugar" desde la hoja: vuelve al selector sin pedir permiso. */
  const handleChangePlace = useCallback(() => {
    setPhase('selector');
  }, []);

  /**
   * sdd/trip-options-upgrade 2.5 (fix verify #4108): re-pick de destino desde el
   * estado zero-bus de la hoja de Home. Reabre el wizard "¿Cómo llego a…?" en el
   * paso Destino CONSERVANDO el origen: `wizardResumeGuide` reanuda con la parada
   * elegida (`session.paradaSelId`) y el último destino, sin resetear el lugar ni
   * el consentimiento.
   */
  const handleRepickDestination = useCallback(() => {
    openTripWizard();
  }, [openTripWizard]);

  /**
   * B2 · "Historial de paradas": cada recorrido demo se resuelve contra los
   * datos existentes (parada origen/destino + línea) y muestra la próxima
   * llegada del colectivo en la parada de abordaje. Se recalcula con el tick
   * de GPS (1 Hz) igual que el asistente.
   */
  const seededRoutes = useMemo(
    () =>
      SEEDED_ROUTES.flatMap((seed) => {
        const origin = MOCK_STOPS.find((s) => s.id === seed.originStopId);
        const destination = MOCK_STOPS.find((s) => s.id === seed.destinationStopId);
        const line = MOCK_LINES.find((l) => l.id === seed.lineId);
        if (!origin || !destination || !line) return [];
        const arrival =
          TransportService.getArrivals(seed.originStopId, positions)
            .filter((a) => a.lineaId === seed.lineId)
            .sort((a, b) => a.minutos - b.minutos)[0] ?? null;
        return [{ seed, origin, destination, line, arrival }];
      }),
    [positions],
  );

  /** Un tap en un recorrido demo inicia ese viaje en el mapa. */
  const startSeededTrip = useCallback(
    (seed: SeededRoute) => {
      const trip = TripPlannerService.planTrip(seed.originStopId, seed.destinationStopId).find(
        (option) =>
          option.legs.some(
            (leg) =>
              leg.type === 'ride' &&
              leg.lineaId === seed.lineId &&
              leg.fromStop.id === seed.originStopId,
          ),
      );
      if (!trip) return;
      router.push(tripMapUrl(trip, trip.origin, { boardingStopId: seed.originStopId }));
    },
    [router],
  );

  return (
    <div className="h-dvh bg-canvas flex flex-col overflow-hidden">
      <header className="px-4 pt-6 pb-2 bg-canvas flex items-center gap-2.5 shrink-0">
        <h1 className="text-[21px] font-normal text-[#1b2a51] dark:text-white tracking-tight shrink-0">
          Bienvenido a la Red
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <MetropolRose variant="full" className="h-7.5 w-auto shrink-0" />
          <img
            src="/logo-solo-metropol-white.png"
            alt="Metropol"
            className="h-6.5 w-auto object-contain shrink-0 hidden dark:inline"
          />
          <img
            src="/logo-solo-metropol.png"
            alt="Metropol"
            className="h-6.5 w-auto object-contain shrink-0 inline dark:hidden"
          />
        </div>
      </header>

      <main className="px-4 flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto overscroll-contain pb-[104px]">
        {/* Buscador único de destino */}
        <div className="mt-2">
          <AssistantBar onSubmit={handleDestinationSearch} />
        </div>

        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[20px] font-semibold text-ink">Historial de paradas</h2>
          </div>

          <div className="flex flex-col gap-2">
            {seededRoutes.map(({ seed, origin, destination, line, arrival }) => {
              const alertLabel = activeAlertLabelForLine(seed.lineId, delayMinutes);
              return (
                <button
                  key={seed.id}
                  type="button"
                  onClick={() => startSeededTrip(seed)}
                  aria-label={`Iniciar viaje desde ${seed.originLabel} hacia ${seed.destinationLabel} en la línea ${line.shortName}${alertLabel ? `. Alerta: ${alertLabel}` : ''}`}
                  className="w-full text-left bg-canvas rounded-2xl border border-hairline shadow-sm px-3.5 py-2.5 flex items-center gap-3 hover:bg-canvas-soft active:scale-[0.99] transition-all"
                >
                  <LineBadge shortName={line.shortName} color={line.color} size="md" />

                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 text-[13px] leading-snug">
                      <span className="font-bold text-ink shrink-0">Desde:</span>
                      <span className="font-medium text-text-muted truncate">
                        {seed.originLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 text-[13px] leading-snug">
                      <span className="font-bold text-ink shrink-0">Hacia:</span>
                      <span className="font-medium text-text-muted truncate">
                        {seed.destinationLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {arrival ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#16a34a]/10 text-[#16a34a] text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse shrink-0" />
                        <span>
                          {arrival.minutos === 0 ? 'En parada' : `Llega en ${arrival.minutos} min`}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-canvas-soft border border-hairline text-text-muted text-[11px] font-medium">
                        Sin datos
                      </span>
                    )}
                    {alertLabel && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d97706]/10 text-[#d97706] text-[10px] font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{alertLabel}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Alertas — primer incidente activo del catálogo */}
        {(() => {
          const firstAlert = ACTIVE_ALERTS[0];
          const firstLine = firstAlert
            ? MOCK_LINES.find((l) => l.id === firstAlert.lineId)
            : null;
          const AlertIcon =
            firstAlert?.type === 'route_change' ? Route : AlertTriangle;
          return (
            <section className="mt-1 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[20px] font-semibold text-ink">
                  Alertas
                </h2>
              </div>
              {firstAlert && firstLine ? (
                <div
                  className="bg-canvas border border-hairline rounded-2xl p-4 flex items-start gap-3 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-canvas-soft flex items-center justify-center flex-shrink-0">
                    <AlertIcon className="w-5 h-5 text-[#d97706]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-ink">
                        {firstAlert.title}
                      </p>
                      <span className="px-2.5 py-0.5 rounded-full bg-canvas-soft border border-hairline text-text-muted text-xs font-medium shrink-0">
                        Hace 2hs
                      </span>
                    </div>
                    <p className="text-sm text-text-muted leading-snug">
                      Línea {firstLine.shortName}: {firstAlert.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-canvas border border-hairline rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
                  <p className="text-sm text-text-muted">
                    Sin alertas activas — todas las líneas circulan con
                    normalidad.
                  </p>
                </div>
              )}
            </section>
          );
        })()}
      </main>

      {/* Hoja de respuesta del asistente: fija sobre el dock, con colapso por arrastre.
          Solo visible en fase answer (PBI-019); al re-abrir el chip vuelve el mismo
          contexto persistido, refrescado con GPS live. */}
      {phase === 'answer' && answer && (
        <AssistantAnswerSheet
          answer={answer}
          contextLabel={session.lugar?.name}
          onChangePlace={session.consentido ? handleChangePlace : undefined}
          onClose={closeAnswer}
          onSelectCandidate={handleSelectCandidate}
          onAskArrivalsAt={handleAskArrivalsAt}
          onOpenTripOnMap={handleOpenTripOnMap}
          onRepickDestination={handleRepickDestination}
        />
      )}

      {/* Flujo PBI-019: permiso decorativo → selector de lugar */}
      {phase === 'consent' && (
        <LocationConsentModal
          onUseReal={handleConsentUseReal}
          onUseDemo={handleConsentUseDemo}
          onClose={handleConsentClose}
        />
      )}
      {phase === 'selector' && (
        <PlaceSelector onSelect={handlePlaceSelect} onCancel={handlePlaceCancel} />
      )}

      {/* §2 Wizard "¿Cómo llego a…?" en 3 pasos (PBI-020). Con guía previa
          persistida, reanuda en el paso Destino con los datos cargados. */}
      <AssistantWizard
        open={wizardOpen}
        locationName={assistantRefFromSession(session).name}
        nearbyStops={wizardNearbyStops}
        initialStep={!pendingDestino && wizardResumeGuide ? 'destino' : undefined}
        initialParadaId={!pendingDestino ? wizardResumeGuide?.paradaId ?? null : null}
        initialDestino={pendingDestino?.name ?? wizardResumeGuide?.destino ?? null}
        preselectedDestination={pendingDestino}
        submissionError={wizardError}
        onChangeLocation={handleWizardChangeLocation}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
      />

      <div className="shrink-0 fixed bottom-0 left-0 right-0 z-40">
        <BottomNav />
      </div>
    </div>
  );
}
