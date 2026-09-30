"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, Home, Briefcase, MapPin, BusFront, ArrowRight, History } from "lucide-react";
import { MOCK_STOPS, DATASET } from "@/mock/data";

export interface SearchDestination {
  name: string;
  lat: number;
  lng: number;
}

export interface SearchStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lineIds: string[];
}

interface ExploreSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: SearchDestination) => void;
  onSelectLine: (lineId: string) => void;
  onSelectStop: (stop: SearchStop) => void;
}

// Atajos frecuentes de maqueta (1-tap shortcuts)
const QUICK_SHORTCUTS = [
  {
    id: "home",
    label: "Casa",
    desc: "Barrancas de Belgrano",
    icon: Home,
    coords: { lat: -34.5615, lng: -58.4565 },
  },
  {
    id: "work",
    label: "Trabajo",
    desc: "Plaza Constitución",
    icon: Briefcase,
    coords: { lat: -34.6280, lng: -58.3800 },
  },
  {
    id: "current",
    label: "Origen Demo",
    desc: "Parque Centenario",
    icon: MapPin,
    coords: { lat: -34.6062, lng: -58.4354 },
  },
];

// Nodos y Terminales Clave de la Red Metropol
const METROPOL_HUBS: SearchDestination[] = [
  { name: "Barrancas de Belgrano", lat: -34.5615, lng: -58.4565 },
  { name: "Plaza Constitución", lat: -34.6280, lng: -58.3800 },
  { name: "Centro de Transferencia Zárate", lat: -34.0980, lng: -59.0280 },
  { name: "Estación Escobar", lat: -34.3480, lng: -58.7950 },
  { name: "Plaza Once", lat: -34.6100, lng: -58.4060 },
  { name: "Plaza Italia", lat: -34.5810, lng: -58.4210 },
];

export default function ExploreSearchSheet({
  isOpen,
  onClose,
  onSelectDestination,
  onSelectLine,
  onSelectStop,
}: ExploreSearchSheetProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus al abrir
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleSelectDest = (dest: SearchDestination) => {
    setQuery("");
    onSelectDestination(dest);
  };

  const handleSelectL = (lineId: string) => {
    setQuery("");
    onSelectLine(lineId);
  };

  const handleSelectS = (stop: SearchStop) => {
    setQuery("");
    onSelectStop(stop);
  };

  // Filtrado reactivo en memoria (etapa de maqueta)
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { lines: [], stops: [], destinations: [] };
    }

    // 1. Filtrar Líneas (65, 194)
    const lines = DATASET.lineas.filter(
      (l) =>
        l.numero.includes(trimmed) ||
        l.nombre.toLowerCase().includes(trimmed) ||
        `linea ${l.numero}`.includes(trimmed)
    );

    // 2. Filtrar Destinos y Nodos
    const destinations = METROPOL_HUBS.filter((h) =>
      h.name.toLowerCase().includes(trimmed)
    );

    // 3. Filtrar Paradas de la Red
    const stops: SearchStop[] = MOCK_STOPS.filter((s) =>
      s.name.toLowerCase().includes(trimmed)
    )
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        lineIds: s.lineIds,
      }));

    return { lines, stops, destinations };
  }, [query]);

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults =
    searchResults.lines.length > 0 ||
    searchResults.stops.length > 0 ||
    searchResults.destinations.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-start items-center p-4 pt-12 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-canvas dark:bg-canvas border border-hairline rounded-[28px] shadow-[0_20px_50px_-4px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-200 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Cabecera con Buscador Activo ─────────────────────────── */}
        <div className="p-3 border-b border-hairline flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-canvas-soft border border-hairline rounded-full px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-sky-500/30 transition-all">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscá líneas, paradas o destinos..."
              className="w-full bg-transparent text-xs font-semibold text-ink placeholder:text-text-muted focus:outline-hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="w-4 h-4 rounded-full bg-hairline flex items-center justify-center text-text-muted hover:text-ink shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted hover:text-ink active:scale-95 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Contenido del Buscador ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* MODO 1: Sin texto tipeado → Accesos rápidos y destinos clave */}
          {!hasQuery && (
            <>
              {/* Fila de Atajos Rápidos de 1 Tap */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  Atajos Frecuentes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_SHORTCUTS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleSelectDest({
                            name: item.desc,
                            lat: item.coords.lat,
                            lng: item.coords.lng,
                          })
                        }
                        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-canvas-soft hover:bg-field border border-hairline transition-all active:scale-95 group text-center"
                      >
                        <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black text-ink leading-none mb-0.5">
                          {item.label}
                        </span>
                        <span className="text-[9px] text-text-muted truncate w-full">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Terminales y Nodos de la Red Metropol */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  Terminales y Puntos Clave
                </p>
                <div className="space-y-1">
                  {METROPOL_HUBS.map((hub) => (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => handleSelectDest(hub)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-canvas-soft transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted group-hover:text-ink shrink-0">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-ink block leading-tight truncate">
                            {hub.name}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            Cabecera / Conexión de Red
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Historial Reciente de Maqueta */}
              <div className="border-t border-hairline pt-3">
                <div className="flex items-center gap-1.5 text-text-muted mb-2">
                  <History className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Reciente en esta maqueta
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleSelectDest({
                      name: "Barrancas de Belgrano",
                      lat: -34.5615,
                      lng: -58.4565,
                    })
                  }
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-canvas-soft hover:bg-field border border-hairline transition-colors text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs font-semibold text-ink truncate">
                      Parque Centenario ➔ Barrancas de Belgrano
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-600 shrink-0">
                    Línea 65
                  </span>
                </button>
              </div>
            </>
          )}

          {/* MODO 2: Con texto tipeado → Resultados en Vivo */}
          {hasQuery && (
            <div className="space-y-4">
              {!hasResults && (
                <div className="text-center py-6">
                  <p className="text-xs font-bold text-ink mb-1">
                    No encontramos resultados para &quot;{query}&quot;
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Probá buscando &quot;65&quot;, &quot;194&quot;, &quot;Barrancas&quot; o &quot;Zárate&quot;.
                  </p>
                </div>
              )}

              {/* Coincidencias de Líneas */}
              {searchResults.lines.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Líneas de Colectivo
                  </p>
                  <div className="space-y-1.5">
                    {searchResults.lines.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => handleSelectL(l.id)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-canvas-soft hover:bg-field border border-hairline transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: l.color }}
                          >
                            {l.numero}
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-bold text-ink block leading-tight">
                              Línea {l.numero}
                            </span>
                            <span className="text-[10px] text-text-muted truncate block">
                              {l.nombre}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-full shrink-0">
                          Ver Recorrido
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coincidencias de Destinos y Terminales */}
              {searchResults.destinations.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Destinos y Lugares
                  </p>
                  <div className="space-y-1">
                    {searchResults.destinations.map((dest) => (
                      <button
                        key={dest.name}
                        type="button"
                        onClick={() => handleSelectDest(dest)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-canvas-soft transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted group-hover:text-ink shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-ink truncate">
                            {dest.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-sky-600 shrink-0">
                          Viajar aquí
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Coincidencias de Paradas */}
              {searchResults.stops.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
                    Paradas de la Red
                  </p>
                  <div className="space-y-1">
                    {searchResults.stops.map((stop) => (
                      <button
                        key={stop.id}
                        type="button"
                        onClick={() => handleSelectS(stop)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-canvas-soft transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-text-muted group-hover:text-ink shrink-0">
                            <BusFront className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-ink block leading-tight truncate">
                              {stop.name}
                            </span>
                            <span className="text-[10px] text-text-muted">
                              Líneas: {stop.lineIds.map((l) => l.replace("line-", "")).join(", ")}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted group-hover:text-ink shrink-0">
                          Ver en mapa
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
