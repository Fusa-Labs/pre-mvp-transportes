# HANDOFF — Módulos `/` y `/home` → pre-mvp-transportes

> **A quién va dirigido:** agente de IA + servidor **MCP filesystem** del proyecto **pre-mvp-transportes** (otro agente ya está trabajando en esa ruta).
> **Objetivo:** adaptar e implementar el módulo **Landing (`/`)** y el módulo **Home (`/home`)** en el destino, integrando branding Metropol, `metropol-handoff.zip` y `METROPOL-ROSA-DESIGN.md`.
> **Método obligatorio:** **paso a paso con verificación al final de cada paso**. No arranques el siguiente paso hasta que la checklist del actual pase al 100%.

---

## 0. Contexto y mapeo de rutas

| Rol | Origen (colectivos-amba) | Destino (pre-mvp-transportes) |
|-----|--------------------------|-------------------------------|
| Landing / puerta de entrada | `src/app/page.tsx` → ruta `/` | `/` |
| Home / dashboard de la app | `src/app/inicio/page.tsx` → ruta `/inicio` | **`/home`** (convención del nuevo pre-MVP) |

**Nota para el agente destino:** en el repo origen la home se llama `/inicio`. Acá la tratamos como **`/home`**. Si el destino ya tiene un router o path prefix propio, adaptá el path; no dupliques la pantalla.

### Restricciones (no negociables)

1. **NDA** — imágenes, `metropol.json` y narrativa Metropol son confidenciales. No los expongas en repos públicos, logs ni prompts de tools externas.
2. **No renombres** rutas de imagen referenciadas en `metropol.json` (`lines[].image`, `flota[].src`). Si el destino usa otra estructura de `public/`, ajustá el JSON completo, no archivos a medias.
3. **No modifiques** el contrato de tipos `FleetPhoto { src, title, caption }` sin actualizar el JSON.
4. **Preservá variantes del logo:** `full` = fondo claro; `mono` + `text-*` = fondo oscuro. No unifiques a una sola.
5. **Respeta convenciones ya existentes** en pre-mvp-transportes (naming, alias de paths, capas). Si difieren del origen, adaptá los imports al destino — no el código al revés.
6. **No corras build** al final de los pasos salvo que el humano lo pida. Verificá con lint/typecheck/dev según corresponda.

---

## 1. Inventario de assets a implementar

### 1.1 `metropol-handoff.zip` (raíz del repo origen)

Descomprimí primero. Estructura esperada:

```
metropol-handoff/
├── 01-brand/
│   ├── metropol-logo.tsx
│   ├── fleet-carousel.tsx
│   ├── metropol-logo.svg
│   └── metropol-icon.png
├── 02-data/metropol.json
├── 03-styles/liberty-pinned.json
├── 04-images/flota/     (3 fotos)
├── 04-images/lineas/    (26 fotos)
├── 05-reference/
│   ├── LA-NUEVA-METROPOL.md
│   ├── METROPOL-ROSA-DESIGN.md
│   └── usos-logo.md
├── README.md
├── AGENTE.md
└── IMPLEMENTACION-MCP.md
```

### 1.2 Branding suelto (raíz / src del origen)

| Archivo origen | Rol en destino |
|----------------|----------------|
| `public/metropol-logo.svg` | Logo estático (favicon, OG, docs) |
| `public/metropol-icon.png` | Icono 192×192 con transparencia |
| `src/components/brand/metropol-logo.tsx` | Componentes React `MetropolLogo` + `MetropolRose` |
| `METROPOL-ROSA-DESIGN.md` | Spec de paths SVG, capas, aura violeta |
| `metropol-handoff/05-reference/usos-logo.md` | Reglas full/mono (si no está descomprimido, está dentro del ZIP) |

### 1.3 Módulos a portar

| Módulo | Archivo origen | Archivos de soporte |
|--------|----------------|---------------------|
| **`/` Landing** | `src/app/page.tsx` | `MetropolLogo`, `MetropolRose`, CTAs a home y a techo Metropol |
| **`/home`** (origen `/inicio`) | `src/app/inicio/page.tsx` | `BottomNav`, `ArrivalCard`, `LineBadge`, `HorariosButton`, `useFavorites`, `MOCK_*` |
| Doc de referencia home | `docs/home-documentation.md` | Arquitectura, checklist, tokens MD3, animaciones |
| Doc de referencia rosa | `METROPOL-ROSA-DESIGN.md` | viewBox, capas green/red, aura `rutaba-rose-glow` |

---

## 2. Requisitos previos (verificar ANTES del paso 1)

```
[ ] App Router Next.js (origen: Next 16 / React 19) — o equivalente destino
[ ] TypeScript
[ ] Tailwind (v4 preferido; v3 con tokens equivalentes)
[ ] Path alias @/ (o se reescriben imports a ~/ etc.)
[ ] Material Symbols Outlined cargado en layout
[ ] Acceso MCP: list_directory / read_file / write_file (+ shell para binarios)
[ ] Directorios source (handoff descomprimido) y target permitidos en el MCP
[ ] El agente de pre-mvp-transportes no está a mitad de un write sobre las mismas rutas
```

**Si falta Material Symbols:** las landing/home usan íconos (`directions_bus`, `notifications`, `location_on`…). Sin la fuente se ven cajas vacías.

**Si faltan tokens MD3** (`bg-surface-container-*`, `text-on-surface*`, `border-outline-variant`, `bg-primary`…): o los agregás al tema Tailwind del destino o reemplazás según la tabla de `README.md` del handoff §5.

---

## 3. Orden de implementación — PASO A PASO CON VERIFICACIÓN

> **Regla de oro:** cada paso termina con una **checklist de verificación**. Si algo falla, **no adivines**: volvé al archivo de origen o a `AGENTE.md` / `IMPLEMENTACION-MCP.md` del ZIP. Recién con todo en `[ ]` pasás al siguiente paso.

---

### PASO 1 — Assets binarios (branding + fotos)

**Acción:**

```bash
# desde la raíz del proyecto destino (pre-mvp-transportes)
mkdir -p public/images/metropol/flota \
         public/images/metropol/lineas \
         public/styles \
         src/components/brand \
         src/data \
         src/app \
         src/app/home

# branding estático
cp /ruta/metropol-handoff/01-brand/metropol-logo.svg public/
cp /ruta/metropol-handoff/01-brand/metropol-icon.png public/

# fotos (NDA — solo en el repo privado del destino)
cp /ruta/metropol-handoff/04-images/flota/*   public/images/metropol/flota/
cp /ruta/metropol-handoff/04-images/lineas/*  public/images/metropol/lineas/

# style de mapa (opcional pero recomendado si el destino ya tiene mapa)
cp /ruta/metropol-handoff/03-styles/liberty-pinned.json public/styles/
```

Las imágenes **no** se copian con `write_file` de texto. Usá shell o MCP con binario/base64.

**✅ Verificación Paso 1:**

```
[ ] ls public/metropol-logo.svg  → existe (~3.5 KB)
[ ] ls public/metropol-icon.png  → existe (~6 KB)
[ ] ls public/images/metropol/lineas | wc -l  → 26
[ ] ls public/images/metropol/flota  | wc -l  → 3
[ ] du -sh public/images/metropol  → ~7 MB (si da mucho menos, falta copia)
[ ] ls public/styles/liberty-pinned.json → existe
```

---

### PASO 2 — Datos Metropol

**Acción:**

| Source | Target |
|--------|--------|
| `02-data/metropol.json` | `src/data/metropol.json` |

Copia **verbatim** (`read_file` → `write_file`), sin reindentar ni "mejorar".

**✅ Verificación Paso 2:**

```
[ ] python -c "import json; json.load(open('src/data/metropol.json'))"  → sin error
[ ] Snippet: todos los lines[].image y flota[].src existen bajo public/

python - <<'PY'
import json, os
d = json.load(open("src/data/metropol.json", encoding="utf-8"))
missing = []
for line in d["lines"]:
    p = "public" + line["image"]
    if not os.path.exists(p): missing.append(p)
for f in d["flota"]:
    p = "public" + f["src"]
    if not os.path.exists(p): missing.append(p)
print("missing:", missing or "OK — 29/29")
PY
```

---

### PASO 3 — Brand components (logo + rosa + carrusel)

**Acción:**

| Source | Target |
|--------|--------|
| `01-brand/metropol-logo.tsx` | `src/components/brand/metropol-logo.tsx` |
| `01-brand/fleet-carousel.tsx` | `src/components/brand/fleet-carousel.tsx` |

Si el destino no tiene `src/components/brand/`, creala. Ajustá solo el alias de imports si difiere (`@/` → `~/`).

**Contrato de marca (no romper):**

```tsx
import { MetropolLogo, MetropolRose, METROPOL_COLORS, ROSE_PARTS } from '@/components/brand/metropol-logo';

// Fondo claro
<MetropolLogo className="h-9" />

// Fondo oscuro
<MetropolLogo variant="mono" className="h-9 text-white" />

// Solo rosa (viewBox 0 0 82 178.87 → siempre h-* + w-auto)
<MetropolRose className="h-6 w-auto" />
```

Paleta oficial inmutable: navy `#1D2B4F`, rojo `#E30613`, verde `#228135`.

**✅ Verificación Paso 3:**

```
[ ] Los 2 .tsx existen en src/components/brand/
[ ] tsc --noEmit (o typecheck del destino) → 0 errores nuevos en esos archivos
[ ] Exportados: MetropolLogo, MetropolRose, METROPOL_COLORS, ROSE_PARTS
[ ] variant 'full' | 'mono' presente en ambos componentes
[ ] viewBox logo full = "0 0 719.16 178.87"; rose = "0 0 82 178.87"
[ ] ROSE_PARTS.green y .red son arrays separados (capas animables)
```

---

### PASO 4 — Docs de diseño y branding en el destino

**Acción:** copiar docs de referencia (no runtime) a `docs/metropol/` (o donde el destino guarde specs):

| Source | Target sugerido |
|--------|-----------------|
| Raíz origen `METROPOL-ROSA-DESIGN.md` (o `05-reference/…` del ZIP) | `docs/metropol/METROPOL-ROSA-DESIGN.md` |
| `05-reference/usos-logo.md` | `docs/metropol/usos-logo.md` |
| `05-reference/LA-NUEVA-METROPOL.md` | `docs/metropol/LA-NUEVA-METROPOL.md` |
| `docs/home-documentation.md` del origen | `docs/metropol/home-documentation.md` |
| Este archivo (`HANDOFF-LANDING-HOME-MCP.md`) | `docs/metropol/HANDOFF-LANDING-HOME-MCP.md` |

El agente **debe leer** `METROPOL-ROSA-DESIGN.md` antes de tocar animaciones de la rosa (dock/aura). Spec clave:

- Capas separadas: hojas verdes fijas + pétalos rojos animables.
- Aura dock: `@keyframes rutaba-rose-glow` con `rgba(139, 92, 246)`, 3.2s ease-in-out infinite.
- La rosa **nunca** cambia de color; solo pulsa el aura violeta.
- Respetar `prefers-reduced-motion`.

**✅ Verificación Paso 4:**

```
[ ] docs/metropol/METROPOL-ROSA-DESIGN.md existe y es legible
[ ] docs/metropol/usos-logo.md existe
[ ] El agente puede citar de memoria: full vs mono, hex oficiales, viewBox rose
[ ] home-documentation.md copiado (o referenciado) para el módulo /home
```

---

### PASO 5 — CSS base del destino (tokens, Material, animaciones)

**Acción:** parchear `layout` y `globals.css` (o equivalentes del destino) **solo si faltan**:

1. Link Google Fonts: Plus Jakarta Sans + Material Symbols Outlined.
2. Tokens MD3 usados por landing/home (ver §2 y home-documentation).
3. Utilidad `.no-scrollbar` si se usa el carrusel Metropol.
4. Keyframes mínimos para home/landing:
   - `rutaba-live-pulse` (punto EN VIVO)
   - `rutaba-shine` / `rutaba-drive` (CTA Horarios)
   - `rutaba-rose-glow` (aura dock — spec en METROPOL-ROSA-DESIGN)

**✅ Verificación Paso 5:**

```
[ ] grep Material Symbols en layout del destino → link presente
[ ] grep "Plus Jakarta Sans" (o fuente equivalente acordada) → presente
[ ] grep "rutaba-rose-glow" en CSS global → presente
[ ] grep "rutaba-shine" y "rutaba-drive" → presentes (o decidiste portar HorariosButton sin animación y lo anotaste)
[ ] Tokens: bg-surface*, text-on-surface*, border-outline-variant resuelven (no clases muertas)
[ ] .no-scrollbar definida si el carrusel se usa
```

---

### PASO 6 — Dependencias del módulo Home (componentes + hook + mocks)

**Acción:** copiar/adaptar el subárbol que `/home` (origen `/inicio`) necesita:

| Source origen | Target destino (sugerido) |
|---------------|---------------------------|
| `src/components/ui/bottom-nav.tsx` | `src/components/ui/bottom-nav.tsx` |
| `src/components/ui/arrival-card.tsx` | `src/components/ui/arrival-card.tsx` |
| `src/components/ui/line-badge.tsx` | `src/components/ui/line-badge.tsx` |
| `src/components/ui/horarios-button.tsx` | `src/components/ui/horarios-button.tsx` |
| `src/hooks/use-favorites.ts` | `src/hooks/use-favorites.ts` |
| `src/mock/data.ts` (o capa `data-service` si el destino ya la tiene) | según arquitectura destino |

**Regla de arquitectura del origen (mantener si aplica):**

- Si el destino ya tiene un `data-service` / capa de datos: **no** importes mock directo en pages; consumí por esa capa (patrón RutaBA).
- Mocks **deterministas** (sin `Math.random()` en render).
- Persistencia de favoritos: `localStorage` + `useSyncExternalStore` (key tipo `rutaba_favoritos` o la del destino).

**BottomNav — 5 destinos:** `/home` (casa) · líneas · QR central elevado · mapa · perfil. Si el destino aún no tiene esas rutas, dejá los href preparados y un TODO, no rompas el dock.

**✅ Verificación Paso 6:**

```
[ ] Todos los imports de home-documentation §"Dependencias" resuelven
[ ] useFavorites sin errores de tipo; API: favorites, isFavorite, add, remove, toggle
[ ] BottomNav renderiza sin crash (aunque algunas rutas destino aún no existan)
[ ] LineBadge / ArrivalCard / HorariosButton montables de forma aislada
[ ] typecheck → 0 errores nuevos
```

---

### PASO 7 — Implementar módulo Landing `/`

**Acción:** portar `src/app/page.tsx` del origen a la ruta `/` del destino.

**Qué debe conservar (identidad del módulo):**

1. Hero con gradiente navy (`#0B1730` → `#0E2B7A` → `#1D4ED8`).
2. `MetropolRose` en contenedor glass + sello “Un proyecto de” + `MetropolLogo variant="mono" text-white`.
3. CTA primario → **home del destino** (origen: `router.push('/inicio')` → destino: **`/home`**).
4. CTA secundario → techo Metropol (`/metropol`) **solo si** esa ruta existe en el destino; si no, ocultá el botón o dejalo deshabilitado con TODO.
5. Grid de 4 features (tiempo real, QR, alertas, favoritas).
6. Teaser card Metropol (opcional si el módulo `/metropol` no está en scope del pre-MVP).
7. CTA “Probá la demo” → `/home`.
8. Footer con logo + créditos Grupo Metropol.

**Adaptaciones permitidas:** copy de marca del pre-MVP, links a rutas que existan, tokens de color si el design system destino difiere (documentá la diff).

**✅ Verificación Paso 7:**

```
[ ] Ruta / renderiza sin error de runtime
[ ] MetropolRose visible en el hero (no 0×0, no color fantasma)
[ ] Logo mono legible sobre el gradiente (contraste OK)
[ ] CTA principal navega a /home
[ ] CTA demo navega a /home
[ ] 0 requests 404 a assets públicos en esa página
[ ] typecheck + lint del destino → 0 errores nuevos
[ ] Respeta prefers-reduced-motion si hay micro-animaciones
```

---

### PASO 8 — Implementar módulo Home `/home`

**Acción:** portar `src/app/inicio/page.tsx` → ruta **`/home`** del destino.

**Secciones obligatorias (orden del origen):**

1. **Header sticky** — `MetropolRose` + saludo “Hola 👋” + fecha `es-AR` + campana de alertas con badge real (`status !== 'resolved'`).
2. **Hero llegada destacada** — gradiente `#0E2B7A` → `#1D4ED8`, ETA grande, pill “EN VIVO” con punto verde pulsante. Solo si hay favoritos.
3. **Tus paradas** — lista de favoritos → por parada: `LineBadge` + `ArrivalCard` (ETA mock determinista + refreshKey) + CTA “Ver todas las llegadas”.
4. **Empty state** — “Sin paradas guardadas” + CTA a mapa/buscar.
5. **Actualizar** — muestra hora + botón que incrementa `refreshKey`.
6. **Agregar parada** — CTA secundario full-width.
7. **HorariosButton** — CTA animado a horarios (si la ruta aún no existe en el destino, dejá el componente y el href TODO).
8. **Alertas** — primer incidente activo + link “Ver todas” + estado “Sin alertas activas”.
9. **BottomNav** — dock flotante con rosa central.

**Flujo de datos (mantener):**

```
useFavorites (localStorage) → favorites.stopIds
        ↓
MOCK_STOPS ∩ favorites → stops[{ stop, arrivals[{ line, etaMin, live }] }]
        ↓
hero (stops[0].arrivals[0]) + lista + alertas activas
```

Si el destino tiene capa de datos propia, reemplazá `MOCK_*` por esa capa **sin cambiar la forma de las secciones UI**.

**✅ Verificación Paso 8:**

```
[ ] Ruta /home renderiza sin crash con 0 favoritos (empty state OK)
[ ] Con favoritos de prueba: hero + cards + badges ven bien
[ ] Campana muestra contador real de alertas activas (o 0)
[ ] Botón Actualizar regenera ETAs (refreshKey)
[ ] BottomNav: ítem home activo; safe-area respetada
[ ] Rosa del dock usa spec de METROPOL-ROSA-DESIGN (aura violeta, no recolorea la flor)
[ ] prefers-reduced-motion → aura/shine sin loop
[ ] typecheck + lint → 0 errores nuevos
[ ] 0 requests 404 (imágenes, icons, fonts)
```

---

### PASO 9 — Integración branding transversal + handoff residual

**Acción:**

1. Asegurar que landing y home usan **solo** componentes de `src/components/brand/` (no SVGs pegados a mano en pages).
2. Favicon / manifest / OG: `public/metropol-icon.png` + `public/metropol-logo.svg`.
3. Si el destino tendrá módulo `/metropol` más adelante: dejar `fleet-carousel.tsx` + `metropol.json` ya cableados (Paso 2–3) aunque la page todavía no exista.
4. Archivos `05-reference/*` **no** entran al runtime.
5. NDA: confirmar que `public/images/metropol/**` y `metropol.json` **no** se suben a un repo público.

**✅ Verificación Paso 9:**

```
[ ] grep -r "MetropolLogo\|MetropolRose" src/app  → no hay SVG inline duplicado en pages
[ ] favicon/OG apuntan a assets metropol
[ ] fleet-carousel + metropol.json en lugar correcto (listos para /metropol futuro)
[ ] git status → no hay secretos ni paths NDA fuera de private
[ ] Inventario ZIP: 41 archivos ubicados o excluidos con criterio (05-reference = docs)
```

---

### PASO 10 — Cierre: smoke test manual del flujo

**Acción:** recorrer el camino feliz de usuario en el destino.

```
1. Abrir /
2. Leer hero + branding → sensación Metropol correcta
3. Tap "Entrar al demo" (o CTA primario) → cae en /home
4. /home vacío → empty state → "Buscar parada" (o TODO visible y explícito)
5. /home con favoritos → hero ETA + lista + alertas + dock
6. Tap rosa del dock / items de navegación → no crash en rutas faltantes (TODO ok)
7. Cambiar a dark mode si el destino lo soporta → logo mono vs full correcto
```

**✅ Verificación Paso 10 (Definition of Done):**

```
[ ] / y /home compilan y navegan entre sí
[ ] Branding full/mono correcto en ambos fondos
[ ] 26+3 imágenes y JSON OK (pasos 1–2)
[ ] Rosa respeta spec (viewBox, capas, aura, reduced-motion)
[ ] lint + typecheck destino en verde (sin build obligatorio)
[ ] Docs en docs/metropol/ para el siguiente agente
[ ] TODOs de rutas faltantes marcados en código, no escondidos
[ ] NDA intacto
```

---

## 4. Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Íconos como cuadrados | Falta Material Symbols | Link + clase en layout |
| Logo invisible | `full` en fondo oscuro / `mono` sin `text-*` | Tabla de `usos-logo.md` |
| Imágenes 404 | Rutas del JSON ≠ `public/` real | Editar JSON completo o copiar respetando `/images/metropol/...` |
| Home rota al instalar | Faltan UI deps (ArrivalCard, BottomNav…) | Completar Paso 6 antes del Paso 8 |
| Rosa "deformada" | Estiraron con `w-full h-auto` | Siempre `h-*` + `w-auto`, respetar viewBox |
| Aura gris o azul | Cambiaron hex del glow | Solo `rgba(139, 92, 246)` en el aura; flor rojo/verde oficiales |
| CTA Home muere | Todavía apunta a `/inicio` | Reescribir a `/home` en Paso 7–8 |
| Collisión con otro agente | Escritura concurrente en mismas rutas | Coordinar con el agente de pre-mvp-transportes antes del Paso 7 |
| Mocks no deterministas | `Math.random()` en render | Exportar helpers puros (patrón `hashOf` del origen) |

---

## 5. Orden resumido para el MCP

```
0. Requisitos previos + permisos MCP (source = handoff descomprimido, target = pre-mvp-transportes)
1. binarios → public/          ✅ verificar conteos y tamaños
2. metropol.json → src/data/   ✅ JSON válido + 29/29 paths
3. brand/*.tsx                 ✅ exports + typecheck
4. docs (rosa, usos-logo, home-doc) ✅ legibles
5. layout + CSS tokens/keyframes    ✅ greps
6. deps home (ui + hooks + data)    ✅ imports resueltos
7. page / (landing) → CTA a /home   ✅ render + links
8. page /home                        ✅ empty/full/reduced-motion
9. branding transversal + NDA        ✅ sin SVG duplicados
10. smoke test E2E                   ✅ DoD completo
```

**Después de cada `✅`: recién ahí avanzá.** Si un check queda en `[ ]`, rollback o pedí ayuda — no saltes pasos.

---

## 6. Referencias internas (abrir si dudás)

- `AGENTE.md` + `IMPLEMENTACION-MCP.md` (dentro de `metropol-handoff.zip`) — flujo MCP genérico y errores.
- `METROPOL-ROSA-DESIGN.md` — spec exacta de la rosa y aura.
- `usos-logo.md` — full vs mono, do's and don'ts.
- `docs/home-documentation.md` (origen) — arquitectura home, componentes, tokens, checklist de replicación.
- `FUSALABS-AGENT-CONTEXT.md` (origen) — reglas de oro del repo fuente (data-service, mocks, commits).

---

*Handoff generado para el agente MCP de pre-mvp-transportes — septiembre 2026.*
*Metódica: implementación incremental con verificación obligatoria por paso.*
