# Home (Inicio) - Estructura Completa

## Resumen

La página de **Inicio** (`/inicio`) es el **dashboard principal** de la app Colectivos AMBA. Muestra las paradas favoritas del usuario, la próxima llegada destacada, alertas de servicio y acceso rápido a horarios.

---

## Arquitectura de la Home

```
/inicio
├── page.tsx                    ← Página principal (Inicio)
├── components/
│   ├── Header                  ← Barra superior con saludo + campana de alertas
│   ├── HeroArrival             ← Card destacada de próxima llegada
│   ├── StopsSection            ← Sección "Tus paradas" con lista de favoritos
│   │   ├── StopCard            ← Card de cada parada con llegadas
│   │   │   ├── LineBadge       ← Badge de línea (colores por línea)
│   │   │   └── ArrivalCard     ← Card de cada llegada (ETA + en vivo)
│   │   └── EmptyState          ← Estado cuando no hay paradas guardadas
│   ├── AlertSection            ← Sección de alertas de servicio
│   │   └── AlertCard           ← Card del primer incidente activo
│   ├── HorariosButton          ← CTA "Ver todos los horarios"
│   └── BottomNav               ← Navegación inferior flotante
└── hooks/
    └── useFavorites            ← Hook de persistencia de favoritos (localStorage)
```

---

## Archivos Clave

### 1. Página Principal: `src/app/inicio/page.tsx`

**Función:** `InicioPage`

**Responsabilidades:**
- Renderizar el header con saludo personalizado y fecha
- Mostrar badge de alertas activas en la campana
- Calcular y mostrar la próxima llegada destacada (hero card)
- Listar todas las paradas favoritas con sus llegadas
- Ofrecer CTA para agregar nuevas paradas
- Mostrar alertas activas del sistema
- Incluir botón de horarios con animaciones

**Estado interno:**
- `refreshKey` → fuerza regeneración de ETAs mock (simula refresh de datos)
- `favorites` → viene del hook `useFavorites` (localStorage)

**Dependencias:**
```typescript
import { BottomNav } from '@/components/ui/bottom-nav';
import { ArrivalCard } from '@/components/ui/arrival-card';
import { LineBadge } from '@/components/ui/line-badge';
import { HorariosButton } from '@/components/ui/horarios-button';
import { MetropolRose } from '@/components/brand/metropol-logo';
import { MOCK_STOPS, MOCK_LINES, MOCK_ALERTS } from '@/mock/data';
import { useFavorites } from '@/hooks/use-favorites';
```

---

### 2. Componente: BottomNav (`src/components/ui/bottom-nav.tsx`)

**Diseño:** Dock flotante tipo píldora con glass blur

**Estructura:**
```
╭─────────────────────────────────────────────╮
│  Inicio │ Líneas │ (QR) │ Mapa │ Perfil    │
╰─────────────────────────────────────────────╯
```

**Características:**
- Safe-area de iOS/Android respetada (`env(safe-area-inset-bottom)`)
- QR elevado con glow violeta (Rosa Metropol)
- Ítem activo con píldora de color
- Badge de alertas con contador
- Accesibilidad: ARIA labels, roles, focus visible

**Navegación:**
- `/inicio` → Inicio (casa)
- `/lineas` → Líneas de colectivo
- `/escanear` → Escanear QR (botón central elevado)
- `/mapa` → Mapa en vivo
- `/perfil` → Perfil del usuario

---

### 3. Componente: ArrivalCard (`src/components/ui/arrival-card.tsx`)

**Props:**
```typescript
interface ArrivalCardProps {
  lineName: string;        // Nombre corto de la línea (ej: "200")
  lineDirection?: string;  // Dirección (ej: "Sur")
  lineColor?: string;      // Color de la línea
  etaMin: number;          // Minutos hasta la llegada
  live: boolean;           // true = datos en vivo, false = por horario
  className?: string;
}
```

**Diseño:**
- Container: `bg-surface-container-low` rounded-lg, min-height 48px
- Left: LineBadge (32x32) + texto de dirección
- Right: ETA bold + badge "En vivo" con punto verde parpadeante

**Accesibilidad:**
- `role="status"`
- `aria-label` descriptivo con línea, ETA y tipo de dato

---

### 4. Componente: LineBadge (`src/components/ui/line-badge.tsx`)

**Props:**
```typescript
interface LineBadgeProps {
  shortName: string;   // Nombre corto (ej: "200")
  color?: string;      // Color personalizado
  size?: 'sm' | 'md'; // sm=24x24, md=32x32
  className?: string;
}
```

**Diseño:**
- Sin color: `bg-primary-container text-on-primary`
- Con color: usa el color como background
- Sizes: sm (24x24, text-[10px]), md (32x32, text-sm)

---

### 5. Componente: HorariosButton (`src/components/ui/horarios-button.tsx`)

**Función:** CTA "Ver todos los horarios" reutilizable

**Animaciones:**
- `rutaba-shine` → brillo que barre (3.2s)
- `rutaba-drive` → colectivito que arranca (3.2s sincronizados)
- Respeta `prefers-reduced-motion`

**Navega:** `/horarios`

---

### 6. Componente: MetropolRose (`src/components/brand/metropol-logo.tsx`)

**Función:** SVG de la rosa Metropol (ícono de marca)

**Variantes:**
- `full` → colores oficiales (rojo #E30613, verde #228135)
- `mono` → un solo color vía `currentColor`

**Colores oficiales:**
```typescript
const METROPOL_COLORS = {
  navy: '#1D2B4F',
  red: '#E30613',
  green: '#228135',
};
```

---

### 7. Hook: useFavorites (`src/hooks/use-favorites.ts`)

**Función:** Persistencia de paradas favoritas en localStorage

**Implementación:**
- Usa `useSyncExternalStore` para sincronización entre pestañas
- Sincronizado vía evento `storage`
- Sin flags de "cargado" (patrón idéntico a `useSubeCard`)

**API:**
```typescript
interface Favorite {
  stopId: string;
  addedAt: number;
}

function useFavorites() {
  return {
    favorites: Favorite[];
    isFavorite: (stopId: string) => boolean;
    addFavorite: (stopId: string) => boolean;
    removeFavorite: (stopId: string) => boolean;
    toggleFavorite: (stopId: string) => boolean;
  };
}
```

**Storage Key:** `rutaba_favoritos`

---

## Datos Mock (`src/mock/data.ts`)

### Líneas disponibles:
| ID | Nombre | Corto | Dirección | Frecuencia |
|----|--------|-------|-----------|------------|
| line-200 | Centro – Sur | 200 | Sur | 15 min |
| line-210 | Centro – Oeste | 210 | Oeste | 10 min |
| line-215 | Zona Norte | 215 | Norte | 20 min |
| line-220 | Costanera | 220 | Costanera | 25 min |
| line-225 | Aeropuerto – Centro | 225 | Centro | 30 min |

### Paradas canónicas:
1. Av. Corrientes y Belgrano (líneas: 200, 210)
2. Diagonal Norte y Maipú (líneas: 200, 215)
3. Pje. Castelli y Av. Cabildo (línea: 215)
4. Terminal Central (líneas: 200, 210, 225)

### Alertas de ejemplo:
- Retraso en línea 200 (obra en Av. 9 de Julio)
- Línea 225 suspendida (corte en acceso aeropuerto)
- Cambio de recorrido línea 220 (evento en Costanera)

---

## Design System (MD3 Tokens)

### Colores principales:
- **Primary:** `#0037B0` (azul Metropol)
- **Primary Container:** `#1D4ED8`
- **Secondary Container:** `#FEA619` (naranja)
- **Tertiary Container:** `#006B2C` (verde "en vivo")
- **Error:** `#BA1A1A`

### Superficies:
- **Surface:** `#FAF8FF`
- **Surface Container:** `#EAEDFF`
- **Surface Container Low:** `#F2F3FF`
- **Surface Container Lowest:** `#FFFFFF`

### Tipografía:
- **Fuente:** Plus Jakarta Sans (Google Fonts)
- **Weights:** 400, 500, 600, 700, 800

### Íconos:
- **Material Symbols Outlined** (Google Fonts)
- Cargados vía CDN en `layout.tsx`

---

## Layout (`src/app/layout.tsx`)

**Estructura:**
```tsx
<html lang="es-AR">
  <head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." />
  </head>
  <body className="min-h-full bg-background text-foreground font-sans">
    <ThemeProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </ThemeProvider>
  </body>
</html>
```

**Providers:**
- `ThemeProvider` → manejo de tema claro/oscuro
- `DataProvider` → datos de la app (GPS, líneas, etc.)

---

## Animaciones Clave (globals.css)

```css
/* Pulso "en vivo" — 1.8s (sincronizado con mapa) */
@keyframes rutaba-live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.75); }
}

/* Brillo del botón horarios — 3.2s */
@keyframes rutaba-shine {
  0% { transform: translateX(-140%) skewX(-14deg); opacity: 0; }
  15% { opacity: 1; }
  60%, 100% { transform: translateX(260%) skewX(-14deg); opacity: 0; }
}

/* Colectivito arranca — 3.2s (sincronizado con shine) */
@keyframes rutaba-drive {
  0%, 55% { transform: translateX(0); }
  80% { transform: translateX(7px); }
  100% { transform: translateX(7px); }
}

/* Aura violeta de la Rosa Metropol — 3.2s */
@keyframes rutaba-rose-glow {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.32), 0 0 16px rgba(139, 92, 246, 0.22);
  }
  50% {
    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.55), 0 0 32px rgba(139, 92, 246, 0.45);
  }
}
```

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                     INICIO PAGE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐                      │
│  │ useFavorites │────▶│ MOCK_STOPS   │                      │
│  │ (localStorage)│     │ (datos mock) │                      │
│  └──────────────┘     └──────────────┘                      │
│         │                     │                              │
│         ▼                     ▼                              │
│  ┌──────────────┐     ┌──────────────┐                      │
│  │ favorites[]  │────▶│ stops[]      │                      │
│  │ (stopIds)    │     │ (stop+ETA)   │                      │
│  └──────────────┘     └──────────────┘                      │
│                              │                               │
│         ┌────────────────────┼────────────────────┐         │
│         ▼                    ▼                    ▼         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │ HeroArrival │     │ StopsList   │     │ AlertSection│  │
│  │ (próxima    │     │ (paradas    │     │ (alertas    │  │
│  │  llegada)   │     │  favoritas) │     │  activas)   │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist para replicar la Home

- [ ] Crear `/inicio/page.tsx` con estructura de secciones
- [ ] Implementar `BottomNav` con 5 items + QR central
- [ ] Crear `ArrivalCard` con soporte para live/horario
- [ ] Crear `LineBadge` con colores por línea
- [ ] Implementar `HorariosButton` con animaciones
- [ ] Crear hook `useFavorites` con localStorage
- [ ] Configurar MD3 tokens en `globals.css`
- [ ] Cargar Material Symbols Outlined en layout
- [ ] Agregar animaciones CSS (shine, drive, glow, pulse)
- [ ] Configurar Plus Jakarta Sans como fuente principal
- [ ] Crear datos mock (líneas, paradas, alertas)
- [ ] Implementar sección de alertas con badge

---

## Dependencias externas

```json
{
  "next": ">=14.x",
  "react": ">=18.x",
  "tailwindcss": ">=4.x",
  "clsx": ">=2.x",
  "tailwind-merge": ">=2.x"
}
```

---

*Documentación generada para el agente Gemini de Jesús - Septiembre 2026*
