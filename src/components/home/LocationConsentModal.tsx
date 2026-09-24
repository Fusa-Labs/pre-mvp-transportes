/**
 * LocationConsentModal — PBI-019
 * Permiso de ubicación del asistente de /inicio. Es DECORATIVO: esta demo
 * no pide geolocation al navegador; al aceptar se usa la ubicación
 * simulada (Parque Centenario) y el copy lo dice explícitamente.
 * El día que se conecte navigator.geolocation (TODO(geo-real) en
 * user-location.ts), este modal pasa a dispararlo de verdad sin cambiar la API.
 *
 * Sin backdrop-blur (convención overlays, PBI-015). Targets ≥ 44px, tokens DESIGN.MD.
 */

'use client';

import { useEffect, useRef } from 'react';
import { Navigation, MapPin, X } from 'lucide-react';

interface LocationConsentModalProps {
  /** "Permitir": consentimiento + referencia simulada de demo. */
  onAllow: () => void;
  /** Consentimiento + ir directo al selector de lugar. */
  onChoosePlace: () => void;
  /** Cerrar sin conceder (chip vuelve a off). */
  onClose: () => void;
}

export function LocationConsentModal({
  onAllow,
  onChoosePlace,
  onClose,
}: LocationConsentModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="w-full max-w-[360px] bg-canvas border border-hairline rounded-3xl p-5 shadow-[0_16px_45px_-6px_rgba(16,29,61,0.35)] animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-canvas-soft border border-hairline flex items-center justify-center">
            <Navigation className="w-5 h-5 text-electric-blue" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar sin compartir ubicación"
            className="w-8 h-8 rounded-full bg-canvas-soft hover:bg-field border border-hairline flex items-center justify-center text-text-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 id="consent-title" className="text-lg font-bold text-ink mt-3">
          ¿Usamos tu ubicación?
        </h2>
        <p className="text-sm text-text-muted leading-snug mt-1.5">
          Para decirte qué colectivos pasan cerca y cuánto tardan en llegar.
        </p>
        <p className="text-xs text-text-faint mt-2 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            En esta demo usamos una <strong className="font-bold text-text-muted">ubicación
            simulada: Parque Centenario</strong>. Después podés elegir otra avenida o lugar.
          </span>
        </p>

        <div className="flex flex-col gap-2 mt-5">
          <button
            ref={primaryRef}
            type="button"
            onClick={onAllow}
            className="w-full min-h-[48px] bg-ink text-canvas rounded-xl font-bold text-sm active:scale-[0.98] transition-transform"
          >
            Permitir (demo)
          </button>
          <button
            type="button"
            onClick={onChoosePlace}
            className="w-full min-h-[44px] bg-canvas-soft text-ink border border-hairline rounded-xl font-semibold text-sm hover:bg-field active:scale-[0.98] transition-all"
          >
            Elegir otro lugar
          </button>
        </div>
      </div>
    </div>
  );
}
