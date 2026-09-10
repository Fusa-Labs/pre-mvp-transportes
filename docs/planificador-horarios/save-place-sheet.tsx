/**
 * SavePlaceSheet — diálogo unificado de crear/editar lugar (D2 del plan):
 * preview del lugar + selector de identidad (solo al crear) + nombre
 * editable + chip de reemplazo cuando Casa/Trabajo ya existe.
 *
 * Usado por el bookmark_add de las filas de resultados (crear) y por el
 * menú ⋮ de "Tus lugares" (editar). Diálogo centrado — NO BottomSheet:
 * vive sobre el planner que ya es un sheet (sheets anidados = gestos
 * peleados) y el transform de motion rompe position:fixed dentro.
 *
 * El form se reinicia por cambio de request con el patrón oficial de
 * React (ajustar estado DURANTE render con guard de identidad), no en
 * un effect (setState en effect = cascada de renders).
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { LocationItem, SavedKind, SavedPlace } from '@/lib/planner/types';

const KIND_OPTIONS: Array<{ kind: SavedKind; label: string; icon: string }> = [
  { kind: 'home', label: 'Casa', icon: 'home' },
  { kind: 'work', label: 'Trabajo', icon: 'work' },
  { kind: 'saved', label: 'Favorito', icon: 'bookmark' },
];

const KIND_ICON: Record<SavedKind, string> = {
  home: 'home',
  work: 'work',
  saved: 'bookmark',
};

const DEFAULT_TITLE: Record<SavedKind, string> = {
  home: 'Casa',
  work: 'Trabajo',
  saved: '',
};

export interface SavePlaceRequest {
  /** 'create' guarda un LocationItem nuevo; 'edit' actualiza un SavedPlace. */
  mode: 'create' | 'edit';
  /** Solo create: el lugar que se va a guardar. */
  item?: LocationItem;
  /** Solo edit: el lugar guardado que se edita. */
  place?: SavedPlace;
  /** Kind inicial (create) — ej. el hint de QuickActionsBar. */
  kind?: SavedKind;
}

interface FormState {
  kind: SavedKind;
  title: string;
}

function initialForm(request: SavePlaceRequest | null): FormState {
  if (!request) return { kind: 'saved', title: '' };
  if (request.mode === 'edit') {
    return { kind: request.place!.kind, title: request.place!.title };
  }
  const kind = request.kind ?? 'saved';
  return {
    kind,
    title: kind === 'saved' ? (request.item?.title ?? '') : DEFAULT_TITLE[kind],
  };
}

export function SavePlaceSheet({
  request,
  /** Solo create: kinds que ya están guardados (para el chip de reemplazo). */
  existingKinds,
  onClose,
  onCreate,
  onEdit,
  onPickLocation,
}: {
  request: SavePlaceRequest | null;
  existingKinds: SavedKind[];
  onClose: () => void;
  onCreate: (kind: SavedKind, item: LocationItem, title: string) => void;
  onEdit: (place: SavedPlace, patch: { title?: string }) => void;
  onPickLocation?: (place: SavedPlace) => void;
}) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset del form por cambio de request — patrón React "adjusting state
  // when a prop changes": comparación durante el render, sin effect
  const [form, setForm] = useState<FormState>(() => initialForm(request));
  const [renderedRequest, setRenderedRequest] = useState<SavePlaceRequest | null>(request);
  if (request !== renderedRequest) {
    setRenderedRequest(request);
    setForm(initialForm(request));
  }

  // Escape cierra (diálogo accesible)
  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, onClose]);

  // Foco al input al abrir (manipulación de DOM, no setState)
  useEffect(() => {
    if (!request) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [request]);

  if (!request) return null;

  const editing = request.mode === 'edit';
  const place = request.place ?? null;
  const item = request.item ?? null;
  const kind = form.kind;
  const title = form.title;
  const previewTitle = editing ? place!.title : item?.title ?? 'Ubicación en el mapa';
  const previewSubtitle = editing ? place!.subtitle : item?.subtitle ?? '—';
  const replaces =
    !editing && (kind === 'home' || kind === 'work') && existingKinds.includes(kind);
  const canSubmit = title.trim().length > 0;

  const setKind = (next: SavedKind) => {
    setForm((prev) => {
      const wasDefaultOrKindLabel =
        !prev.title.trim() || KIND_OPTIONS.some((o) => o.label === prev.title.trim());
      return {
        kind: next,
        title: wasDefaultOrKindLabel
          ? next === 'saved'
            ? (item?.title ?? '')
            : DEFAULT_TITLE[next]
          : prev.title,
      };
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    if (editing && place) {
      onEdit(place, { title: title.trim() });
    } else if (item) {
      onCreate(kind, item, title.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Diálogo */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Editar lugar' : 'Guardar lugar'}
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.35, bounce: 0.12 }}
        className="relative w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">
            {editing ? 'Editar lugar' : 'Guardar lugar'}
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Preview del lugar */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              {editing ? KIND_ICON[place!.kind] : KIND_ICON[kind]}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-on-surface">{previewTitle}</p>
            <p className="truncate text-xs text-on-surface-variant">{previewSubtitle}</p>
          </div>
        </div>

        {/* Selector de identidad — solo al crear (al editar el kind es fijo) */}
        {!editing && (
          <div className="mb-4 flex gap-2" role="radiogroup" aria-label="Tipo de lugar">
            {KIND_OPTIONS.map((option) => (
              <button
                key={option.kind}
                role="radio"
                aria-checked={kind === option.kind}
                onClick={() => setKind(option.kind)}
                className={cn(
                  'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-all active:scale-95',
                  kind === option.kind
                    ? 'border-primary bg-primary-container/25 text-on-surface'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low',
                )}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">
                  {option.icon}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* Nombre editable */}
        <label htmlFor="save-place-title" className="mb-1 block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Nombre
        </label>
        <input
          ref={inputRef}
          id="save-place-title"
          value={title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          maxLength={40}
          placeholder={editing ? 'Nombre del lugar' : 'Cómo llamás a este lugar'}
          className="mb-3 min-h-11 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
        />

        {/* Chip de reemplazo (solo create + kind con slot único ocupado) */}
        {replaces && (
          <p
            role="status"
            className="mb-3 flex items-center gap-2 rounded-xl bg-tertiary-container/20 px-3 py-2 text-xs font-medium text-on-surface"
          >
            <span className="material-symbols-outlined text-base text-[#855300]" aria-hidden="true">
              info
            </span>
            Se reemplazará tu {kind === 'home' ? 'Casa' : 'Trabajo'} actual.
          </p>
        )}

        {/* Cambiar ubicación — solo edit (el create toma la ubicación del resultado) */}
        {editing && onPickLocation && (
          <button
            onClick={() => onPickLocation(place!)}
            className="mb-3 flex min-h-10 w-full items-center gap-2 rounded-xl px-2 text-sm font-semibold text-primary hover:bg-primary/10 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">pin_drop</span>
            Cambiar ubicación en el mapa
          </button>
        )}

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]',
              canSubmit
                ? 'bg-primary text-on-primary hover:bg-primary-container'
                : 'cursor-not-allowed bg-surface-container-high text-on-surface-variant',
            )}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              {editing ? 'check' : 'bookmark_added'}
            </span>
            {editing ? 'Guardar cambios' : 'Guardar lugar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
