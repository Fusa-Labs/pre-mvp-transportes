"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "motion/react";
import {
  Clock,
  MapPin,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Users,
  BusFront,
  CheckCircle2,
} from "lucide-react";
import { AlertaServicio, EstimacionLlegada, Linea, Parada } from "@/types/transport";

export type SheetState = "collapsed" | "peek" | "expanded";

interface BottomSheetPanelProps {
  selectedLinea: Linea | null;
  selectedParada: Parada | null;
  paradas: Parada[];
  llegadas: EstimacionLlegada[];
  alertas: AlertaServicio[];
  totalVehiculosActivos?: number;
  onSelectParada: (parada: Parada) => void;
  onClearSelection: () => void;
}

/**
 * Componente modular BottomSheetPanel (Fase 4 & 5).
 * Panel táctil deslizable inferior con 3 estados conceptuales (collapsed, peek, expanded)
 * optimizado para ergonomía móvil, safe-areas (home bar) y touch targets de 44px+.
 */
export default function BottomSheetPanel({
  selectedLinea,
  selectedParada,
  paradas,
  llegadas,
  alertas,
  totalVehiculosActivos = 0,
  onSelectParada,
  onClearSelection,
}: BottomSheetPanelProps) {
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [activeTab, setActiveTab] = useState<"llegadas" | "paradas" | "alertas">("llegadas");

  const paradasFiltradas = selectedLinea
    ? paradas.filter((p) => p.lineasIds.includes(selectedLinea.id))
    : paradas;

  const alertasFiltradas = selectedLinea
    ? alertas.filter((a) => a.lineaId === selectedLinea.id)
    : alertas;

  // Alturas optimizadas con dvh y safe area
  const heightStyles: Record<SheetState, string> = {
    collapsed: "h-[calc(76px+env(safe-area-inset-bottom,0px))]",
    peek: "h-[calc(340px+env(safe-area-inset-bottom,0px))]",
    expanded: "h-[82dvh]",
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 35;
    if (info.offset.y < -threshold) {
      if (sheetState === "collapsed") setSheetState("peek");
      else if (sheetState === "peek") setSheetState("expanded");
    } else if (info.offset.y > threshold) {
      if (sheetState === "expanded") setSheetState("peek");
      else if (sheetState === "peek") setSheetState("collapsed");
    }
  };

  const toggleNextState = () => {
    if (sheetState === "collapsed") setSheetState("peek");
    else if (sheetState === "peek") setSheetState("expanded");
    else setSheetState("peek");
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 rounded-t-3xl shadow-2xl transition-all duration-300 pointer-events-auto flex flex-col pb-[max(16px,env(safe-area-inset-bottom))] ${heightStyles[sheetState]}`}
    >
      {/* 1. Handle de agarre superior & Barra de Estado Resumen (Touch target de 48px) */}
      <div
        onClick={toggleNextState}
        className="pt-2.5 pb-2 px-5 flex flex-col items-center cursor-pointer select-none shrink-0 min-h-[48px]"
      >
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700 mb-2" />

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            {selectedLinea ? (
              <div className="flex items-center gap-2 truncate">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-black shadow-sm shrink-0"
                  style={{ backgroundColor: selectedLinea.colorHex, color: selectedLinea.textColorHex }}
                >
                  LÍNEA {selectedLinea.numero}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {selectedLinea.nombre}
                </span>
              </div>
            ) : selectedParada ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">{selectedParada.nombre}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <BusFront className="w-4 h-4 text-amber-500" />
                <span>Monitoreo de Transporte AMBA</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">
              {sheetState}
            </span>
            {sheetState === "expanded" ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Tabs de Navegación (Touch targets ergonómicos de 44px de altura mínima) */}
      {sheetState !== "collapsed" && (
        <div className="px-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-around shrink-0 min-h-[44px]">
          <button
            onClick={() => setActiveTab("llegadas")}
            className={`min-h-[44px] px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 touch-manipulation ${
              activeTab === "llegadas"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Llegadas ({llegadas.length})</span>
            {activeTab === "llegadas" && (
              <motion.div
                layoutId="sheet-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("paradas")}
            className={`min-h-[44px] px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 touch-manipulation ${
              activeTab === "paradas"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Paradas ({paradasFiltradas.length})</span>
            {activeTab === "paradas" && (
              <motion.div
                layoutId="sheet-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("alertas")}
            className={`min-h-[44px] px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 touch-manipulation ${
              activeTab === "alertas"
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alertas ({alertasFiltradas.length})</span>
            {activeTab === "alertas" && (
              <motion.div
                layoutId="sheet-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
              />
            )}
          </button>
        </div>
      )}

      {/* 3. Contenido Desplazable del Panel */}
      {sheetState !== "collapsed" && (
        <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-3 overscroll-contain">
          <AnimatePresence mode="wait">
            {/* TAB 1: FICHA TÉCNICA & LLEGADAS (ETA) */}
            {activeTab === "llegadas" && (
              <motion.div
                key="tab-llegadas-content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-3"
              >
                {/* Ficha técnica compacta */}
                {selectedLinea && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        {selectedLinea.empresa}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                        Frecuencia: {selectedLinea.frecuenciaPicoMin} min
                      </span>
                    </div>
                    {selectedLinea.mensajeEstado && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {selectedLinea.mensajeEstado}
                      </p>
                    )}
                  </div>
                )}

                {/* Próximos colectivos (ETAs) */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Próximos arribos estimados
                  </p>

                  {llegadas.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No hay arribos programados en esta parada en este momento.
                    </div>
                  ) : (
                    llegadas.map((llegada, idx) => (
                      <div
                        key={`${llegada.lineaId}-${llegada.interno}-${idx}`}
                        className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 rounded-2xl p-3 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0"
                            style={{ backgroundColor: llegada.colorHex, color: "#000" }}
                          >
                            {llegada.lineaNumero}
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {llegada.ramal}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              <span>Coche #{llegada.interno}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {llegada.ocupacion}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-baseline justify-end gap-1">
                            <span
                              className={`text-xl font-black ${
                                llegada.minutos <= 3
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : llegada.minutos <= 7
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {llegada.minutos}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">min</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">a {llegada.distanciaMetros}m</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 2: LISTA DE PARADAS & RECORRIDO (Touch target de 48px por parada) */}
            {activeTab === "paradas" && (
              <motion.div
                key="tab-paradas-content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Secuencia de paradas ({paradasFiltradas.length})
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Tocar para enfocar
                  </span>
                </div>

                {paradasFiltradas.map((parada, idx) => {
                  const isSelected = selectedParada?.id === parada.id;
                  return (
                    <div
                      key={parada.id}
                      onClick={() => onSelectParada(parada)}
                      className={`min-h-[48px] flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                        isSelected
                          ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700"
                          : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 ${
                            isSelected
                              ? "bg-amber-500 border-white ring-2 ring-amber-500"
                              : "bg-slate-400 dark:bg-zinc-600 border-white dark:border-zinc-900"
                          }`}
                        />
                      </div>

                      <div className="flex-1 truncate">
                        <p
                          className={`text-xs font-bold truncate ${
                            isSelected
                              ? "text-amber-800 dark:text-amber-300"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {parada.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{parada.direccion}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {parada.lineasIds.slice(0, 3).map((lId) => (
                          <span
                            key={lId}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-700 text-[9px] font-bold text-slate-700 dark:text-slate-200"
                          >
                            {lId.replace("linea-", "").replace("line-", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* TAB 3: ALERTAS DE SERVICIO */}
            {activeTab === "alertas" && (
              <motion.div
                key="tab-alertas-content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-2.5"
              >
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Novedades operativas del servicio
                </p>

                {alertasFiltradas.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Todas las líneas operando con normalidad.</span>
                  </div>
                ) : (
                  alertasFiltradas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className="p-3 rounded-2xl border bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                            LÍNEA {alerta.lineaNumero}
                          </span>
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                            {alerta.titulo}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {alerta.fechaHora}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alerta.descripcion}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
