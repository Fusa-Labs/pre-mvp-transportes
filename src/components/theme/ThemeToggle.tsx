"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Botón ergonómico de alternancia Dark / Light Mode.
 * Touch target de 44x44px conforme a estándares de accesibilidad táctil móvil (PWA).
 */
export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 shadow-lg border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-zinc-850 active:scale-90 transition-all pointer-events-auto touch-manipulation ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
