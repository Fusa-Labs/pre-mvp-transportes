"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Linea, Parada, Recorrido, VehiculoEnVivo } from "@/types/transport";

interface DynamicMapProps {
  recorridos: Recorrido[];
  lineas: Linea[];
  paradas: Parada[];
  vehiculos: VehiculoEnVivo[];
  selectedLineaId: string | null;
  selectedParada: Parada | null;
  onSelectParada: (parada: Parada) => void;
  onSelectVehiculo?: (vehiculo: VehiculoEnVivo) => void;
}

const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-950 text-slate-500">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
        <span>Cargando mapa vectorial de AMBA...</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">Conectando con la red satelital de transportes</p>
    </div>
  ),
});

export default function DynamicMap(props: DynamicMapProps) {
  return <MapCanvas {...props} />;
}
