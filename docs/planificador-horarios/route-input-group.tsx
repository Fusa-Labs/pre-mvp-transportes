/**
 * RouteInputGroup — bloque de ruta del planificador (spec Uber):
 * contenedor redondeado con visualizador vertical (círculo hueco =
 * origen, línea conectora, cuadrado sólido = destino), inputs sin
 * borde, botón X por campo, botón de intercambiar y botón flotante "+"
 * para paradas intermedias.
 */

'use client';

import { cn } from '@/lib/utils';
import type { LocationItem } from '@/lib/planner/types';

/**
 * Campos del planner. 'place-edit' es un canal interno: el picker del
 * mapa re-ubica un lugar guardado del CRUD (no asigna ningún campo).
 */
export type PlannerField =
  | 'origin'
  | 'destination'
  | `waypoint-${number}`
  | 'place-edit';

export const FIELD_PLACEHOLDER: Record<'origin' | 'destination', string> = {
  origin: 'Desde dónde salís',
  destination: 'A dónde vas',
};

function FieldValue({ item, placeholder }: { item: LocationItem | null; placeholder: string }) {
  return (
    <span
      className={cn(
        'min-w-0 flex-1 truncate text-sm font-medium',
        item ? 'text-on-surface' : 'text-on-surface-variant',
      )}
    >
      {item?.title ?? placeholder}
    </span>
  );
}

function RowButton({
  item,
  active,
  icon,
  editing,
  query,
  onQueryChange,
  removable = false,
  onFocus,
  onClear,
  onMapPick,
  ariaLabel,
}: {
  item: LocationItem | null;
  active: boolean;
  icon: string;
  /** Campo enfocado → la fila se vuelve input de búsqueda (patrón Uber). */
  editing?: boolean;
  query?: string;
  onQueryChange?: (value: string) => void;
  /** Paradas intermedias: X de borrado rápido también en fila vacía. */
  removable?: boolean;
  onFocus: () => void;
  onClear: () => void;
  onMapPick: () => void;
  ariaLabel: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-11 items-center gap-2 rounded-xl px-2.5 transition-colors',
        active ? 'bg-surface-container-high ring-1 ring-primary/25' : 'hover:bg-surface-container-low',
      )}
    >
      {editing ? (
        <input
          value={query ?? ''}
          onChange={(event) => onQueryChange?.(event.target.value)}
          placeholder={ariaLabel}
          aria-label={ariaLabel}
          autoFocus
          data-no-drag
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      ) : (
        <button
          onClick={onFocus}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={ariaLabel}
        >
          <span
            className={cn(
              'material-symbols-outlined shrink-0 text-lg',
              active ? 'text-primary' : 'text-on-surface-variant',
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
          <FieldValue item={item} placeholder={ariaLabel} />
        </button>
      )}
      {item ? (
        <button
          onClick={onClear}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`Quitar ${ariaLabel}`}
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      ) : (
        <>
          <button
            onClick={onMapPick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={`${ariaLabel} en el mapa`}
            title="Elegir en el mapa"
          >
            <span className="material-symbols-outlined text-base">pin_drop</span>
          </button>
          {removable && (
            <button
              onClick={onClear}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`Eliminar ${ariaLabel}`}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function RouteInputGroup({
  origin,
  destination,
  waypoints,
  focused,
  query,
  onQueryChange,
  onFieldFocus,
  onFieldClear,
  onFieldMapPick,
  onSwap,
  onAddWaypoint,
  onRemoveWaypoint,
}: {
  origin: LocationItem | null;
  destination: LocationItem | null;
  waypoints: LocationItem[];
  focused: PlannerField | null;
  /** Texto del campo enfocado (filtra resultados en el planner). */
  query: string;
  onQueryChange: (value: string) => void;
  onFieldFocus: (field: PlannerField) => void;
  onFieldClear: (field: PlannerField) => void;
  onFieldMapPick: (field: PlannerField) => void;
  onSwap: () => void;
  onAddWaypoint: () => void;
  onRemoveWaypoint: (index: number) => void;
}) {
  return (
    <div className="relative" data-no-drag>
      <div className="rounded-2xl border border-outline bg-surface-container-lowest p-1.5 shadow-sm">
        <RowButton
          item={origin}
          active={focused === 'origin'}
          editing={focused === 'origin'}
          query={query}
          onQueryChange={onQueryChange}
          icon="radio_button_unchecked"
          onFocus={() => onFieldFocus('origin')}
          onClear={() => onFieldClear('origin')}
          onMapPick={() => onFieldMapPick('origin')}
          ariaLabel="Desde dónde salís"
        />
        {/* Conector + swap: el corazón visual del spec Uber */}
        <div className="flex items-stretch">
          <div className="flex w-10 shrink-0 items-center justify-center">
            <span className="h-6 w-0.5 rounded-full bg-outline" aria-hidden="true" />
          </div>
          <button
            onClick={onSwap}
            className="my-1 flex flex-1 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Intercambiar origen y destino"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">swap_vert</span>
            Intercambiar
          </button>
        </div>
        <RowButton
          item={destination}
          active={focused === 'destination'}
          editing={focused === 'destination'}
          query={query}
          onQueryChange={onQueryChange}
          icon="stop_square"
          onFocus={() => onFieldFocus('destination')}
          onClear={() => onFieldClear('destination')}
          onMapPick={() => onFieldMapPick('destination')}
          ariaLabel="A dónde vas"
        />
        {waypoints.map((waypoint, index) => (
          <RowButton
            key={`wp-${index}`}
            item={waypoint}
            active={focused === (`waypoint-${index}` as PlannerField)}
            editing={focused === (`waypoint-${index}` as PlannerField)}
            query={query}
            onQueryChange={onQueryChange}
            removable
            icon="add_location"
            onFocus={() => onFieldFocus(`waypoint-${index}` as PlannerField)}
            onClear={() => onRemoveWaypoint(index)}
            onMapPick={() => onFieldMapPick(`waypoint-${index}` as PlannerField)}
            ariaLabel={`Parada intermedia ${index + 1}`}
          />
        ))}
      </div>
      {waypoints.length < 2 && (
        <button
          onClick={onAddWaypoint}
          className="absolute -right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-on-surface-variant shadow-lg ring-1 ring-outline-variant transition-transform hover:bg-surface-container-low active:scale-90"
          aria-label="Añadir parada intermedia"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      )}
    </div>
  );
}
