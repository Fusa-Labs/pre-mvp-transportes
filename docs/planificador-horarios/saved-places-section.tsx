/**
 * SavedPlacesSection — "Tus lugares" del planificador (D3 del plan):
 * listado gestionable de lugares guardados. Tap en la fila = asignar al
 * campo enfocado; menú ⋮ = Editar (SavePlaceSheet) / Cambiar ubicación
 * (picker del mapa) / Eliminar (con Deshacer en el padre).
 *
 * El menú usa un backdrop invisible para cerrar con click fuera — el
 * menú absoluto viejo quedaba abierto para siempre (bug #7 del plan).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { SavedPlace } from '@/lib/planner/types';
import { cn } from '@/lib/utils';

const KIND_ICON: Record<SavedPlace['kind'], string> = {
  home: 'home',
  work: 'work',
  saved: 'bookmark',
};

const KIND_BG: Record<SavedPlace['kind'], string> = {
  home: 'bg-primary-container text-on-primary-container',
  work: 'bg-tertiary-container text-on-tertiary-container',
  saved: 'bg-surface-container-high text-on-surface-variant',
};

export function SavedPlacesSection({
  saved,
  onAssign,
  onEdit,
  onPickLocation,
  onRemove,
}: {
  saved: SavedPlace[];
  onAssign: (place: SavedPlace) => void;
  onEdit: (place: SavedPlace) => void;
  onPickLocation: (place: SavedPlace) => void;
  onRemove: (place: SavedPlace) => void;
}) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Escape cierra el menú abierto
  useEffect(() => {
    if (!menuFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuFor(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuFor]);

  if (saved.length === 0) return null;

  return (
    <div ref={sectionRef} className="relative" data-no-drag>
      <h3 className="pb-1 pt-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        Tus lugares
      </h3>
      {/* SIN overflow-hidden acá: recortaría el menú absolute del ⋮.
          El redondeo de esquinas va por fila (primera/última). */}
      <ul className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        {saved.map((place, index) => {
          // La ÚLTIMA fila abre el menú hacia arriba: hacia abajo se
          // salía del sheet y quedaba cortado (bug reportado en Trabajo)
          const openUp = index === saved.length - 1;
          return (
          <li key={place.id} className={cn('relative', index > 0 && 'border-t border-outline-variant/50')}>
            <div
              className={cn(
                'flex items-stretch overflow-hidden',
                index === 0 && 'rounded-t-2xl',
                index === saved.length - 1 && 'rounded-b-2xl',
              )}
            >
              <button
                onClick={() => onAssign(place)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-container-low active:bg-surface-container"
                aria-label={`Usar ${place.title} en la ruta`}
              >
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', KIND_BG[place.kind])}>
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">
                    {KIND_ICON[place.kind]}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-on-surface">{place.title}</span>
                  <span className="block truncate text-xs text-on-surface-variant">{place.subtitle}</span>
                </span>
              </button>
              <button
                onClick={() => setMenuFor(menuFor === place.id ? null : place.id)}
                aria-expanded={menuFor === place.id}
                aria-label={`Opciones de ${place.title}`}
                className="flex w-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">more_vert</span>
              </button>
            </div>

            {/* Menú contextual */}
            {menuFor === place.id && (
              <>
                {/* Backdrop invisible: click fuera cierra (z bajo el menú) */}
                <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} aria-hidden="true" />
                <div
                  role="menu"
                  aria-label={`Acciones para ${place.title}`}
                  className={cn(
                    'absolute right-2 z-30 w-52 overflow-hidden rounded-xl bg-surface p-1 shadow-lg ring-1 ring-outline-variant',
                    openUp ? 'bottom-11' : 'top-11',
                  )}
                >
                  <button
                    role="menuitem"
                    onClick={() => { setMenuFor(null); onEdit(place); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-on-surface hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">edit</span>
                    Editar
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuFor(null); onPickLocation(place); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-on-surface hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-lg text-on-surface-variant" aria-hidden="true">pin_drop</span>
                    Cambiar ubicación
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuFor(null); onRemove(place); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error hover:bg-error-container/50"
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </li>
          );
        })}
      </ul>
    </div>
  );
}
