/**
 * AssistantBar — buscador de destinos indexados del Home.
 * Elegir una sugerencia abre inmediatamente el flujo de viaje.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Info, Search, X } from 'lucide-react';
import { TripPlannerService } from '@/lib/services/trip-planner-service';
import type { LocationPoint } from '@/types/trip-planner';
import { cn } from '@/lib/utils';

interface AssistantBarProps {
  /** Destino indexado que el usuario eligió. */
  onSubmit: (destination: LocationPoint) => void;
  className?: string;
}

const SUGGESTIONS_ID = 'home-destination-suggestions';

export function AssistantBar({ onSubmit: _onSubmit, className }: AssistantBarProps) {
  const [showNotice, setShowNotice] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerNotice = () => {
    setShowNotice(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShowNotice(false);
    }, 4500);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          onClick={triggerNotice}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerNotice();
            }
          }}
          className={cn(
            'group flex items-center gap-2 rounded-full bg-field border border-transparent pl-4 pr-1.5 transition-all cursor-pointer select-none',
            'hover:bg-canvas-soft active:scale-[0.99] focus-within:ring-2 focus-within:ring-ink/20',
          )}
          title="Tocar para buscar parada"
        >
          <input
            type="text"
            readOnly
            tabIndex={-1}
            value=""
            placeholder="Buscá tu parada"
            aria-label="Buscá tu parada"
            className="flex-1 min-w-0 bg-transparent min-h-[46px] text-sm text-ink placeholder:text-text-faint focus:outline-none cursor-pointer"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerNotice();
            }}
            aria-label="Buscar parada"
            className="w-8 h-8 shrink-0 rounded-full bg-ink text-canvas flex items-center justify-center active:scale-95 transition-all"
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Aviso flotante de alcance de maqueta */}
        {showNotice && (
          <div
            role="status"
            aria-live="polite"
            className="absolute z-30 left-0 right-0 top-[calc(100%+0.5rem)] rounded-2xl border border-hairline bg-canvas/95 backdrop-blur-md p-3.5 shadow-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink leading-snug">
                Búsqueda completa de direcciones disponible en el lanzamiento final
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                Para probar esta maqueta interactiva, seleccioná uno de los recorridos simulados en el <span className="font-semibold text-ink">Historial de paradas</span> debajo.
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNotice(false);
              }}
              aria-label="Cerrar aviso"
              className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-ink hover:bg-canvas-soft transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
