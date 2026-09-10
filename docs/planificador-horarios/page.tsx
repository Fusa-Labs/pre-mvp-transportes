/**
 * Pantalla Horarios de Todos los Colectivos — /horarios (RutaBA)
 *
 * - Header: back + "Horarios de colectivos"
 * - Listado de líneas: badge + frecuencia + primera/última salida +
 *   próxima salida en vivo → /horarios/[id]
 * - Sección "Combinaciones": paradas compartidas por 2+ líneas donde
 *   se puede transbordar
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/ui/bottom-nav';
import { LineBadge } from '@/components/ui/line-badge';
import { MOCK_LINES } from '@/mock/data';
import {
  buildLineSchedules,
  combinationsByStop,
  firstLast,
  nextDeparture,
} from '@/lib/schedules';

export default function HorariosPage() {
  const router = useRouter();
  const [nowMin, setNowMin] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  const rows = useMemo(
    () =>
      MOCK_LINES.map((line) => {
        const habil = buildLineSchedules(line.id).find((s) => s.servicio === 'habil');
        const extremes = habil ? firstLast(habil.ida) : null;
        const proxima = habil && nowMin !== null ? nextDeparture(habil.ida, nowMin) : null;
        return { line, extremes, total: habil?.ida.length ?? 0, proxima };
      }),
    [nowMin],
  );

  const combinaciones = useMemo(() => combinationsByStop(), []);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="bg-surface flex items-center px-4 h-12 w-full fixed top-0 z-50 shadow-sm">
        <button
          onClick={() => router.back()}
          className="h-12 w-12 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-[20px] font-semibold text-on-surface truncate px-2">
          Horarios de colectivos
        </h1>
      </header>

      <main className="px-4 pt-16 space-y-4">
        {/* Listado de líneas */}
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Todas las líneas
          </h2>
          {rows.map(({ line, extremes, total, proxima }) => (
            <button
              key={line.id}
              onClick={() => router.push(`/horarios/${line.id}`)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-sm text-left hover:bg-surface-container-low transition-colors active:scale-[0.98]"
              aria-label={`Ver horarios completos de la línea ${line.shortName}`}
            >
              <div className="flex items-center gap-3">
                <LineBadge shortName={line.shortName} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-on-surface">
                    Línea {line.shortName} — {line.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {line.direction} · cada {line.frequency} min
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
                  chevron_right
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                {extremes && (
                  <span className="rounded-lg bg-surface-container-low px-2.5 py-1.5 font-semibold text-on-surface tabular-nums">
                    {extremes.primera} — {extremes.ultima}
                  </span>
                )}
                <span className="rounded-lg bg-surface-container-low px-2.5 py-1.5 text-on-surface-variant">
                  {total} salidas
                </span>
                {proxima && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A]/10 px-2.5 py-1.5 font-semibold text-[#16A34A] tabular-nums">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" aria-hidden="true" />
                    próxima {proxima}
                  </span>
                )}
              </div>
            </button>
          ))}
        </section>

        {/* Combinaciones — dónde transbordar */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Combinaciones · dónde transbordar
          </h2>
          <ul className="mt-3 space-y-3">
            {combinaciones.map(({ stop, lines }) => (
              <li key={stop.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">transfer_within_a_station</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-on-surface">{stop.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {lines.map((l, i) => (
                      <span key={l.id} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="material-symbols-outlined text-sm text-outline-variant" aria-hidden="true">
                            sync_alt
                          </span>
                        )}
                        <span
                          className="inline-flex h-5 min-w-6 items-center justify-center rounded-md px-1 text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: l.color }}
                        >
                          {l.shortName}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
