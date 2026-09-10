"use client";

import { useState } from "react";
import { Search, X, MapPin, Bus, Radio } from "lucide-react";
import { Linea, Parada } from "@/types/transport";

interface FloatingSearchProps {
  lineas: Linea[];
  paradas: Parada[];
  onSelectLinea: (lineaId: string) => void;
  onSelectParada: (parada: Parada) => void;
}

/**
 * Componente modular FloatingSearch (Fase 4).
 * Barra de búsqueda superior flotante estilo Google Maps con autocompletado reactivo
 * para filtrar líneas y paradas sobre los datos mock.
 */
export default function FloatingSearch({
  lineas,
  paradas,
  onSelectLinea,
  onSelectParada,
}: FloatingSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const cleanQuery = query.trim().toLowerCase();

  const filteredLineas = cleanQuery
    ? lineas.filter(
        (l) =>
          l.numero.toLowerCase().includes(cleanQuery) ||
          l.nombre.toLowerCase().includes(cleanQuery) ||
          l.empresa.toLowerCase().includes(cleanQuery)
      )
    : [];

  const filteredParadas = cleanQuery
    ? paradas.filter(
        (p) =>
          p.nombre.toLowerCase().includes(cleanQuery) ||
          p.direccion.toLowerCase().includes(cleanQuery)
      )
    : [];

  const hasResults = cleanQuery.length > 0 && (filteredLineas.length > 0 || filteredParadas.length > 0);

  return (
    <div className="relative w-full">
      {/* Contenedor principal de búsqueda */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 dark:border-zinc-800 p-2.5 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            placeholder="Buscar línea (65, 200...) o parada en AMBA..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline">EN VIVO</span>
          </div>
        </div>

        {/* Desplegable de Resultados de Búsqueda */}
        {isOpen && hasResults && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 max-h-64 overflow-y-auto no-scrollbar space-y-1">
            {filteredLineas.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  <span>Líneas encontradas</span>
                </p>
                {filteredLineas.map((linea) => (
                  <button
                    key={linea.id}
                    onClick={() => {
                      onSelectLinea(linea.id);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 shadow-sm"
                      style={{ backgroundColor: linea.colorHex, color: linea.textColorHex }}
                    >
                      {linea.numero}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {linea.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{linea.empresa}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {filteredParadas.length > 0 && (
              <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Paradas</span>
                </p>
                {filteredParadas.map((parada) => (
                  <button
                    key={parada.id}
                    onClick={() => {
                      onSelectParada(parada);
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {parada.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{parada.direccion}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
