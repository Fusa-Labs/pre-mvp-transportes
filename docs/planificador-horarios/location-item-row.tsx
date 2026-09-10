/**
 * LocationItemRow — fila de sugerencia del planificador (spec Uber
 * adaptado a tokens MD3): icono en círculo neutral, título bold y fila
 * secundaria con distancia (km) + dirección. Acción secundaria opcional
 * de guardado (bookmark → abre el SavePlaceSheet del padre; el selector
 * de identidad Casa/Trabajo/Favorito vive ahí, no en un menú inline).
 *
 * Fila de DOS botones (contenido + guardar): no se pueden anidar
 * <button> en <button> (hidratación rota, a11y inválida).
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LocationItem } from '@/lib/planner/types';

const TYPE_ICON: Record<string, string> = {
  recent: 'history',
  saved: 'bookmark',
  home: 'home',
  work: 'work',
  search_result: 'search',
  map_picker: 'pin_drop',
  stop: 'directions_bus',
  poi: 'place',
};

const TYPE_LABEL: Record<string, string> = {
  home: 'Casa',
  work: 'Trabajo',
  saved: 'Guardado',
};

export function LocationItemRow({
  item,
  selected = false,
  onSelect,
  onSave,
  showSave = false,
  showMenu = false,
  onDismiss,
}: {
  item: LocationItem;
  selected?: boolean;
  onSelect: (item: LocationItem) => void;
  onSave?: (item: LocationItem) => void;
  showSave?: boolean;
  /** Menú ⋮ con Eliminar (confirmación en el padre). */
  showMenu?: boolean;
  onDismiss?: (item: LocationItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const kindLabel = TYPE_LABEL[item.type];

  // Escape cierra el menú abierto
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <li className="relative flex items-stretch">
      <button
        onClick={() => onSelect(item)}
        aria-pressed={selected}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 rounded-l-xl px-2 py-3 text-left transition-colors',
          'active:bg-surface-container hover:bg-surface-container-low',
          selected && 'bg-surface-container-low',
        )}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            {TYPE_ICON[item.type] ?? 'place'}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-on-surface">
            {item.title}
            {kindLabel && (
              <span className="ml-2 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                {kindLabel}
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-on-surface-variant">
            {item.distanceKm != null && (
              <span className="shrink-0 font-mono tabular-nums">{item.distanceKm.toFixed(1)} km</span>
            )}
            <span className="truncate">{item.subtitle}</span>
          </span>
        </span>
        <span className="material-symbols-outlined shrink-0 text-lg text-on-surface-variant" aria-hidden="true">
          {selected ? 'check' : 'chevron_right'}
        </span>
      </button>
      {showSave && (
        <button
          onClick={() => onSave?.(item)}
          aria-label={`Guardar ${item.title} como lugar`}
          className={cn(
            'flex w-11 shrink-0 items-center justify-center px-2 transition-colors hover:bg-surface-container-low active:scale-95',
            kindLabel ? 'text-primary' : 'text-on-surface-variant',
          )}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={kindLabel ? { fontVariationSettings: "'FILL' 1" } : {}}
            aria-hidden="true"
          >
            {kindLabel ? 'bookmark' : 'bookmark_add'}
          </span>
        </button>
      )}
      {showMenu && (
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={`Opciones de ${item.title}`}
          className="flex w-11 shrink-0 items-center justify-center rounded-r-xl px-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">more_vert</span>
        </button>
      )}
      {showMenu && menuOpen && (
        <>
          {/* Backdrop: click fuera cierra (z bajo el menú) */}
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            aria-label={`Acciones para ${item.title}`}
            className="absolute right-2 top-12 z-30 w-48 overflow-hidden rounded-xl bg-surface p-1 shadow-lg ring-1 ring-outline-variant"
          >
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDismiss?.(item);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#DC2626] hover:bg-[#DC2626]/10"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
              Eliminar
            </button>
          </div>
        </>
      )}
    </li>
  );
}
