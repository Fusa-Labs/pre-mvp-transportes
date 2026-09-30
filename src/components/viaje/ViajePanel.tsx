"use client";

import { useState, useMemo, useEffect, useId } from "react";
import { Footprints, ChevronUp, Layers, Info } from "lucide-react";
import { TripOption, LocationPoint, TransitLeg, WalkingLeg } from "@/types/trip-planner";
import { TripPlannerService } from "@/lib/services/trip-planner-service";
import { useDragCollapse } from "@/lib/hooks/use-drag-collapse";
import type { BoardingOptionRow } from "@/lib/services/trip-boarding-options";

export function GreenFlagUiIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line x1="4" y1="21.5" x2="4" y2="2.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="2.5" r="1.25" fill="#64748B" />
      <path
        d="M4 4C8 2.5 12 5 19 3.5V13.5C12 15 8 12.5 4 14V4Z"
        fill="#22C55E"
        stroke="#16A34A"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckeredFlagUiIcon({ className }: { className?: string }) {
  const rawId = useId();
  const clipId = `checkered-flag-${rawId.replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M4 4C8 2.5 12 5 19 3.5V13.5C12 15 8 12.5 4 14V4Z" />
        </clipPath>
      </defs>
      <line x1="4" y1="21.5" x2="4" y2="2.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="2.5" r="1.25" fill="#64748B" />
      <g clipPath={`url(#${clipId})`}>
        <path d="M4 4C8 2.5 12 5 19 3.5V13.5C12 15 8 12.5 4 14V4Z" fill="#FFFFFF" />
        <rect x="4" y="2" width="3.75" height="4" fill="#1E293B" />
        <rect x="11.5" y="2" width="3.75" height="4" fill="#1E293B" />
        <rect x="7.75" y="6" width="3.75" height="4" fill="#1E293B" />
        <rect x="15.25" y="6" width="4.75" height="4" fill="#1E293B" />
        <rect x="4" y="10" width="3.75" height="5" fill="#1E293B" />
        <rect x="11.5" y="10" width="3.75" height="5" fill="#1E293B" />
      </g>
      <path
        d="M4 4C8 2.5 12 5 19 3.5V13.5C12 15 8 12.5 4 14V4Z"
        fill="none"
        stroke="#475569"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ViajePanelProps {
  options: TripOption[];
  selectedOptionId: string | null;
  onSelectOption: (optionId: string) => void;
  onClose: () => void;
  hasPointsSelected?: boolean;
  originLocation?: LocationPoint | null;
  destinationLocation?: LocationPoint | null;
  selectedStepId?: string | null;
  onSelectStep?: (stepId: string | null) => void;
  /** sdd/trip-options-upgrade 2.2: filas de abordaje (≤3) por parada de subida. */
  boardingOptions?: BoardingOptionRow[];
  selectedBoardingUnitKey?: string | null;
  onSelectBoardingOption?: (unitKey: string) => void;
  /** sdd/trip-options-upgrade display: etiquetas vivas (EstimacionLlegada). */
  liveHeroLabel?: string | null;
  liveFooterLabel?: string | null;
  /** sdd/trip-options-upgrade 2.3: espeja ViajeHeader:24 — reframe en expand+collapse. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** sdd/trip-options-upgrade 2.5: re-pick de destino sin perder el origen. */
  onRepickDestination?: () => void;
  initialCollapsed?: boolean;
  onFocusOriginStop?: () => void;
  onFocusDestinationStop?: () => void;
  onFocusTripOverview?: () => void;
  isWaitingToBoard?: boolean;
  isBoarded?: boolean;
  onStartBoardingSimulation?: () => void;
}

export default function ViajePanel({
  options,
  selectedOptionId,
  onClose,
  hasPointsSelected = true,
  originLocation = null,
  destinationLocation = null,
  selectedStepId = null,
  onSelectStep,
  boardingOptions = [],
  selectedBoardingUnitKey = null,
  onSelectBoardingOption,
  liveHeroLabel = null,
  onCollapsedChange,
  onRepickDestination,
  initialCollapsed = true,
  onFocusOriginStop,
  onFocusDestinationStop,
  onFocusTripOverview,
  isWaitingToBoard = false,
  isBoarded = false,
  onStartBoardingSimulation,
}: ViajePanelProps) {
  // Diagnóstico de cobertura cuando no hay rutas: ¿qué lado falla?
  const coverageInfo = useMemo(() => {
    if (options.length > 0 || !hasPointsSelected) return null;
    const oCands = originLocation ? TripPlannerService.findCandidateStops(originLocation) : [];
    const dCands = destinationLocation ? TripPlannerService.findCandidateStops(destinationLocation) : [];
    return {
      originNearest: oCands[0] || null,
      originCount: oCands.length,
      destNearest: dCands[0] || null,
      destCount: dCands.length,
    };
  }, [options.length, hasPointsSelected, originLocation, destinationLocation]);
  const [activeTab, setActiveTab] = useState<"recorrido" | "alternativas">("recorrido");
  const { collapsed, toggle, handleProps } = useDragCollapse(initialCollapsed);

  // sdd/trip-options-upgrade 2.3: notifica expand Y collapse (mirror ViajeHeader).
  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  const selectedTrip = options.find((o) => o.id === selectedOptionId) || options[0] || null;

  const [internalSelectedUnitKey, setInternalSelectedUnitKey] = useState<string | null>(null);
  const effectiveUnitKey = selectedBoardingUnitKey ?? internalSelectedUnitKey ?? boardingOptions[0]?.unitKey ?? null;
  const activeBoarding = boardingOptions.find((b) => b.unitKey === effectiveUnitKey) || boardingOptions[0];
  const firstRide = selectedTrip?.legs.find((leg): leg is TransitLeg => leg.type === "ride");
  const activeLineNumber = activeBoarding?.lineaNumero ?? firstRide?.lineaNumero ?? "65";
  const activeLineColor = activeBoarding?.colorHex ?? firstRide?.lineaColor ?? "#0284C7";
  const activeUnitNumber = activeBoarding?.interno ?? "62";
  const arrivalStatusLabel = activeBoarding?.displayLabel ?? (liveHeroLabel || "Arribando");

  // Derivación de la línea de tiempo limpia (estilo Google Maps / Moovit)
  const timelineData = useMemo(() => {
    if (!selectedTrip) return null;

    const legs = selectedTrip.legs || [];
    const realSteps = selectedTrip.steps.filter((s) => {
      // Eliminar pasos falsos de arribo/bajada de 1 min o 0 m
      if (s.id.startsWith("step-arrive-")) return false;
      if (
        s.type === "walk" &&
        (s.distanceMeters === 0 || (s.durationMinutes <= 1 && (!s.distanceMeters || s.distanceMeters <= 25)))
      ) {
        return false;
      }
      return true;
    });

    // Identificar tramos de transporte (ride legs)
    const rideLegs: {
      legIndex: number;
      step?: (typeof selectedTrip.steps)[number];
      lineaNumero: string;
      lineaColor: string;
      lineaTextColor?: string;
      ramalText: string;
      durationMinutes: number;
      stopCount: number;
      fromStopName: string;
      toStopName: string;
    }[] = [];

    if (legs.length > 0) {
      legs.forEach((leg, idx) => {
        if (leg.type === "ride") {
          const matchingStep = selectedTrip.steps.find((s) => s.legIndex === idx && s.type === "ride");
          const rawRamal =
            leg.ramalCodigo || leg.ramalNombre || matchingStep?.ramalCodigo || matchingStep?.ramalNombre || "Troncal";
          const ramalText = rawRamal.toLowerCase().startsWith("ramal") ? rawRamal : `Ramal ${rawRamal}`;
          rideLegs.push({
            legIndex: idx,
            step: matchingStep,
            lineaNumero: leg.lineaNumero || matchingStep?.lineaNumero || "65",
            lineaColor: leg.lineaColor || matchingStep?.lineaColor || "#0284C7",
            lineaTextColor: leg.lineaTextColor || matchingStep?.lineaTextColor || "#FFFFFF",
            ramalText,
            durationMinutes: leg.durationMinutes || matchingStep?.durationMinutes || 1,
            stopCount: leg.stopCount ?? matchingStep?.stopCount ?? 1,
            fromStopName: leg.fromStop?.nombre || matchingStep?.fromStopName || "Parada de origen",
            toStopName: leg.toStop?.nombre || matchingStep?.toStopName || "Parada de destino",
          });
        }
      });
    } else {
      realSteps.forEach((st, idx) => {
        if (st.type === "ride") {
          const rawRamal = st.ramalCodigo || st.ramalNombre || "Troncal";
          const ramalText = rawRamal.toLowerCase().startsWith("ramal") ? rawRamal : `Ramal ${rawRamal}`;
          rideLegs.push({
            legIndex: idx,
            step: st,
            lineaNumero: st.lineaNumero || "65",
            lineaColor: st.lineaColor || "#0284C7",
            lineaTextColor: st.lineaTextColor || "#FFFFFF",
            ramalText,
            durationMinutes: st.durationMinutes || 1,
            stopCount: st.stopCount ?? 1,
            fromStopName: st.fromStopName || "Parada de origen",
            toStopName: st.toStopName || "Parada de destino",
          });
        }
      });
    }

    // Caminata de acceso (al inicio, solo si > 25m)
    let accessWalk: {
      step?: (typeof selectedTrip.steps)[number];
      distanceMeters: number;
      durationMinutes: number;
    } | null = null;

    if (legs.length > 0 && legs[0]?.type === "walk" && legs[0].distanceMeters > 25) {
      const walkLeg = legs[0];
      const walkStep = selectedTrip.steps.find((s) => s.legIndex === 0 && s.type === "walk");
      accessWalk = {
        step: walkStep,
        distanceMeters: walkLeg.distanceMeters,
        durationMinutes: walkLeg.durationMinutes,
      };
    } else if (realSteps.length > 0 && realSteps[0]?.type === "walk" && (realSteps[0].distanceMeters ?? 0) > 25) {
      const walkStep = realSteps[0];
      accessWalk = {
        step: walkStep,
        distanceMeters: walkStep.distanceMeters ?? 50,
        durationMinutes: walkStep.durationMinutes,
      };
    }

    // Caminata de egreso (al final, solo si > 25m)
    let egressWalk: {
      step?: (typeof selectedTrip.steps)[number];
      distanceMeters: number;
      durationMinutes: number;
    } | null = null;

    if (
      legs.length > 1 &&
      legs[legs.length - 1]?.type === "walk" &&
      (legs[legs.length - 1] as WalkingLeg).distanceMeters > 25
    ) {
      const lastIdx = legs.length - 1;
      const walkLeg = legs[lastIdx] as WalkingLeg;
      const walkStep = selectedTrip.steps.find((s) => s.legIndex === lastIdx && s.type === "walk");
      egressWalk = {
        step: walkStep,
        distanceMeters: walkLeg.distanceMeters,
        durationMinutes: walkLeg.durationMinutes,
      };
    } else if (
      realSteps.length > 1 &&
      realSteps[realSteps.length - 1]?.type === "walk" &&
      (realSteps[realSteps.length - 1].distanceMeters ?? 0) > 25
    ) {
      const walkStep = realSteps[realSteps.length - 1];
      egressWalk = {
        step: walkStep,
        distanceMeters: walkStep.distanceMeters ?? 50,
        durationMinutes: walkStep.durationMinutes,
      };
    }

    // Transbordos entre tramos de transporte
    const transfers: {
      afterRideIndex: number;
      step?: (typeof selectedTrip.steps)[number];
      distanceMeters: number;
      durationMinutes: number;
    }[] = [];

    for (let i = 0; i < rideLegs.length - 1; i++) {
      const startIdx = rideLegs[i].legIndex;
      const endIdx = rideLegs[i + 1].legIndex;
      let dist = 30;
      let dur = 3;
      let transferStep: (typeof selectedTrip.steps)[number] | undefined;

      for (let k = startIdx + 1; k < endIdx; k++) {
        const intermediateLeg = legs[k];
        if (intermediateLeg?.type === "transfer") {
          dist = intermediateLeg.walkingDistanceMeters;
          dur = intermediateLeg.durationMinutes;
          transferStep = selectedTrip.steps.find((s) => s.legIndex === k);
          break;
        } else if (intermediateLeg?.type === "walk") {
          dist = intermediateLeg.distanceMeters;
          dur = intermediateLeg.durationMinutes;
          transferStep = selectedTrip.steps.find((s) => s.legIndex === k);
          break;
        }
      }

      if (!transferStep) {
        transferStep = selectedTrip.steps.find((s) => s.type === "transfer");
      }

      transfers.push({
        afterRideIndex: i,
        step: transferStep,
        distanceMeters: dist,
        durationMinutes: dur,
      });
    }

    return {
      rideLegs,
      accessWalk,
      egressWalk,
      transfers,
      isWalkOnly: rideLegs.length === 0,
      originName: originLocation?.name || selectedTrip.origin?.name || "Origen",
      destinationName: destinationLocation?.name || selectedTrip.destination?.name || "Destino",
    };
  }, [selectedTrip, originLocation, destinationLocation]);

  // CASO: Sin rutas disponibles (explicación humana, sin tecnicismos de RAPTOR ni corredores)
  if (options.length === 0 && hasPointsSelected) {
    return (
      <aside
        aria-label="Panel de opciones de viaje"
        className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[420px] bg-canvas dark:bg-canvas border border-hairline rounded-[28px] p-5 shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col items-center text-center pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-2 text-text-muted">
          <Info className="w-5 h-5 text-electric-blue" />
        </div>
        <p className="text-sm font-bold text-ink">No encontramos una combinación viable</p>
        {coverageInfo && (
          <div className="w-full mt-2 space-y-1 text-left">
            <p className="text-xs text-text-muted leading-relaxed">
              {coverageInfo.originCount === 0
                ? `⚠️ Origen sin cobertura: no hay paradas a menos de 2000m.`
                : `✓ Origen: ${coverageInfo.originCount} parada(s) cerca${coverageInfo.originNearest ? ` (más cercana: ${coverageInfo.originNearest.stop.nombre} a ${coverageInfo.originNearest.distanceMeters}m)` : ""}.`}
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {coverageInfo.destCount === 0
                ? `⚠️ Destino sin cobertura: no hay paradas a menos de 2000m.`
                : `✓ Destino: ${coverageInfo.destCount} parada(s) cerca${coverageInfo.destNearest ? ` (más cercana: ${coverageInfo.destNearest.stop.nombre} a ${coverageInfo.destNearest.distanceMeters}m)` : ""}.`}
            </p>
            {coverageInfo.originCount > 0 && coverageInfo.destCount > 0 && (
              <p className="text-xs text-text-muted leading-relaxed">
                Ambas puntas tienen paradas, pero ninguna línea conecta esos puntos (ni directo ni con transbordo). Probá con puntos sobre los corredores 65 o 194.
              </p>
            )}
          </div>
        )}
        <div className="mt-3.5 flex items-center gap-2">
          {onRepickDestination && (
            <button
              type="button"
              onClick={onRepickDestination}
              className="px-4 py-1.5 rounded-full bg-ink text-canvas text-xs font-bold transition-colors active:scale-95"
            >
              Elegir otro destino
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-canvas-soft hover:bg-field border border-hairline text-xs font-bold text-ink transition-colors active:scale-95"
          >
            Cerrar búsqueda
          </button>
        </div>
      </aside>
    );
  }

  // CASO: Aún no se seleccionaron origen y destino
  if (options.length === 0) {
    return (
      <aside
        aria-label="Panel de opciones de viaje"
        className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[420px] bg-canvas dark:bg-canvas border border-hairline rounded-[28px] p-5 shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col items-center text-center pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        <p className="text-sm font-bold text-ink">Elegí tu destino para calcular el viaje</p>
        <p className="text-xs text-text-muted mt-1">
          Podés escribir una dirección o tocar &quot;En mapa&quot; para fijar un punto directamente.
        </p>
      </aside>
    );
  }

  // Fixed-height sheet (sdd/trip-sheet-ui-fix 2.1): expanded height is fixed
  // and dvh-capped so the top edge never rises above the recenter controls
  // nor covers the bus marker. Collapsed stays a 68px strip.
  return (
    <aside
      aria-label="Panel de opciones de viaje"
      className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[420px] bg-canvas dark:bg-canvas border border-hairline rounded-[28px] shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden transition-[max-height] duration-300"
      style={{ height: collapsed ? 68 : "auto", maxHeight: collapsed ? "68px" : "min(40dvh, 320px)" }}
    >
      {/* Grip de arrastre */}
      <div className="pt-1.5 pb-0.5 flex justify-center shrink-0" aria-hidden="true">
        <div className="w-9 h-1 rounded-full bg-hairline" />
      </div>

      {collapsed ? (
        <div
          {...handleProps}
          onClick={toggle}
          className="px-4 pt-1 pb-2 flex items-center justify-between shrink-0 select-none cursor-pointer bg-canvas dark:bg-canvas relative z-10 w-full"
          title="Expandir panel"
        >
          {/* Left: Line badge, unit text, and status badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: activeLineColor }}
            >
              {activeLineNumber}
            </span>
            <span className="text-xs font-bold text-ink truncate shrink-0">
              Coche {activeUnitNumber}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{arrivalStatusLabel}</span>
            </span>
          </div>

          {/* Right: Text "Recorrido" and ChevronUp icon */}
          <div className="flex items-center gap-1 shrink-0 text-text-muted hover:text-ink transition-colors">
            <span className="text-xs font-semibold">Recorrido</span>
            <ChevronUp className="w-4 h-4 shrink-0" />
          </div>
        </div>
      ) : (
        <div
          className="px-4 pt-2 pb-2 flex items-center justify-between shrink-0 select-none bg-canvas dark:bg-canvas relative z-10"
          {...handleProps}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            toggle();
          }}
          title="Contraer panel"
        >
          {/* Left: Line badge, unit text, and status badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: activeLineColor }}
            >
              {activeLineNumber}
            </span>
            <span className="text-xs font-bold text-ink truncate shrink-0">
              Coche {activeUnitNumber}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{arrivalStatusLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("recorrido")}
              className={`px-2 py-1 text-xs font-semibold transition-colors ${
                activeTab === "recorrido" ? "text-ink underline underline-offset-4 decoration-2" : "text-text-muted hover:text-ink"
              }`}
            >
              Recorrido
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("alternativas")}
              className={`px-2 py-1 text-xs font-semibold transition-colors ${
                activeTab === "alternativas" ? "text-ink underline underline-offset-4 decoration-2" : "text-text-muted hover:text-ink"
              }`}
            >
              Otras alternativas
            </button>
          </div>
        </div>
      )}

      {/* Contenido según la pestaña activa (oculto al contraer) */}
      {!collapsed && (
      <div className="p-3 overflow-y-auto overscroll-contain no-scrollbar space-y-2.5 flex-1 min-h-0">
        {/* Opciones/Pasos scroll internally (2.2): min-h-0 lets the flex child
            shrink so overflow-y-auto engages; overscroll-contain keeps sheet
            scroll from chaining to the map. */}
        {activeTab === "alternativas" ? (
          <div className="space-y-2">
            {/* sdd/trip-options-upgrade 2.2: filas de abordaje (≤3) — unidad×ETA×línea.
                Tap → mapa (correct bus) en un render. Aditivo sobre tripOptions. */}
            {boardingOptions.length > 0 && (
              <div className="space-y-1.5" aria-label="Próximos colectivos en tu parada">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Otras alternativas
                </p>
                {boardingOptions.slice(0, 3).map((row, idx) => {
                  const isRowSelected = row.unitKey === effectiveUnitKey;
                  return (
                    <button
                      key={row.unitKey}
                      type="button"
                      onClick={() => {
                        setInternalSelectedUnitKey(row.unitKey);
                        onSelectBoardingOption?.(row.unitKey);
                      }}
                      aria-label={`Tomar línea ${row.lineaNumero}, coche ${row.interno}, ${row.displayLabel}`}
                      className={`w-full text-left px-3 py-2 rounded-[16px] transition-colors active:scale-[0.99] flex items-center justify-between gap-2 ${
                        isRowSelected
                          ? "bg-canvas-soft ring-1 ring-ink/15"
                          : "hover:bg-canvas-soft/60"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs"
                          style={{ backgroundColor: row.colorHex, color: "#FFFFFF" }}
                        >
                          {row.lineaNumero}
                        </span>
                        <span className="text-xs font-bold text-ink truncate">
                          Coche {row.interno}
                          {idx === 0 && (
                            <span className="ml-1.5 text-[10px] font-semibold text-text-muted">
                              · más próximo
                            </span>
                          )}
                          {idx === 1 && (
                            <span className="ml-1.5 text-[10px] font-semibold text-text-muted">
                              · siguiente
                            </span>
                          )}
                          {row.kind === "other-line" && idx >= 2 && (
                            <span className="ml-1.5 text-[10px] font-semibold text-text-muted">
                              · otra línea
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#16a34a]/10 text-[#16a34a] text-xs font-bold shrink-0 border border-[#16a34a]/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse shrink-0" />
                        <span>{row.displayLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Pestaña: Guía paso a paso (Línea de tiempo limpia tipo Google Maps / Moovit) */
          <div className="py-1">
            {!timelineData || (timelineData.rideLegs.length === 0 && !timelineData.isWalkOnly) ? (
              <p className="text-xs text-text-muted px-1">No hay información detallada para este viaje.</p>
            ) : timelineData.isWalkOnly ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 flex justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-text-muted shrink-0" />
                  </div>
                  <p className="text-xs text-text-muted truncate leading-tight">
                    Origen: <span className="font-semibold text-ink">{timelineData.originName}</span>
                  </p>
                </div>

                <div className="flex items-stretch gap-2.5 my-1">
                  <div className="w-5 flex justify-center shrink-0 py-0.5">
                    <div className="w-0.5 h-full border-l-2 border-dashed border-hairline" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-[11px] text-text-muted font-medium bg-canvas-soft/40 border border-hairline/40">
                      <Footprints className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Caminar hasta destino (~{selectedTrip?.totalDurationMinutes} min)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-5 flex justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-electric-blue shrink-0 shadow-2xs" />
                  </div>
                  <p className="text-xs text-text-muted truncate leading-tight">
                    Destino: <span className="font-semibold text-ink">{timelineData.destinationName}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Conexión de caminata de acceso si corresponde */}
                {timelineData.accessWalk && (
                  <div className="space-y-0.5 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 flex justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-text-muted/60 shrink-0" />
                      </div>
                      <p className="text-xs text-text-muted truncate leading-tight">
                        Origen: <span className="font-medium text-ink">{timelineData.originName}</span>
                      </p>
                    </div>

                    <div className="flex items-stretch gap-2.5 my-0.5">
                      <div className="w-5 flex justify-center shrink-0 py-0.5">
                        <div className="w-0.5 h-full border-l-2 border-dashed border-hairline" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          role={timelineData.accessWalk.step ? "button" : undefined}
                          tabIndex={timelineData.accessWalk.step ? 0 : undefined}
                          onClick={
                            timelineData.accessWalk.step
                              ? () =>
                                  onSelectStep?.(
                                    selectedStepId === timelineData.accessWalk!.step!.id
                                      ? null
                                      : timelineData.accessWalk!.step!.id
                                  )
                              : undefined
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-[11px] text-text-muted font-medium transition-colors ${
                            timelineData.accessWalk.step ? "cursor-pointer hover:bg-canvas-soft/60" : ""
                          } ${
                            selectedStepId === timelineData.accessWalk.step?.id
                              ? "bg-electric-blue/10 ring-1 ring-electric-blue/30 text-ink"
                              : "bg-canvas-soft/40 border border-hairline/40"
                          }`}
                        >
                          <Footprints className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            Caminar {timelineData.accessWalk.distanceMeters} m (~{timelineData.accessWalk.durationMinutes} min)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tramos de colectivo en la línea de tiempo */}
                {timelineData.rideLegs.map((ride, rIdx) => {
                  const isRideSelected = ride.step && ride.step.id === selectedStepId;
                  const tappable = ride.step?.legIndex !== undefined && !!onSelectStep;
                  const transferAfter = timelineData.transfers.find((t) => t.afterRideIndex === rIdx);

                  return (
                    <div key={`ride-leg-${rIdx}`} className="space-y-0.5">
                      {/* Nodo de subida ("Subir en") */}
                      <div className="flex items-center justify-between gap-2 rounded-xl px-1.5 py-1 -mx-1.5 transition-all">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => onFocusOriginStop?.()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onFocusOriginStop?.();
                            }
                          }}
                          className="flex items-center gap-2.5 cursor-pointer active:scale-[0.99] hover:bg-canvas-soft/60 rounded-lg py-0.5 px-1 -my-0.5 select-none group min-w-0"
                          title="Ver parada de subida en 3D"
                        >
                          <div className="w-5 flex justify-center shrink-0">
                            <GreenFlagUiIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                          </div>
                          <p className="text-xs text-text-muted truncate leading-tight">
                            Subir en: <span className="font-bold text-ink group-hover:text-primary transition-colors">{ride.fromStopName}</span>
                          </p>
                        </div>

                        {/* Botón o Badge de Abordaje Simulado */}
                        {rIdx === 0 && (
                          <div className="shrink-0">
                            {isBoarded ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                A bordo · Siguiendo
                              </span>
                            ) : isWaitingToBoard ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Esperando en parada...
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartBoardingSimulation?.();
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-sm transition-all"
                                title="Iniciar simulación de viaje en esta parada"
                              >
                                <span>Iniciar viaje</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Barra vertical de color oficial + Tarjeta de viaje en colectivo */}
                      <div className="flex items-stretch gap-2.5 my-2.5">
                        <div className="w-5 flex justify-center shrink-0 py-0.5">
                          <div
                            className="w-1 h-full rounded-full shrink-0"
                            style={{ backgroundColor: ride.lineaColor }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Ver recorrido completo Línea ${ride.lineaNumero} en el mapa`}
                            onClick={() => {
                              onFocusTripOverview?.();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onFocusTripOverview?.();
                              }
                            }}
                            className={`w-full text-left px-3 py-2 rounded-[14px] transition-all cursor-pointer active:scale-[0.99] ${
                              isRideSelected
                                ? "bg-canvas-soft ring-2 ring-electric-blue/40 shadow-xs"
                                : "bg-canvas-soft/80 hover:bg-canvas-soft border border-hairline/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Burbuja circular de línea */}
                              <span
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs"
                                style={{
                                  backgroundColor: ride.lineaColor,
                                  color: ride.lineaTextColor || "#FFFFFF",
                                }}
                              >
                                {ride.lineaNumero}
                              </span>

                              {/* Contenido: Ramal, duración y cantidad de paradas */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-xs font-bold text-ink truncate">
                                    {ride.ramalText}
                                  </span>
                                  <span className="text-[11px] font-semibold text-text-muted shrink-0 tabular-nums">
                                    ~{ride.durationMinutes} min de viaje
                                  </span>
                                </div>
                                <p className="text-[10px] text-text-muted font-medium mt-0.5 truncate">
                                  {ride.stopCount} {ride.stopCount === 1 ? "parada" : "paradas"} durante el recorrido
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Nodo de bajada ("Bajar en") */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onFocusDestinationStop?.()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onFocusDestinationStop?.();
                          }
                        }}
                        className="flex items-center gap-2.5 cursor-pointer active:scale-[0.99] hover:bg-canvas-soft/60 rounded-xl px-1.5 py-1 -mx-1.5 transition-all select-none group"
                        title="Ver parada de bajada en 3D"
                      >
                        <div className="w-5 flex justify-center shrink-0">
                          <CheckeredFlagUiIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-xs text-text-muted truncate leading-tight">
                          Bajar en: <span className="font-bold text-ink group-hover:text-primary transition-colors">{ride.toStopName}</span>
                        </p>
                      </div>

                      {/* Conexión de transbordo si no es el último tramo de colectivo */}
                      {transferAfter && (
                        <div className="flex items-stretch gap-2.5 my-1">
                          <div className="w-5 flex justify-center shrink-0 py-0.5">
                            <div className="w-0.5 h-full border-l-2 border-dashed border-hairline" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              role={transferAfter.step ? "button" : undefined}
                              tabIndex={transferAfter.step ? 0 : undefined}
                              onClick={
                                transferAfter.step
                                  ? () =>
                                      onSelectStep?.(
                                        selectedStepId === transferAfter.step!.id ? null : transferAfter.step!.id
                                      )
                                  : undefined
                              }
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-[11px] text-amber-700 dark:text-amber-400 font-semibold transition-colors ${
                                transferAfter.step ? "cursor-pointer hover:bg-canvas-soft/60" : ""
                              } ${
                                selectedStepId === transferAfter.step?.id
                                  ? "bg-amber-500/10 ring-1 ring-amber-500/30"
                                  : "bg-canvas-soft/40 border border-hairline/40"
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                Transbordo{transferAfter.distanceMeters > 15 ? ` · Caminar ${transferAfter.distanceMeters} m` : ""} (~{transferAfter.durationMinutes} min)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Conexión de caminata de egreso si corresponde */}
                {timelineData.egressWalk && (
                  <div className="space-y-0.5 mt-1">
                    <div className="flex items-stretch gap-2.5 my-0.5">
                      <div className="w-5 flex justify-center shrink-0 py-0.5">
                        <div className="w-0.5 h-full border-l-2 border-dashed border-hairline" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          role={timelineData.egressWalk.step ? "button" : undefined}
                          tabIndex={timelineData.egressWalk.step ? 0 : undefined}
                          onClick={
                            timelineData.egressWalk.step
                              ? () =>
                                  onSelectStep?.(
                                    selectedStepId === timelineData.egressWalk!.step!.id
                                      ? null
                                      : timelineData.egressWalk!.step!.id
                                  )
                              : undefined
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[12px] text-[11px] text-text-muted font-medium transition-colors ${
                            timelineData.egressWalk.step ? "cursor-pointer hover:bg-canvas-soft/60" : ""
                          } ${
                            selectedStepId === timelineData.egressWalk.step?.id
                              ? "bg-electric-blue/10 ring-1 ring-electric-blue/30 text-ink"
                              : "bg-canvas-soft/40 border border-hairline/40"
                          }`}
                        >
                          <Footprints className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            Caminar {timelineData.egressWalk.distanceMeters} m (~{timelineData.egressWalk.durationMinutes} min)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-5 flex justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-electric-blue shrink-0 shadow-2xs" />
                      </div>
                      <p className="text-xs text-text-muted truncate leading-tight">
                        Destino: <span className="font-medium text-ink">{timelineData.destinationName}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </aside>
  );
}
