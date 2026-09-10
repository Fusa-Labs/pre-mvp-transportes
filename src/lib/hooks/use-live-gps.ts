"use client";

import { useEffect, useRef, useState } from "react";
import { RECORRIDOS_MOCK, VEHICULOS_INICIALES_MOCK } from "@/lib/mock/amba-data";
import { VehiculoEnVivo } from "@/types/transport";

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function useLiveGPS(activeLineaId?: string | null) {
  const [vehiculos, setVehiculos] = useState<VehiculoEnVivo[]>(VEHICULOS_INICIALES_MOCK);
  const progressMapRef = useRef<Map<string, { segmentIdx: number; stepRatio: number }>>(new Map());

  useEffect(() => {
    // Inicializar índices de progresión para cada vehículo
    VEHICULOS_INICIALES_MOCK.forEach((v) => {
      if (!progressMapRef.current.has(v.id)) {
        progressMapRef.current.set(v.id, {
          segmentIdx: Math.floor(Math.random() * 3),
          stepRatio: Math.random() * 0.7,
        });
      }
    });

    const interval = setInterval(() => {
      setVehiculos((prev) =>
        prev.map((vehiculo) => {
          const recorrido = RECORRIDOS_MOCK.find((r) => r.lineaId === vehiculo.lineaId);
          if (!recorrido || recorrido.coordenadas.length < 2) return vehiculo;

          const progress = progressMapRef.current.get(vehiculo.id) || { segmentIdx: 0, stepRatio: 0 };
          const coords = recorrido.coordenadas;

          // Avanzar un pasito
          let newStepRatio = progress.stepRatio + 0.04;
          let newSegmentIdx = progress.segmentIdx;

          if (newStepRatio >= 1.0) {
            newStepRatio = 0;
            newSegmentIdx += 1;
            if (newSegmentIdx >= coords.length - 1) {
              newSegmentIdx = 0; // Vuelve al inicio del recorrido
            }
          }

          progressMapRef.current.set(vehiculo.id, {
            segmentIdx: newSegmentIdx,
            stepRatio: newStepRatio,
          });

          const p1 = coords[newSegmentIdx];
          const p2 = coords[newSegmentIdx + 1] || coords[0];

          // Interpolación lineal [lng, lat]
          const curLng = p1[0] + (p2[0] - p1[0]) * newStepRatio;
          const curLat = p1[1] + (p2[1] - p1[1]) * newStepRatio;
          const bearing = calculateBearing(p1[1], p1[0], p2[1], p2[0]);

          return {
            ...vehiculo,
            lat: curLat,
            lng: curLng,
            bearing: Math.round(bearing),
            velocidadKmH: Math.floor(20 + Math.random() * 15),
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const vehiculosFiltrados = activeLineaId
    ? vehiculos.filter((v) => v.lineaId === activeLineaId)
    : vehiculos;

  return { vehiculos: vehiculosFiltrados, totalActivos: vehiculos.length };
}
