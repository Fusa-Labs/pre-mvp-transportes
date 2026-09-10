/**
 * QuickActionsBar — pills scrollables del planificador (spec Uber):
 * Casa, Añadir trabajo y Ubicaciones guardadas. Casa/Trabajo asignan el
 * destino si existe; si no, abren el flujo de guardado vía banner.
 */

'use client';

import type { SavedPlace } from '@/lib/planner/types';

export type QuickActionKind = 'home' | 'work' | 'saved';

export function QuickActionsBar({
  saved,
  onQuickAction,
}: {
  saved: SavedPlace[];
  onQuickAction: (kind: QuickActionKind) => void;
}) {
  // El pill muestra el título REAL del lugar (refleja renombres del CRUD)
  const homePlace = saved.find((p) => p.kind === 'home');
  const workPlace = saved.find((p) => p.kind === 'work');

  const pills: Array<{ kind: QuickActionKind; label: string; icon: string }> = [
    { kind: 'home', label: homePlace?.title ?? 'Añadir Casa', icon: 'home' },
    { kind: 'work', label: workPlace?.title ?? 'Añadir trabajo', icon: 'work' },
    { kind: 'saved', label: 'Guardados', icon: 'bookmark' },
  ];

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto py-2" data-no-drag>
      {pills.map((pill) => (
        <button
          key={pill.kind}
          onClick={() => onQuickAction(pill.kind)}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant transition-all hover:bg-surface-container-low active:scale-95"
          aria-label={pill.label}
        >
          <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">
            {pill.icon}
          </span>
          {pill.label}
        </button>
      ))}
    </div>
  );
}
