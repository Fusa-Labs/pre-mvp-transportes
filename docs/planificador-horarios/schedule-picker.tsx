/**
 * SchedulePicker — selector de salida ("Ahora" / horario) del
 * planificador. Popover liviano, cerrado por click fuera.
 *
 * El selector de pasajero ("Para mí") quedó FUERA por decisión de
 * producto (Fase 4): una decisión menos en el camino del usuario.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const TIME_OPTIONS: Array<{ value: 'now' | string; label: string }> = [
  { value: 'now', label: 'Salir ahora' },
  { value: 'plus15', label: 'En 15 minutos' },
  { value: 'plus30', label: 'En 30 minutos' },
  { value: 'plus60', label: 'En 1 hora' },
];

export function SchedulePicker({
  pickupTime,
  onTimeChange,
}: {
  pickupTime: 'now' | string;
  onTimeChange: (value: 'now' | string) => void;
}) {
  const [timeOpen, setTimeOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!timeOpen) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setTimeOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [timeOpen]);

  const timeLabel = TIME_OPTIONS.find((o) => o.value === pickupTime)?.label ?? 'Salir ahora';

  return (
    <div ref={rootRef} className="relative flex items-center" data-no-drag>
      <button
        onClick={() => setTimeOpen((v) => !v)}
        aria-expanded={timeOpen}
        className="flex h-10 items-center gap-2 rounded-full bg-surface-container-lowest px-3.5 text-xs font-semibold text-on-surface shadow-sm ring-1 ring-outline-variant hover:bg-surface-container-low"
      >
        <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">schedule</span>
        {timeLabel}
        <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">expand_more</span>
      </button>
      {timeOpen && (
        <div className="absolute left-0 top-11 z-10 w-56 rounded-xl bg-surface p-1 shadow-lg ring-1 ring-outline-variant">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onTimeChange(option.value);
                setTimeOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-on-surface hover:bg-surface-container-low',
                pickupTime === option.value && 'bg-surface-container-low',
              )}
            >
              {option.label}
              {pickupTime === option.value && (
                <span className="material-symbols-outlined text-base text-primary" aria-hidden="true">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
