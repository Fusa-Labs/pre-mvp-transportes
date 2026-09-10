"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  MapPin,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Users,
  ShieldCheck,
  Compass,
  BusFront,
} from "lucide-react";
import { AlertaServicio, EstimacionLlegada, Linea, Parada } from "@/types/transport";

interface BottomSheetDrawerProps {
  selectedLinea: Linea | null;
  selectedParada: Parada | null;
  paradas: Parada[];
  llegadas: EstimacionLlegada[];
  alertas: AlertaServicio[];
  onSelectParada: (parada: Parada) => void;
  onClearSelection: () => void;
}

export default function BottomSheetDrawer({
  selectedLinea,
  selectedParada,
  paradas,
  llegadas,
  alertas,
  onSelectParada,
  onClearSelection,
}: BottomSheetDrawerProps) {
  const [activeTab, setActiveTab] = useState<"llegadas" | "recorrido" | "alertas">("llegadas");
  const [isExpanded, setIsExpanded] = useState(false);

  // Filtrar paradas según la línea seleccionada si existe
  const paradasVisibles = selectedLinea
    ? paradas.filter((p) => p.lineasIds.includes(selectedLinea.id))
    : paradas;

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className={`fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 rounded-t-3xl shadow-2xl transition-all duration-300 pointer-events-auto ${
        isExpanded ? "h-[75vh]" : "h-[290px]"
      }`}
    >
      {/* Handle superior de arrastre / click para expandir */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="pt-2.5 pb-2 px-6 flex flex-col items-center cursor-pointer select-none"
      >
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />
        <div className="w-full flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {selectedLinea ? (
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-xs font-black shadow-sm"
                  style={{ backgroundColor: selectedLinea.colorHex, color: selectedLinea.textColorHex }}
                >
                  LÍNEA {selectedLinea.numero}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                  {selectedLinea.empresa}
                </span>
              </div>
            ) : selectedParada ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span className="truncate max-w-[220px]">{selectedParada.nombre}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <BusFront className="w-4 h-4 text-amber-500" />
                <span>Monitoreo de Flota AMBA</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[11px] font-medium hidden sm:inline">
              {isExpanded ? "Reducir" : "Expandir"}
            </span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Selector de Pestañas (Tabs) */}
      <div className="px-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-around">
        <button
          onClick={() => setActiveTab("llegadas")}
          className={`py-2 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === "llegadas"
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Próximos Arribos</span>
          {activeTab === "llegadas" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab("recorrido")}
          className={`py-2 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === "recorrido"
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Paradas ({paradasVisibles.length})</span>
          {activeTab === "recorrido" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab("alertas")}
          className={`py-2 px-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
            activeTab === "alertas"
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Alertas ({alertas.length})</span>
          {activeTab === "alertas" && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
            />
          )}
        </button>
      </div>

      {/* Contenedor de Contenido scrolleable */}
      <div className="p-4 overflow-y-auto h-[calc(100%-95px)] no-scrollbar space-y-3">
        <AnimatePresence mode="wait">
          {/* TAB 1: LLEGADAS EN VIVO */}
          {activeTab === "llegadas" && (
            <motion.div
              key="tab-llegadas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2.5"
            >
              {llegadas.map((llegada, idx) => (
                <div
                  key={`${llegada.lineaId}-${llegada.interno}-${idx}`}
                  className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 rounded-2xl p-3 flex items-center justify-between shadow-sm hover:shadow transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-sm shrink-0"
                      style={{ backgroundColor: llegada.colorHex, color: "#000" }}
                    >
                      {llegada.lineaNumero}
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{llegada.ramal}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span>Coche #{llegada.interno}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Ocupación {llegada.ocupacion}
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
              ))}
            </motion.div>
          )}

          {/* TAB 2: RECORRIDO Y PARADAS */}
          {activeTab === "recorrido" && (
            <motion.div
              key="tab-recorrido"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-1.5"
            >
              {paradasVisibles.map((parada, idx) => {
                const isSelected = selectedParada?.id === parada.id;
                return (
                  <div
                    key={parada.id}
                    onClick={() => onSelectParada(parada)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700"
                        : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {/* Indicador vertical de parada / timeline */}
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <div
                        className={`w-3 h-3 rounded-full border-2 ${
                          isSelected
                            ? "bg-amber-500 border-white ring-2 ring-amber-500"
                            : "bg-slate-400 dark:bg-zinc-600 border-white dark:border-zinc-900"
                        }`}
                      />
                      {idx < paradasVisibles.length - 1 && (
                        <div className="w-0.5 h-7 bg-slate-200 dark:bg-zinc-700 mt-1" />
                      )}
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

                    <button className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                      Ver en mapa
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* TAB 3: ALERTAS DE SERVICIO */}
          {activeTab === "alertas" && (
            <motion.div
              key="tab-alertas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2.5"
            >
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="p-3 rounded-xl border bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px]">
                        LÍNEA {alerta.lineaNumero}
                      </span>
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        {alerta.titulo}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{alerta.fechaHora}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {alerta.descripcion}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
