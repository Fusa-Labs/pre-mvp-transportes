"use client";

import { useState, useMemo } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import FloatingSearch from "@/components/ui-shell/FloatingSearch";
import LineSelectorBar from "@/components/ui-shell/LineSelectorBar";
import BottomSheetPanel from "@/components/ui-shell/BottomSheetPanel";
import { TransportService } from "@/lib/services/transport-service";
import { useLiveGPS } from "@/lib/hooks/use-live-gps";
import { Parada, VehiculoEnVivo } from "@/types/transport";
import { Navigation, RotateCcw, Bus } from "lucide-react";

/**
 * Vista Principal de la Maqueta de Transportes AMBA.
 * Ajustes de Performance y Ergonomía Móvil (Fase 5):
 * - 100dvh para evitar saltos de la barra del navegador móvil
 * - Safe areas para notch / Dynamic Island y Home Indicator
 * - Touch targets mínimos de 44px
 * - Aceleración GPU para animaciones a 60fps
 */
export default function TransportesAppPage() {
  const lineas = useMemo(() => TransportService.getLineas(), []);
  const paradas = useMemo(() => TransportService.getParadas(), []);
  const recorridos = useMemo(() => {
    return lineas.flatMap((l) => TransportService.getRecorridosByLinea(l.id));
  }, [lineas]);
  const alertas = useMemo(() => TransportService.getAlertas(), []);

  const [selectedLineaId, setSelectedLineaId] = useState<string | null>(null);
  const [selectedParada, setSelectedParada] = useState<Parada | null>(paradas[0] || null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoEnVivo | null>(null);

  const { vehiculos, totalActivos } = useLiveGPS(selectedLineaId);

  const selectedLinea = useMemo(() => {
    return selectedLineaId ? lineas.find((l) => l.id === selectedLineaId) || null : null;
  }, [selectedLineaId, lineas]);

  const llegadas = useMemo(() => {
    if (!selectedParada) return [];
    return TransportService.getLlegadasPorParada(selectedParada.id);
  }, [selectedParada]);

  const handleSelectParada = (parada: Parada) => {
    setSelectedParada(parada);
  };

  const handleSelectLinea = (lineaId: string | null) => {
    setSelectedLineaId(lineaId);
    setSelectedVehiculo(null);
  };

  const handleSelectVehiculo = (vehiculo: VehiculoEnVivo) => {
    setSelectedVehiculo(vehiculo);
    setSelectedLineaId(vehiculo.lineaId);
  };

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden select-none bg-slate-950 touch-manipulation">
      {/* 1. Header Flotante Superior: Respeta Safe-Area-Top (Notch / Dynamic Island) */}
      <div className="absolute top-[max(14px,env(safe-area-inset-top))] left-4 right-4 z-30 max-w-md mx-auto pointer-events-auto flex flex-col gap-2">
        <FloatingSearch
          lineas={lineas}
          paradas={paradas}
          onSelectLinea={handleSelectLinea}
          onSelectParada={handleSelectParada}
        />

        <LineSelectorBar
          lineas={lineas}
          selectedLineaId={selectedLineaId}
          onSelectLinea={handleSelectLinea}
        />
      </div>

      {/* 2. Canvas de Mapa Vectorial Interactivo (Map Engine 60fps) */}
      <DynamicMap
        recorridos={recorridos}
        lineas={lineas}
        paradas={paradas}
        vehiculos={vehiculos}
        selectedLineaId={selectedLineaId}
        selectedParada={selectedParada}
        onSelectParada={handleSelectParada}
        onSelectVehiculo={handleSelectVehiculo}
      />

      {/* 3. Controles Flotantes en el Mapa con Touch Targets de 44px */}
      <div className="absolute right-4 top-[calc(max(14px,env(safe-area-inset-top))+124px)] z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => {
            setSelectedLineaId(null);
            if (paradas[0]) setSelectedParada(paradas[0]);
          }}
          title="Centrar en AMBA"
          aria-label="Centrar vista en AMBA"
          className="w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white active:scale-90 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            if (paradas[1]) setSelectedParada(paradas[1]);
          }}
          title="Mi Ubicación Simulada"
          aria-label="Ubicar mi posición simulada"
          className="w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-white active:scale-90 transition-all"
        >
          <Navigation className="w-5 h-5 fill-amber-500/20" />
        </button>
      </div>

      {/* 4. Pastilla Informativa de Flota Activa */}
      <div className="absolute left-4 top-[calc(max(14px,env(safe-area-inset-top))+124px)] z-20 pointer-events-none hidden sm:block">
        <div className="bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-2 rounded-full border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs font-semibold">
          <Bus className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{vehiculos.length} unidades activas</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">AMBA Conectado</span>
        </div>
      </div>

      {/* 5. Panel Inferior Deslizable con Safe-Area-Bottom (Home Indicator) */}
      <BottomSheetPanel
        selectedLinea={selectedLinea}
        selectedParada={selectedParada}
        paradas={paradas}
        llegadas={llegadas}
        alertas={alertas}
        totalVehiculosActivos={totalActivos}
        onSelectParada={handleSelectParada}
        onClearSelection={() => {
          setSelectedLineaId(null);
          setSelectedParada(null);
          setSelectedVehiculo(null);
        }}
      />
    </main>
  );
}
