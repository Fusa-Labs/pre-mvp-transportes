"use client";

import { useState, useMemo } from "react";
import { Clock, ArrowRight, Footprints, Bus, CheckCircle2, ChevronRight, Layers, X, Info } from "lucide-react";
import { TripOption, LocationPoint } from "@/types/trip-planner";
import { TripPlannerService } from "@/lib/services/trip-planner-service";

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
}

export default function ViajePanel({
  options,
  selectedOptionId,
  onSelectOption,
  onClose,
  hasPointsSelected = true,
  originLocation = null,
  destinationLocation = null,
  selectedStepId = null,
  onSelectStep,
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
  const [activeTab, setActiveTab] = useState<"opciones" | "guia">("opciones");

  const selectedTrip = options.find((o) => o.id === selectedOptionId) || options[0] || null;

  // CASO: Sin rutas disponibles (explicación humana, sin tecnicismos de RAPTOR ni corredores)
  if (options.length === 0 && hasPointsSelected) {
    return (
      <aside
        aria-label="Panel de opciones de viaje"
        className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[420px] bg-canvas/95 dark:bg-canvas/95 backdrop-blur-2xl border border-hairline rounded-[28px] p-5 shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col items-center text-center pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
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
        <button
          type="button"
          onClick={onClose}
          className="mt-3.5 px-4 py-1.5 rounded-full bg-canvas-soft hover:bg-field border border-hairline text-xs font-bold text-ink transition-colors active:scale-95"
        >
          Cerrar búsqueda
        </button>
      </aside>
    );
  }

  // CASO: Aún no se seleccionaron origen y destino
  if (options.length === 0) {
    return (
      <aside
        aria-label="Panel de opciones de viaje"
        className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[420px] bg-canvas/95 dark:bg-canvas/95 backdrop-blur-2xl border border-hairline rounded-[28px] p-5 shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col items-center text-center pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
      >
        <p className="text-sm font-bold text-ink">Elegí tu destino para calcular el viaje</p>
        <p className="text-xs text-text-muted mt-1">
          Podés escribir una dirección o tocar &quot;En mapa&quot; para fijar un punto directamente.
        </p>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Panel de opciones de viaje"
      className="fixed bottom-[84px] left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] max-w-[420px] max-h-[50dvh] bg-canvas/95 dark:bg-canvas/95 backdrop-blur-2xl border border-hairline rounded-[28px] shadow-[0_16px_45px_-4px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_50px_-4px_rgba(0,0,0,0.7)] flex flex-col pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200 overflow-hidden"
    >
      {/* Header del Panel: Alternativas vs Guía paso a paso */}
      <div className="p-3.5 pb-2.5 border-b border-hairline-soft flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 p-0.5 bg-canvas-soft border border-hairline rounded-full">
          <button
            type="button"
            onClick={() => setActiveTab("opciones")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeTab === "opciones"
                ? "bg-canvas text-ink shadow-xs"
                : "text-text-muted hover:text-ink"
            }`}
          >
            {options.length} Alternativa{options.length > 1 ? "s" : ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guia")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === "guia"
                ? "bg-canvas text-ink shadow-xs"
                : "text-text-muted hover:text-ink"
            }`}
          >
            <span>Guía de Viaje</span>
            {selectedTrip && (
              <span className="w-1.5 h-1.5 rounded-full bg-electric-blue" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedTrip && (
            <span className="text-[11px] font-bold text-text-muted">
              {selectedTrip.totalDurationMinutes} min
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-canvas-soft hover:bg-field border border-hairline flex items-center justify-center text-text-muted hover:text-ink transition-colors"
            title="Cerrar panel de opciones"
            aria-label="Cerrar panel de opciones"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      <div className="p-3 overflow-y-auto no-scrollbar space-y-2.5 flex-1">
        {activeTab === "opciones" ? (
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = opt.id === (selectedTrip?.id || selectedOptionId);

              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectOption(opt.id)}
                  className={`p-3 rounded-[20px] border transition-all cursor-pointer select-none active:scale-[0.99] ${
                    isSelected
                      ? "bg-canvas border-ink shadow-md ring-1 ring-ink/10"
                      : "bg-field/50 hover:bg-field border-hairline text-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-ink tracking-tight flex items-center gap-1">
                        <Clock className="w-4 h-4 text-electric-blue" />
                        {opt.totalDurationMinutes} min
                      </span>
                      <span className="text-xs font-semibold text-text-muted">
                        · {opt.transfersCount === 0 ? "directo" : `${opt.transfersCount} combinación`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {opt.linesInvolved
                        .filter((l, idx, arr) => idx === 0 || l.id !== arr[idx - 1].id)
                        .map((l, idx) => (
                        <div key={`${l.id}-${idx}`} className="flex items-center gap-1">
                          {idx > 0 && (
                            <ArrowRight className="w-2.5 h-2.5 text-text-muted" />
                          )}
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-black shadow-2xs"
                            style={{
                              backgroundColor: l.color,
                              color: l.textColor || "#FFFFFF",
                            }}
                          >
                            {l.numero}
                          </span>
                        </div>
                      ))}
                      {opt.linesInvolved.length === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-canvas-soft border border-hairline text-ink">
                          A pie
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-text-muted font-medium truncate">
                    {opt.title}
                  </p>

                  <div className="mt-2 pt-2 border-t border-hairline-soft flex items-center justify-between text-[11px]">
                    <span className="text-text-muted flex items-center gap-1 font-medium">
                      <Footprints className="w-3.5 h-3.5 text-text-muted" />
                      {opt.walkDistanceMeters} m ({opt.walkDurationMinutes} min a pie)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOption(opt.id);
                        setActiveTab("guia");
                      }}
                      className="text-xs font-bold text-electric-blue flex items-center gap-0.5 hover:underline"
                    >
                      Ver pasos
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Pestaña: Guía paso a paso (tapeable → enfoca el mapa) */
          <div className="space-y-1 py-1">
            {selectedTrip?.steps.map((step, idx) => {
              const isStepSelected = step.id === selectedStepId;
              const tappable = step.legIndex !== undefined && onSelectStep;
              return (
              <div
                key={step.id}
                role={tappable ? "button" : undefined}
                tabIndex={tappable ? 0 : undefined}
                aria-label={tappable ? `Ver paso ${idx + 1} en el mapa` : undefined}
                onClick={tappable ? () => onSelectStep(isStepSelected ? null : step.id) : undefined}
                onKeyDown={tappable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectStep(isStepSelected ? null : step.id); } } : undefined}
                className={`flex items-start gap-3 relative rounded-[16px] px-2 py-2 -mx-2 transition-colors ${
                  tappable ? "cursor-pointer active:scale-[0.99]" : ""
                } ${
                  isStepSelected ? "bg-electric-blue/10 ring-1 ring-electric-blue/30" : tappable ? "hover:bg-canvas-soft" : ""
                }`}
              >
                {/* Línea conectora entre pasos */}
                {idx < selectedTrip.steps.length - 1 && (
                  <div className="absolute left-[22px] top-9 bottom-0 w-0.5 bg-hairline -z-0" />
                )}

                {/* Ícono de tipo de paso + número */}
                <div className="flex flex-col items-center shrink-0 z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-xs ${
                      step.type === "walk"
                        ? "bg-canvas-soft border-hairline text-text-muted"
                        : step.type === "transfer"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                        : "bg-electric-blue text-white border-electric-blue"
                    } ${isStepSelected ? "ring-2 ring-electric-blue ring-offset-1" : ""}`}
                  >
                    {step.type === "walk" && <Footprints className="w-3.5 h-3.5" />}
                    {step.type === "transfer" && <Layers className="w-3.5 h-3.5" />}
                    {step.type === "ride" && <Bus className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[9px] font-bold text-text-faint mt-0.5">{idx + 1}</span>
                </div>

                {/* Detalle del paso */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-ink truncate leading-tight">
                      {step.description}
                    </p>
                    <span className="text-[10px] font-semibold text-text-muted shrink-0">
                      {step.durationMinutes} min
                    </span>
                  </div>

                  {step.type === "ride" && (
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                        style={{ backgroundColor: step.lineaColor || "#1D4ED8" }}
                      >
                        Línea {step.lineaNumero}
                      </span>
                      {step.ramalCodigo && (
                        <span className="text-[10px] text-text-muted font-medium truncate">
                          Ramal {step.ramalCodigo}{step.ramalNombre ? ` · ${step.ramalNombre}` : ""}
                        </span>
                      )}
                      {step.stopCount !== undefined && step.stopCount > 0 && (
                        <span className="text-[10px] text-text-muted font-medium">
                          · {step.stopCount} parada{step.stopCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}

                  {step.type === "walk" && step.distanceMeters !== undefined && step.distanceMeters > 0 && (
                    <p className="text-[10px] text-text-muted font-medium mt-0.5">
                      {step.distanceMeters}m a pie
                      {tappable ? " · tocá para ver en el mapa" : ""}
                    </p>
                  )}

                  {step.type === "transfer" && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                      Transbordo entre líneas
                      {step.distanceMeters !== undefined && step.distanceMeters > 15 ? ` · ${step.distanceMeters}m a pie` : ""}
                      {tappable ? " · tocá para ver en el mapa" : ""}
                    </p>
                  )}
                  {step.type === "ride" && tappable && (
                    <p className="text-[10px] text-electric-blue font-semibold mt-0.5">
                      Tocá para ver el tramo en el mapa
                    </p>
                  )}
                </div>
              </div>
              );
            })}

            <div className="pt-2 flex items-center justify-between border-t border-hairline-soft">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Llegada a destino estimada</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("opciones")}
                className="text-xs font-bold text-text-muted hover:text-ink"
              >
                Volver a opciones
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
