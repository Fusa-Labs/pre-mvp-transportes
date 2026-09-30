'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { Bus, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetropolRose } from '@/components/brand/metropol-logo';
import { useTheme } from '@/components/theme/ThemeProvider';
import type { ArrivalPhase } from '@/lib/trip-map-navigation';

/**
 * Bottom nav unificado de la app (home + mapas).
 * Sin Perfil. 3 módulos: Líneas (izq) · Rosa/Mapa (centro) · Inicio (der).
 * `onToggleLineMenu` (opcional): en /mapas, "Líneas" abre el selector en vez de navegar.
 * `onActivateTripMode` (opcional): doble tap en la rosa en /mapas abre Modo Viaje.
 * Fuera de /mapas, doble tap navega con `?trip=1` para que la página lo abra.
 */
export interface BottomNavProps {
  isLineMenuOpen?: boolean;
  onToggleLineMenu?: () => void;
  onActivateTripMode?: () => void;
  isTripMode?: boolean;
  /** Visual phase only; never changes the trip state machine. */
  arrivalPhase?: ArrivalPhase;
  /** Hay contenido de viaje para alternar (modo Viaje o colectivo seguido). */
  tripToggleActive?: boolean;
  /** Un toque en la rosa alterna la vista del viaje sin perder el estado. */
  onToggleTripView?: () => void;
}

const DOUBLE_TAP_MS = 320;
const TRIP_QUERY = 'trip=1';

export function BottomNav({
  isLineMenuOpen,
  onToggleLineMenu,
  onActivateTripMode,
  isTripMode = false,
  arrivalPhase,
  tripToggleActive = false,
  onToggleTripView,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const lastTapRef = useRef<number>(0);
  const onMap = pathname === '/mapas';
  const inicioActive = pathname === '/inicio';
  const lineasActive = onMap && Boolean(isLineMenuOpen);
  const mapaActive = onMap;
  const dark = resolvedTheme === 'dark';

  const handleRoseClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Si ya estamos en /mapas, NUNCA permitir navegación por defecto (evita resets y recargas)
    if (onMap) {
      event.preventDefault();
      if (tripToggleActive && onToggleTripView) {
        onToggleTripView();
        return;
      }
      if (onActivateTripMode) {
        onActivateTripMode();
        return;
      }
      return;
    }

    // Fuera de /mapas: navegación normal a /mapas o doble tap para Modo Viaje directo
    const now = Date.now();
    const isDouble = now - lastTapRef.current < DOUBLE_TAP_MS;
    lastTapRef.current = now;

    if (isDouble) {
      event.preventDefault();
      lastTapRef.current = 0;
      router.push('/mapas?trip=1');
      return;
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 pointer-events-none"
      aria-label="Navegación principal"
      role="navigation"
    >
      <div
        className={cn(
          "mx-auto relative pointer-events-auto transition-all duration-300 ease-out",
          isTripMode ? "w-[64px]" : "max-w-[340px] sm:max-w-sm"
        )}
      >
        <div
          className={cn(
            "relative h-[64px] border border-hairline bg-canvas shadow-[0_10px_36px_rgba(16,29,61,0.16)] transition-all duration-300 ease-out",
            isTripMode
              ? "w-[64px] rounded-full border-transparent bg-transparent shadow-none"
              : "rounded-[28px]"
          )}
        >
          {/* Botones laterales: Líneas e Inicio (visibles únicamente fuera de Modo Viaje) */}
          {!isTripMode && (
            <div className="flex h-full items-stretch justify-between px-1.5 animate-in fade-in duration-200">
              {/* Líneas — izquierda (cerca del centro, no al borde) */}
              {onToggleLineMenu && onMap ? (
                <button
                  type="button"
                  onClick={onToggleLineMenu}
                  className={cn(
                    'flex min-w-[88px] flex-1 flex-col items-center justify-center h-full rounded-2xl transition-all duration-200 active:scale-95 touch-manipulation',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                    lineasActive ? 'text-ink' : 'text-text-muted hover:text-ink',
                  )}
                  aria-label="Líneas"
                  aria-pressed={lineasActive}
                >
                  <Bus
                    className={cn(
                      'w-5 h-5 mb-0.5 transition-transform',
                      lineasActive && 'scale-110',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[11px] leading-none',
                      lineasActive ? 'font-bold' : 'font-medium',
                    )}
                  >
                    Líneas
                  </span>
                </button>
              ) : (
                <NavItem href="/mapas" label="Líneas" icon={Bus} active={false} className="min-w-[88px] flex-1" />
              )}

              {/* Spacer central bajo la rosa FAB — ancho fijo, sin celda fantasma ancha */}
              <div aria-hidden className="w-[56px] shrink-0" />

              {/* Inicio — derecha (espejo de Líneas) */}
              <NavItem
                href="/inicio"
                label="Inicio"
                icon={Home}
                active={inicioActive}
                className="min-w-[88px] flex-1"
              />
            </div>
          )}

          {/* Rosa elevada al centro exacto → /mapas (doble tap: Modo Viaje) */}
          <Link
            href="/mapas"
            data-active={mapaActive}
            onClick={handleRoseClick}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-3.5 z-10 flex flex-col items-center justify-center w-[56px] h-[56px] rounded-full shadow-md active:scale-95 transition-transform duration-200 touch-manipulation outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none [-webkit-tap-highlight-color:transparent]',
              dark ? 'bg-[#1D2B4F] ring-4 ring-[#1D2B4F]' : 'bg-white ring-4 ring-white',
            )}
            aria-label={onMap && tripToggleActive ? "Mostrar u ocultar la vista del viaje. Doble toque para abrir Modo Viaje" : "Ir al mapa. Doble toque para abrir Modo Viaje"}
            aria-current={mapaActive ? 'page' : undefined}
          >
            <MetropolRose variant="full" className="h-7 w-auto" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  className,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center justify-center h-full rounded-2xl transition-all duration-200 active:scale-95 touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
        active ? 'text-ink' : 'text-text-muted hover:text-ink',
        className,
      )}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-5 h-5 mb-0.5 transition-transform',
          active && 'scale-110',
        )}
      />
      <span
        className={cn(
          'text-[11px] leading-none',
          active ? 'font-bold' : 'font-medium',
        )}
      >
        {label}
      </span>
    </Link>
  );
}
