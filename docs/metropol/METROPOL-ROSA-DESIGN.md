# Rosa Metropol — Diseño, Componentes y Animación

> Documentación técnica del ícono de rosa de La Nueva Metropol para recreación en otro contexto.  
> Fuente: `src/components/brand/metropol-logo.tsx`

---

## 1. Visión General

La Rosa Metropol es un ícono vectorial que acompaña la marca en toda la app.  
Aparece en:
- **Dock flotante** (bottom nav) como botón central
- **Páginas de marca** (Metropol, landing, inicio)
- **Manual de usuario** inline como SVG embebido
- **Pantallas de splash/loading** con animación de respiración

---

## 2. Especificación del SVG

### MetropolRose (componente standalone)

```tsx
export function MetropolRose({ variant = 'full', className }) {
  return (
    <svg viewBox="0 0 82 178.87" className={className} role="img" aria-label="Metropol">
      {/* Hojas — VERDE */}
      {ROSE_GREEN_PATHS.map((d, i) => (
        <path key={`g-${i}`} d={d} fill={greenFill} />
      ))}
      {/* Pétalos — ROJO */}
      {ROSE_RED_PATHS.map((d, i) => (
        <path key={`r-${i}`} d={d} fill={redFill} />
      ))}
    </svg>
  );
}
```

| Propiedad | Valor |
|-----------|-------|
| **ViewBox** | `0 0 82 178.87` |
| **Ancho** | 82 unidades |
| **Alto** | 178.87 unidades |
| **Aspecto** | 1:2.18 (vertical, alargada) |
| **Variant** | `full` (colores oficiales) / `mono` (currentColor) |

---

## 3. Paths SVG — Coordenadas

### Hojas (Verde — `#228135`)

**Hoa 1** — curva inferior-izquierda con forma de hoja:

```
M3.09,94.61s-18.32,55.06,34.31,63.32c0,0,7.35-15.69-22.36-38.72,0,0,53,21.45,15.57,58.42
l-1.2,1.24s39.37-23.61,15-53.52c0,0-3.34-6.4-19.49-13,0,0-12.31-4.07-21.85-17.7
```

- Punto de inicio: `(3.09, 94.61)`
- Curva bezier con `s` (smooth) formando el lóbulo
- La hoja se extiende hacia `(37.4, 157.93)` y sube con curb
- Puntos de control no explícitos (sibling relative)

**Hoa 2** — curva derecha, más compacta:

```
M81.75,104.33S48.05,106,55.59,130.08c0,0,3-14.12,16.1-20
a32.4,32.4,0,0,0-12.36,22.28S80,136.7,81.75,104.33
```

- Punto de inicio: `(81.75, 104.33)`
- Lóbulo derecho con arco elíptico (`a`)
- Punto final ~`(81.75, 104.33)` (cierra la forma)

### Pétalos (Rojo — `#E30613`)

**Pétalo 1** — punta superior izquierda:

```
M36.84,9.23A96.66,96.66,0,0,0,24.56,1.59a75.68,75.68,0,0,0-8.08,13.48
a90,90,0,0,1,10.43,2.37,101.75,101.75,0,0,1,9.93-8.21
```

- Arco A grande (radio 96.66) — curva amplia
- Radios de curvatura: 96.66 / 75.68 / 90 / 101.75

**Pétalo 2** — lóbulo medio-derecho:

```
M67.81,42.51a39.22,39.22,0,0,1,2.81,3.14A39.61,39.61,0,0,1,76.92,57V39.82
c0-5.83,1.46-14,4.23-19.59C79,20.11,76,20,75.38,20
a84.18,84.18,0,0,0-29.54,5.34,90.64,90.64,0,0,1,22,17.17
```

- Radio más pequeño (39.22) — pétalo más cerrado
- Conexión a `(76.92, 57)` bajando vertical

**Pétalo 3** — punta superior derecha:

```
M66.59,18.16A115.11,115.11,0,0,0,59.94,0C47.82,3.71,37.55,10.79,29.42,18.2
a90.53,90.53,0,0,1,13.77,5.7,86.87,86.87,0,0,1,23.4-5.74
```

- Radio 115.11 — el pétalo más grande
- Curva que llega hasta `y=0` (tope del viewBox)

**Pétalo 4** — base/mecera central:

```
M67.66,45.74h0a36.48,36.48,0,0,0-2.72-2.69A84.16,84.16,0,0,0,7,20
c-.64,0-3.63.12-5.77.24C4,25.79,5.42,34,5.42,39.82V69.76
a35.76,35.76,0,1,0,62.24-24
```

- Ancla la rosa al centro de la flor
- Radio 36.48 / 84.16
- Conecta con `(5.42, 39.82)` → `(5.42, 69.76)` → cierre circular

---

## 4. Capas y Separación

Las capas están **deliberadamente separadas** para permitir animaciones:

```
ROSE_PARTS = {
  green: ROSE_GREEN_PATHS,   // Hojas — siempre visibles, no se animan
  red: ROSE_RED_PATHS,       // Pétalos — se pueden animar (florecer)
}
```

**Razón de diseño**: Las hojas son la parte "fija" de la marca (verde constante).  
Los pétalos son la parte "viva" — pueden cambiar de opacidad, escala o posición para la animación de florecimiento.

---

## 5. Variantes de Color

| Variante | Navy (#1D2B4F) | Rojo (#E30613) | Verde (#228135) | Uso |
|----------|----------------|----------------|-----------------|-----|
| `full` | ✅ Wordmark | ✅ Pétalos | ✅ Hojas | Fondo claro, navegación |
| `mono` | `currentColor` | `currentColor` | `currentColor` | Fondo oscuro, sello monocromo |

### Cómo cambia el componente:

```tsx
// full
const wordfill = '#1D2B4F';  // navy
const greenFill = '#228135';
const redFill = '#E30613';

// mono
const wordFill = 'currentColor';
const greenFill = 'currentColor';
const redFill = 'currentColor';
```

---

## 6. Aura Violeta — Animación en el Dock

La Rosa en el dock flotante tiene una **animación de respiración** que la hace destacar visualmente.

### Keyframes CSS (`src/app/globals.css:337`)

```css
@keyframes rutaba-rose-glow {
  0%, 100% {
    box-shadow:
      0 6px 20px rgba(139, 92, 246, 0.32),
      0 0 16px rgba(139, 92, 246, 0.22);
  }
  50% {
    box-shadow:
      0 8px 28px rgba(139, 92, 246, 0.55),
      0 0 32px rgba(139, 92, 246, 0.45);
  }
}
```

### Propiedades

| Propiedad | Valor |
|-----------|-------|
| **Color** | `rgba(139, 92, 246)` — violeta (Tailwind violet-500) |
| **Duración** | 3.2 segundos |
| **Easing** | `ease-in-out` |
| **Loop** | Infinito |
| **Efecto** | Sombra que crece y se contrae (respira) |

### Estados

```css
.rutaba-rose-btn {
  animation: rutaba-rose-glow 3.2s ease-in-out infinite;
}

.rutaba-rose-btn[data-active='true'] {
  animation: none;  /* Pausa animación */
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.6),
              0 0 36px rgba(139, 92, 246, 0.5);
  /* Glow fijo cuando está activo */
}

@media (prefers-reduced-motion: reduce) {
  .rutaba-rose-btn {
    animation: none !important;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.32),
                0 0 16px rgba(139, 92, 246, 0.22);
    /* Glow estático, sin movimiento */
  }
}
```

### Dirección de Diseño

> "El violeta es el backlight, la flor conserva sus colores oficiales rojo/verde"

Es decir:
- **Rosa SVG**: colores oficiales (rojo pétalos, verde hojas) — NO cambia
- **Aura**: violeta (`rgba(139, 92, 246)`) — es el "backlight" detrás de la flor
- La rosa NUNCA cambia de color; solo el aura pulsa

---

## 7. Uso en Componentes

### Dock Flotante (`src/components/ui/bottom-nav.tsx`)

```tsx
<button
  className="rutaba-rose-btn"
  data-active={isActive}
  onClick={handleTap}
>
  <MetropolRose className="w-10 h-10" />
</button>
```

- Botón circular centrado en el bottom nav
- Tamaño: 40×40px (`w-10 h-10`)
- Aura violeta respira cuando no está activo
- Glow fijo cuando está seleccionado

### Páginas de Marca

```tsx
<MetropolLogo variant="full" className="h-8" />
// Logo completo con wordmark navy + rosa
```

### Manual de Usuario (`manual_usuario_metropol.md`)

SVG embebido inline en el markdown:
```html
<svg viewBox="0 0 82 178.87" width="41" height="89.44">
  <!-- paths inline -->
</svg>
```

---

## 8. Archivos de Código Fuente

| Archivo | Contenido |
|---------|-----------|
| `src/components/brand/metropol-logo.tsx` | Componentes `MetropolLogo` y `MetropolRose` con todos los paths |
| `src/app/globals.css:334-391` | Keyframes `rutaba-rose-glow` y clases `.rutaba-rose-btn` |
| `src/components/ui/bottom-nav.tsx` | Dock flotante que usa `MetropolRose` + aura |
| `public/metropol-logo.svg` | SVG estático completo (wordmark + rosa) |
| `public/metropol-icon.png` | Versión PNG |

---

## 9. Guía para Recrear en Otro Framework

1. **Copiar los paths** de `ROSE_GREEN_PATHS` y `ROSE_RED_PATHS` tal cual
2. **Mantener viewBox** `0 0 82 178.87` para MetropolRose
3. **Colores oficiales**: Navy `#1D2B4F`, Rojo `#E30613`, Verde `#228135`
4. **Aura**: animación de `box-shadow` con `rgba(139, 92, 246)` — violeta no oficial pero parte del diseño RutaBA
5. **Variantes**: crear `full` (colores) y `mono` (currentColor) para fondos claros/oscuros
6. **Separar hojas de pétalos** en capas distintas para futuras animaciones
7. **Respetar `prefers-reduced-motion`** — desactivar animación de aura
