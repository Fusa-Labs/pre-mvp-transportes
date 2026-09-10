/**
 * useTripPlanner — lugares guardados (Casa/Trabajo/Favorito) y recientes
 * del planificador, persistidos en localStorage.
 *
 * Misma arquitectura que useFavorites: useSyncExternalStore con snapshot
 * crudo, sin flags de "cargado", sincronizado entre pestañas vía evento
 * 'storage'. P0 local; Supabase en P1 sin tocar la UI.
 */

'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { LocationItem, SavedKind, SavedPlace } from '@/lib/planner/types';

const SAVED_KEY = 'rutaba_lugares';
const RECENT_KEY = 'rutaba_recientes';
const DISMISSED_KEY = 'rutaba_ocultas';
const EMPTY = '[]';
const RECENT_CAP = 6;

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function readKey(key: string): string {
  try {
    return localStorage.getItem(key) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function getSavedSnapshot(): string {
  return readKey(SAVED_KEY);
}

function getRecentSnapshot(): string {
  return readKey(RECENT_KEY);
}

function getDismissedSnapshot(): string {
  return readKey(DISMISSED_KEY);
}

function getServerSnapshot(): string {
  return EMPTY;
}

function parseJson<T>(raw: string, guard: (value: unknown) => boolean): T[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed.filter(guard) as T[]) : [];
  } catch {
    return [];
  }
}

const isSavedPlace = (v: unknown): boolean =>
  typeof v === 'object' && v !== null &&
  typeof (v as SavedPlace).id === 'string' &&
  typeof (v as SavedPlace).kind === 'string';

const isLocationItem = (v: unknown): boolean =>
  typeof v === 'object' && v !== null &&
  typeof (v as LocationItem).id === 'string' &&
  typeof (v as LocationItem).title === 'string';

function writeKey(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage lleno o bloqueado: la operación falla sin crashear el onClick
    return false;
  }
  notify();
  return true;
}

export function useTripPlanner() {
  const savedRaw = useSyncExternalStore(subscribe, getSavedSnapshot, getServerSnapshot);
  const recentRaw = useSyncExternalStore(subscribe, getRecentSnapshot, getServerSnapshot);
  const dismissedRaw = useSyncExternalStore(subscribe, getDismissedSnapshot, getServerSnapshot);
  const saved = parseJson<SavedPlace>(savedRaw, isSavedPlace);
  const recent = parseJson<LocationItem>(recentRaw, isLocationItem);
  const dismissed = parseJson<string>(dismissedRaw, (v) => typeof v === 'string');

  /** Guarda un lugar con una identidad (Casa / Trabajo / Favorito). */
  const addSaved = useCallback(
    (kind: SavedKind, item: LocationItem, title?: string): boolean => {
      const current = parseJson<SavedPlace>(getSavedSnapshot(), isSavedPlace);
      // Una sola Casa y un solo Trabajo: el nuevo reemplaza al anterior
      // (el SavePlaceSheet avisa al usuario antes de sobrescribir).
      const filtered =
        kind === 'saved' ? current : current.filter((p) => p.kind !== kind);
      return writeKey(SAVED_KEY, [
        {
          id: `${kind}-${Date.now()}`,
          title: title?.trim() || (kind === 'home' ? 'Casa' : kind === 'work' ? 'Trabajo' : item.title),
          subtitle: item.subtitle,
          coordinates: item.coordinates,
          kind,
          addedAt: Date.now(),
        },
        ...filtered,
      ]);
    },
    [],
  );

  /** Edita nombre/subtítulo/coordenadas de un lugar guardado (in-place). */
  const updateSaved = useCallback(
    (id: string, patch: Partial<Pick<SavedPlace, 'title' | 'subtitle' | 'coordinates'>>): boolean => {
      const current = parseJson<SavedPlace>(getSavedSnapshot(), isSavedPlace);
      const next = current.map((p) => (p.id === id ? { ...p, ...patch } : p));
      if (!next.some((p) => p.id === id)) return false;
      return writeKey(SAVED_KEY, next);
    },
    [],
  );

  /** Elimina y DEVUELVE el lugar eliminado (para Deshacer); null si no estaba. */
  const removeSaved = useCallback((id: string): SavedPlace | null => {
    const current = parseJson<SavedPlace>(getSavedSnapshot(), isSavedPlace);
    const removed = current.find((p) => p.id === id) ?? null;
    if (!removed) return null;
    return writeKey(SAVED_KEY, current.filter((p) => p.id !== id)) ? removed : null;
  }, []);

  /** Restaura un lugar eliminado (Deshacer) — vuelve al frente de la lista. */
  const restoreSaved = useCallback((place: SavedPlace): boolean => {
    const current = parseJson<SavedPlace>(getSavedSnapshot(), isSavedPlace);
    return writeKey(SAVED_KEY, [place, ...current.filter((p) => p.id !== place.id)]);
  }, []);

  /** Registra una selección como reciente (dedup por id, tope 6). */
  const addRecent = useCallback((item: LocationItem) => {
    if (item.type === 'map_picker' && item.title === 'Ubicación en el mapa') return;
    const current = parseJson<LocationItem>(getRecentSnapshot(), isLocationItem);
    writeKey(RECENT_KEY, [
      { ...item, type: 'recent' as const },
      ...current.filter((r) => r.id !== item.id),
    ].slice(0, RECENT_CAP));
  }, []);

  /** Oculta una sugerencia de la lista (eliminado con confirmación). */
  const dismissSuggestion = useCallback((id: string): boolean => {
    const current = parseJson<string>(getDismissedSnapshot(), (v) => typeof v === 'string');
    if (current.includes(id)) return true;
    return writeKey(DISMISSED_KEY, [id, ...current]);
  }, []);

  return {
    saved,
    recent,
    dismissed,
    addSaved,
    updateSaved,
    removeSaved,
    restoreSaved,
    addRecent,
    dismissSuggestion,
  };
}
