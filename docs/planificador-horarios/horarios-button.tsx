/**
 * HorariosButton — CTA "Ver todos los horarios" (reutilizable).
 *
 * Animaciones: brillo que barre (rutaba-shine) + colectivito que arranca
 * (rutaba-drive), 3.2s sincronizados, respetando prefers-reduced-motion.
 * Navega a /horarios (horarios de todas las líneas + combinaciones).
 */

'use client';

import { useRouter } from 'next/navigation';

export function HorariosButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/horarios')}
      className={
        'rutaba-horarios-btn flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-sm font-bold text-primary shadow-sm transition-colors hover:bg-surface-container active:scale-[0.98]' +
        (className ? ` ${className}` : '')
      }
    >
      <span className="rutaba-bus material-symbols-outlined text-lg" aria-hidden="true">
        directions_bus
      </span>
      Ver todos los horarios
    </button>
  );
}
