"use client";

import { useState, useMemo } from "react";
import DynamicMap from "@/components/map/DynamicMap";
import FloatingHeader from "@/components/ui-shell/FloatingHeader";
import BottomSheetDrawer from "@/components/ui-shell/BottomSheetDrawer";
import { TransportService } from "@/lib/services/transport-service";
import { useLiveGPS } from "@/lib/hooks/use-live-gps";
import { Parada, VehiculoEnVivo } from "@/types/transport";
import { Navigation, RotateCcw, Bus } from "lucide-react";

export default function TransportesAppPage() {
  const lineas = useMemo(() => TransportService.getLineas(), []);
  const paradas = useMemo(() => TransportService.getParadas(), []);
  const recorridos = useMemo(() => {
    return lineas.flatMap((l) => TransportService.getRecorridosByLinea(l.id));
  }, [lineas]);
  const alertas = useMemo(() => TransportService.getAlertas(), []);

  const [selectedLineaId, setSelectedLineaId] = useState<string | null>(null);
  const [selectedParada, setSelectedParada] = useState<Parada | null>(paradas[6] || paradas[0]); // Default Plaza Miserere (Once)
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

  const handleSelectVehiculo = (vehiculo: VehiculoEnVivo) => {
    setSelectedVehiculo(vehiculo);
    setSelectedLineaId(vehiculo.lineaId);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden select-none">
      {/* 1. Barra de Búsqueda y Filtros Flotantes */}
      <FloatingHeader
        lineas={lineas}
        paradas={paradas}
        selectedLineaId={selectedLineaId}
        onSelectLinea={(id) => {
          setSelectedLineaId(id);
          setSelectedVehiculo(null);
        }}
        onSelectParada={handleSelectParada}
      />

      {/* 2. Canvas de Mapa Vectorial Interactivo */}
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

      {/* 3. Controles Rápidos Flotantes en el Mapa (Costado Derecho) */}
      <div className="absolute right-4 top-44 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => {
            setSelectedLineaId(null);
            setSelectedParada(paradas[6]); // Once
          }}
          title="Centrar en AMBA"
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (paradas[0]) setSelectedParada(paradas[0]); // Barrancas
          }}
          title="Mi Ubicación Simulada"
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-white active:scale-95 transition-all"
        >
          <Navigation className="w-4 h-4 fill-amber-500/20" />
        </button>
      </div>

      {/* 4. Pastilla de Estado de Flota Activa */}
      <div className="absolute left-4 top-28 z-20 pointer-events-none hidden sm:block">
        <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-slate-700/80 shadow-lg flex items-center gap-2 text-xs font-semibold">
          <Bus className="w-3.5 h-3.5 text-amber-400" />
          <span>{vehiculos.length} coches en vivo</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400">AMBA Conectado</span>
        </div>
      </div>

      {/* 5. Panel Inferior Deslizable (Bottom Sheet Drawer) */}
      <BottomSheetDrawer
        selectedLinea={selectedLinea}
        selectedParada={selectedParada}
        paradas={paradas}
        llegadas={llegadas}
        alertas={alertas}
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
