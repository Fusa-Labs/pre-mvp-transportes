# Usos del logo Metropol

Reglas de aplicación de la marca **La Nueva Metropol** en interfaces. Extraído de `src/app/metropol/page.tsx` (sección "El logo") y del componente `metropol-logo.tsx`.

## Paleta oficial

| Color | Hex | Uso |
|---|---|---|
| Navy | `#1D2B4F` | Wordmark sobre fondo claro |
| Rojo | `#E30613` | Pétalos de la rosa / acentos |
| Verde | `#228135` | Hojas de la rosa |
| Navy profundo (UI) | `#101D3D` | Headers y fondos oscuros de la app |

## Las dos variantes

### 1. Fondo claro — `variant="full"` (default)

Renderiza el wordmark en navy + rosa en rojo/verde. **No** pongas color extra en el texto.

```tsx
import { MetropolLogo } from '@/components/brand/metropol-logo';

<MetropolLogo className="h-9" />
```

Ejemplos válidos: sobre `bg-white`, cards claras, footers en light mode.

### 2. Fondo oscuro — `variant="mono"` + `text-white`

Todas las capas usan `currentColor`. El color lo definís con la clase de texto.

```tsx
<MetropolLogo variant="mono" className="h-9 text-white" />
```

Ejemplos válidos: header `bg-[#101D3D]`, hero con gradiente navy, tarjetas oscuras.

```tsx
// Header sticky (como en /metropol)
<header className="bg-[#101D3D]/95 text-white">
  <MetropolLogo variant="mono" className="h-6 text-white" />
</header>
```

## Solo la rosa

Para avatares, loaders o íconos de marca sin el wordmark:

```tsx
import { MetropolRose } from '@/components/brand/metropol-logo';

<MetropolRose className="h-14" />
// o monocromo:
<MetropolRose variant="mono" className="h-14 text-white" />
```

ViewBox de la rosa: `0 0 82 178.87` (alto y angosta — siempre pasá `h-*` y `w-auto`).

## Template de demo (referencia visual)

```
┌─────────────────────────────────────────┐
│  Sobre fondo claro                     │
│  ┌───────────────────────────────────┐  │
│  │  (logo full navy/rosa/verde)      │  │  bg-white
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  Sobre fondo oscuro                     │
│  ┌───────────────────────────────────┐  │
│  │  (logo mono en blanco)            │  │  bg-[#101D3D]
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## No hagas

- ❌ `variant="full"` sobre fondo oscuro → el navy desaparece.
- ❌ `variant="mono"` sin `text-*` explícito → puede heredar un color raro del padre.
- ❌ Estirar con `w-full h-auto` sin respetar proporción (viewBox `719.16 × 178.87` ≈ 4:1).
- ❌ Cambiar los hex de `METROPOL_COLORS` — son la paleta oficial.

## Assets estáticos

Cuando necesites el logo fuera de React (favicon, Open Graph, documentación):

- `public/metropol-logo.svg` — completo, pensado para fondo claro.
- `public/metropol-icon.png` — 192×192 con transparencia.
