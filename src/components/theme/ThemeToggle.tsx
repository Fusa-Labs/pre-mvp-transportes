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
      className={`w-10 h-10 rounded-full bg-canvas border border-hairline flex items-center justify-center text-ink hover:bg-canvas-soft transition-colors pointer-events-auto touch-manipulation ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-ink transition-transform duration-200" />
      ) : (
        <Moon className="w-4 h-4 text-ink transition-transform duration-200" />
      )}
    </button>
  );
}
