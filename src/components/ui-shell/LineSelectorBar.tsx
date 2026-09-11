"use client";

import { Layers } from "lucide-react";
import { Linea, RamalDefinition } from "@/types/transport";

interface LineSelectorBarProps {
  lineas: Linea[];
  selectedLineaId: string | null;
  selectedRamalId?: string | null;
  onSelectLinea: (lineaId: string | null) => void;
  onSelectRamal?: (ramalId: string | null) => void;
}

function getRamalLetter(ramal: RamalDefinition): string {
  if (ramal.codigo.toLowerCase().includes("troncal")) return "T";
  const match = ramal.codigo.match(/Ramal\s+([A-Z0-9]+)/i);
  if (match && match[1]) return match[1].toUpperCase();
  return ramal.codigo.trim().charAt(0).toUpperCase() || "R";
}

function getRamalDisplayName(ramal: RamalDefinition): string {
  const cod = getRamalLetter(ramal);
  const shortNames: Record<string, string> = {
    A: "Once ⇄ Zárate (Común)",
    B: "Once ⇄ Escobar (Común)",
    D: "Zárate ➔ Once (Expreso)",
    E: "Zárate ➔ Once (Reconv. E)",
    F: "Escobar ➔ Pza. Italia",
    G: "Zárate ➔ Once (Reconv. G)",
    H: "Escobar ➔ Once (Reconv.)",
    I: "Zárate ➔ Retiro (Dif.)",
    T: "Constitución ⇄ Barrancas",
  };
  return shortNames[cod] || ramal.nombre;
}

/**
 * Componente modular LineSelectorBar (Rail Vertical a la Izquierda).
 * Disposición vertical con jerarquía visual:
 * - Badges de líneas que muestran ÚNICAMENTE el número (ej: 65, 194).
 * - Badges de ramales hijos que muestran ÚNICAMENTE la letra (ej: T, A, B, D, F, H, I).
 * - Al seleccionar un ramal, se despliega el nombre de cabecera al lado de la letra.
 * - Conectores visuales de árbol jerárquico y safe-areas táctiles de 40-44px.
 */
export default function LineSelectorBar({
  lineas,
  selectedLineaId,
  selectedRamalId,
  onSelectLinea,
  onSelectRamal,
}: LineSelectorBarProps) {
  if (lineas.length <= 1) return null;

  return (
    <aside
      aria-label="Selector jerárquico de líneas y ramales"
      className="absolute left-2 top-[calc(max(14px,env(safe-area-inset-top))+62px)] z-25 flex flex-col items-start gap-2.5 pointer-events-auto max-h-[calc(100dvh-200px)] overflow-y-auto no-scrollbar p-2"
    >
      {/* Botón 'Todas' las líneas */}
      <button
        onClick={() => {
          onSelectLinea(null);
          onSelectRamal?.(null);
        }}
        title="Mostrar todas las líneas"
        aria-label="Mostrar todas las líneas"
        className={`w-10 h-10 rounded-full text-xs font-bold transition-all shrink-0 flex items-center justify-center touch-manipulation shadow-md backdrop-blur-md ${
          selectedLineaId === null && !selectedRamalId
            ? "bg-ink text-canvas ring-2 ring-ink ring-offset-2 ring-offset-canvas scale-105"
            : "bg-canvas/90 text-text-muted border border-hairline hover:bg-canvas-soft hover:text-ink"
        }`}
      >
        <Layers className="w-4 h-4" />
      </button>

      {/* Árbol Jerárquico por Línea y sus Ramales */}
      {lineas.map((linea) => {
        const isLineSelected = selectedLineaId === linea.id;
        const ramales = linea.ramalesDetalle || [];

        return (
          <div key={linea.id} className="flex flex-col items-start">
            {/* Badge de Línea (100% Circular, solo número) */}
            <button
              onClick={() => {
                if (isLineSelected && !selectedRamalId) {
                  onSelectLinea(null);
                  onSelectRamal?.(null);
                } else {
                  onSelectLinea(linea.id);
                  onSelectRamal?.(null);
                }
              }}
              title={`Línea ${linea.numero} — ${linea.nombre}`}
              aria-label={`Línea ${linea.numero}`}
              className={`w-10 h-10 rounded-full font-black text-sm transition-all shrink-0 flex items-center justify-center touch-manipulation shadow-md ${
                isLineSelected
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas scale-105 z-10"
                  : "opacity-80 hover:opacity-100 hover:scale-102"
              }`}
              style={{
                backgroundColor: linea.colorHex,
                color: linea.textColorHex,
              }}
            >
              {linea.numero}
            </button>

            {/* Ramales Anidados Jerárquicamente */}
            {ramales.length > 0 && (
              <div className="ml-5 pl-2.5 border-l-2 border-hairline/80 flex flex-col items-start gap-1.5 py-1.5">
                {ramales.map((ramal) => {
                  const letter = getRamalLetter(ramal);
                  const isRamalSelected = selectedRamalId === ramal.id;
                  const displayName = getRamalDisplayName(ramal);

                  return (
                    <button
                      key={ramal.id}
                      onClick={() => {
                        if (isRamalSelected) {
                          onSelectRamal?.(null);
                        } else {
                          onSelectLinea(linea.id);
                          onSelectRamal?.(ramal.id);
                        }
                      }}
                      title={`${ramal.codigo}: ${ramal.nombre}`}
                      aria-label={`${ramal.codigo}: ${ramal.nombre}`}
                      className={`min-h-[30px] rounded-full transition-all flex items-center gap-1.5 touch-manipulation shadow-xs ${
                        isRamalSelected
                          ? "px-2.5 py-0.5 bg-ink text-canvas font-bold ring-1 ring-ink scale-102"
                          : "w-7 h-7 justify-center bg-canvas/90 backdrop-blur-md text-ink border border-hairline hover:border-ink/60 hover:bg-canvas-soft"
                      }`}
                    >
                      {/* Letra del ramal con color identificatorio */}
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                          isRamalSelected
                            ? "bg-canvas text-ink"
                            : "text-canvas"
                        }`}
                        style={{
                          backgroundColor: isRamalSelected ? undefined : ramal.color,
                        }}
                      >
                        {letter}
                      </span>

                      {/* Nombre expandido SOLO cuando está seleccionado */}
                      {isRamalSelected && (
                        <span className="whitespace-nowrap pr-1.5 text-[11px] font-semibold tracking-tight animate-in fade-in slide-in-from-left-1 duration-150">
                          {displayName}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
