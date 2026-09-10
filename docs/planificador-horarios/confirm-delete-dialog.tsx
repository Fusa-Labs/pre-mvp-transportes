/**
 * ConfirmDeleteDialog — confirmación de eliminación de sugerencias.
 *
 * Mensaje exacto: "¿Estás seguro que quieres eliminar {nombre}?"
 * Botones: Cancelar (cierra sin cambios) / Eliminar (confirma).
 * Header con colectivito (identidad de la app en la alerta).
 * Overlay hermano del sheet: position:fixed dentro de un ancestro con
 * transform (motion) se posiciona relativo al ancestro, no al viewport.
 */

'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { LocationItem } from '@/lib/planner/types';

export function ConfirmDeleteDialog({
  item,
  onCancel,
  onConfirm,
}: {
  item: LocationItem | null;
  onCancel: () => void;
  onConfirm: (item: LocationItem) => void;
}) {
  const reduceMotion = useReducedMotion();

  // Escape cancela (diálogo accesible)
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onCancel]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.32, bounce: 0.14 }}
        className="relative w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl"
      >
        {/* Colectivito */}
        <div className="mb-3 flex flex-col items-center text-center gap-2">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-sm">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">
              directions_bus
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#DC2626] text-white shadow-sm">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
            </span>
          </span>
        </div>

        <h3
          id="confirm-delete-title"
          className="text-center text-lg font-bold text-on-surface"
        >
          ¿Estás seguro que quieres eliminar {item.title}?
        </h3>
        <p className="mt-1 text-center text-sm text-on-surface-variant">
          Va a desaparecer de tus sugerencias.
        </p>

        {/* Botones */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-low active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(item)}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] text-sm font-bold text-white hover:bg-[#B91C1C] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
