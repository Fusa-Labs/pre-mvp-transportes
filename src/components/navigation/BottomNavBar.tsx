"use client";

import React from "react";
import { Bus, MapPin, User, Home } from "lucide-react";
import { BottomNavBarProps, NavigationTab } from "@/types/home-navigation";

/**
 * Emblema vectorial estilizado de la Rosa (Identidad Metropol / Transportes).
 * Geometría orgánica precisa con capullo concéntrico y pétalos envolventes.
 */
function RoseEmblem({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Capullo central estilizado */}
      <path d="M12 7.5c-1.2-1.2-3.2-.4-3.2 1.4 0 1.6 2 2.8 3.2 3.8 1.2-1 3.2-2.2 3.2-3.8 0-1.8-2-2.6-3.2-1.4z" />
      {/* Pétalo envolvente izquierdo */}
      <path d="M8.2 9.2C6.8 10.4 6 12 6.5 13.8c.8 2.2 3.2 3.4 5.5 3.4" />
      {/* Pétalo envolvente derecho */}
      <path d="M15.8 9.2c1.4 1.2 2.2 2.8 1.7 4.6-.8 2.2-3.2 3.4-5.5 3.4" />
      {/* Cáliz / base inferior */}
      <path d="M12 17.2v3.8" />
      <path d="M10 19.5c-1.5.3-2.5 0-3.2-.6" />
      <path d="M14 19.5c1.5.3 2.5 0 3.2-.6" />
    </svg>
  );
}

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LEFT_ITEMS: NavItemConfig[] = [
  { id: "lineas", label: "Líneas", icon: Bus },
  { id: "paradas", label: "Tus Paradas", icon: MapPin },
];

const RIGHT_ITEMS: NavItemConfig[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "home", label: "Inicio", icon: Home },
];

export default function BottomNavBar({
  activeTab,
  onTabChange,
  isLineMenuOpen = false,
  onToggleLineMenu,
  isTripMode = false,
  onToggleTripMode,
}: BottomNavBarProps) {
  const isMapActive = activeTab === "mapa";

  const handleCenterAction = () => {
    if (onToggleTripMode) {
      onToggleTripMode();
    } else {
      onTabChange("mapa");
    }
  };

  return (
    <nav
      aria-label="Navegación principal inferior"
      className="fixed bottom-4 inset-x-0 z-50 pointer-events-none flex justify-center px-4 pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="pointer-events-auto w-full max-w-[410px] bg-canvas/92 dark:bg-canvas/92 backdrop-blur-xl border border-hairline rounded-full shadow-[0_10px_32px_-4px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_36px_-4px_rgba(0,0,0,0.6)] px-2.5 py-1.5 grid grid-cols-5 items-center relative">
        
        {/* Slot 1 & 2: Líneas y Tus Paradas (Lado Izquierdo) */}
        {LEFT_ITEMS.map((item) => {
          const isItemActive = item.id === "lineas" ? (isMapActive && isLineMenuOpen) : activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "lineas") {
                  if (onToggleLineMenu) {
                    onToggleLineMenu();
                  } else {
                    onTabChange("lineas");
                  }
                } else {
                  onTabChange(item.id);
                }
              }}
              title={item.id === "lineas" ? "Ver información y recorrido de líneas" : item.label}
              aria-label={item.label}
              className={`group flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 touch-manipulation active:scale-95 relative ${
                isItemActive ? "text-ink font-semibold" : "text-text-muted hover:text-ink font-medium"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 relative ${
                  isItemActive
                    ? "bg-canvas-soft text-ink scale-105 shadow-xs ring-1 ring-hairline"
                    : "text-text-muted group-hover:text-ink group-hover:bg-canvas-soft/60"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isItemActive ? "scale-105" : ""}`} />
                {item.id === "lineas" && isLineMenuOpen && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 select-none leading-none">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Slot 3: CENTRO EXACTO (Columna 3 de 5 = 50% Horizontal) -> La Rosa / Mapa y Modo Viaje */}
        <div className="flex flex-col items-center justify-center relative">
          <button
            type="button"
            onClick={handleCenterAction}
            title={isTripMode ? "Modo Viaje activo (tocar para alternar)" : "Tocar para iniciar Viaje en el mapa"}
            aria-label={isTripMode ? "Cerrar o alternar modo Viaje" : "Iniciar modo Viaje en el mapa"}
            className={`-mt-7 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl touch-manipulation active:scale-90 group relative ${
              isTripMode
                ? "bg-electric-blue text-white ring-4 ring-canvas scale-105 shadow-2xl"
                : isMapActive
                ? "bg-ink text-canvas ring-4 ring-canvas scale-105 shadow-2xl"
                : "bg-ink text-canvas ring-4 ring-canvas hover:scale-105"
            }`}
          >
            {/* Halo sutil de relieve */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            
            <RoseEmblem
              className={`w-7 h-7 transition-transform duration-300 ${
                isTripMode ? "text-white scale-110" : "text-canvas group-hover:scale-110"
              }`}
            />

            {/* Indicador pulsante en modo Viaje */}
            {isTripMode && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-electric-blue animate-ping" />
            )}
          </button>
          <span
            className={`text-[10px] mt-0.5 tracking-tight font-bold transition-colors select-none leading-none ${
              isTripMode ? "text-electric-blue" : isMapActive ? "text-ink" : "text-text-muted"
            }`}
          >
            {isTripMode ? "Viaje" : "Mapa"}
          </span>
        </div>

        {/* Slot 4 & 5: Perfil e Inicio (Lado Derecho) */}
        {RIGHT_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              title={item.label}
              aria-label={item.label}
              className={`group flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 touch-manipulation active:scale-95 ${
                isActive ? "text-ink font-semibold" : "text-text-muted hover:text-ink font-medium"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-canvas-soft text-ink scale-105 shadow-xs"
                    : "text-text-muted group-hover:text-ink group-hover:bg-canvas-soft/60"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-105" : ""}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 select-none leading-none">
                {item.label}
              </span>
            </button>
          );
        })}

      </div>
    </nav>
  );
}
