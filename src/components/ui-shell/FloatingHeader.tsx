"use client";

import { useState } from "react";
import { Search, Radio, X, MapPin, Bus } from "lucide-react";
import { Linea, Parada } from "@/types/transport";

interface FloatingHeaderProps {
  lineas: Linea[];
  paradas: Parada[];
  selectedLineaId: string | null;
  onSelectLinea: (lineaId: string | null) => void;
  onSelectParada: (parada: Parada) => void;
}

export default function FloatingHeader({
  lineas,
  paradas,
  selectedLineaId,
  onSelectLinea,
  onSelectParada,
}: FloatingHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredLineas = searchTerm.trim()
    ? lineas.filter(
        (l) =>
          l.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredParadas = searchTerm.trim()
    ? paradas.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.direccion.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const hasResults = searchTerm.trim().length > 0 && (filteredLineas.length > 0 || filteredParadas.length > 0);

  return (
    <div className="absolute top-4 left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto">
      {/* Barra de Búsqueda Flotante */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-zinc-800 p-2.5 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            placeholder="Buscar línea (65, 194...) o parada en AMBA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setIsFocused(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>EN VIVO</span>
          </div>
        </div>

        {/* Desplegable de Resultados de Búsqueda */}
        {isFocused && hasResults && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 max-h-64 overflow-y-auto no-scrollbar space-y-1">
            {filteredLineas.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Líneas</p>
                {filteredLineas.map((linea) => (
                  <button
                    key={linea.id}
                    onClick={() => {
                      onSelectLinea(linea.id);
                      setSearchTerm("");
                      setIsFocused(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                      style={{ backgroundColor: linea.colorHex, color: linea.textColorHex }}
                    >
                      {linea.numero}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{linea.nombre}</p>
                      <p className="text-[11px] text-slate-500 truncate">{linea.empresa}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredParadas.length > 0 && (
              <div className="mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Paradas</p>
                {filteredParadas.map((parada) => (
                  <button
                    key={parada.id}
                    onClick={() => {
                      onSelectParada(parada);
                      setSearchTerm("");
                      setIsFocused(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{parada.nombre}</p>
                      <p className="text-[11px] text-slate-500 truncate">{parada.direccion}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chips de Selector Rápido de Líneas */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => onSelectLinea(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
            selectedLineaId === null
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 scale-105"
              : "bg-white/90 dark:bg-zinc-900/90 text-slate-700 dark:text-slate-300 hover:bg-white"
          }`}
        >
          <Radio className="w-3 h-3" />
          <span>Todas</span>
        </button>

        {lineas.map((linea) => {
          const isSelected = selectedLineaId === linea.id;
          return (
            <button
              key={linea.id}
              onClick={() => onSelectLinea(isSelected ? null : linea.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105"
                  : "opacity-90 hover:opacity-100"
              }`}
              style={{
                backgroundColor: linea.colorHex,
                color: linea.textColorHex,
              }}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Línea {linea.numero}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
