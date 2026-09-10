# Módulo Mapa en Vivo — Documentación Técnica Completa

> Arquitectura, motor de movimiento, cámara, sprites, capas MapLibre, timeline y sheet.  
> Proyecto: Colectivos AMBA (RutaBA) — Next.js 16 + MapLibre GL JS + Capacitor.

---

## 1. Visión General del Módulo

### Componentes

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| **MapCanvas** | `src/components/features/mapa/map-canvas.tsx` | Mapa en vivo: MapLibre, capas, sprites, interacción, cámara |
| **MapSheet** | `src/components/features/mapa/map-sheet.tsx` | Bottom sheet Uber: búsqueda, líneas, tarjeta del bus, cronograma |
| **RouteTimeline** | `src/components/features/mapa/route-timeline.tsx` | Timeline vertical de paradas con dot vivo del colectivo |
| **MapaPage** | `src/app/mapa/page.tsx` | Página orquestadora: estado, suscripción GPS, selección |
| **LineaPage** | `src/app/linea/[id]/page.tsx` | Detalle de línea con timeline mock |

### Módulos Lib (pure functions, testeables)

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **VehicleMotion** | `src/lib/map/vehicle-motion-engine.ts` | Interpolación/extrapolación por vehículo, dead-reckoning |
| **route-progress** | `src/lib/map/route-progress.ts` | Proyección de posiciones sobre polilínea, paradas ordenadas |
| **camera-controller** | `src/lib/map/camera-controller.ts` | Cálculo de frame de cámara (follow-vehicle, navigation-3D) |
| **vehicle-steer** | `src/lib/map/vehicle-steer.ts` | Rig del eje delantero: suavizado + histéresis a 3 buckets |
| **vehicle-sprites** | `src/lib/map/vehicle-sprites.ts` | Generación SVG: badge, heading, top-down, isométrico, sombra |
| **vehicle-billboard** | `src/lib/map/vehicle-billboard.ts` | Rotación billboard relativa a la cámara |
| **urban-features** | `src/lib/map/urban-features.ts` | Taxonomía de señales urbanas OSM + iconos SVG |

### Mock (simulación GPS)

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **live.ts** | `src/mock/live.ts` | Motor GPS simulado: 1 Hz, polilínea, heading suave |
| **data.ts** | `src/mock/data.ts` | Líneas, paradas, alertas, unidades, rutas |

---

## 2. Motor de Movimiento (`vehicle-motion-engine.ts`)

### Diseño

- **Una instancia por vehículo** (motor puro, sin DOM)
- Consumidores: símbolo, cámara, trail, tarjeta — todos leen LA MISMA posición
- Base de tiempo: epoch ms del feed (misma base que `Date.now()`)

### Estados

```
live → stale (feed demorado >4s) → offline (feed muerto >10s)
```

- `live`: posición interpolada o extrapolada con movimiento
- `stale`: posición extrapolada con heading fijo (dead-reckoning limitado)
- `offline`: último fix congelado (no desaparece, no se mueve)

### Interpolación vs Extrapolación

```
prev ──t── current ──extrapolation──→
  │         │         (máx 1.5s)
  └─ lerp ──┘
```

- **Interpolación** (reloj detrás del feed): `prev → current` con `t = (now - prev.ts) / (current.ts - prev.ts)`
- **Extrapolación** (feed demorado): `pointAhead(current, heading, speed * dt)` con techo de 1.5s

### Detección de Teleports

- Si `distance(current, sample) > 400m` → **snap directo** (sin interpolación)
- Esto evita que el colectivo se "corte" por la ciudad

### Funciones Auxiliares

```typescript
distanceMeters(a, b)     // Distancia equirectangular en metros
headingLerp(from, to, t) // Interpolación angular con wrap-around
pointAhead(lat, lng, heading, meters) // Proyección hacia adelante
```

---

## 3. Simulación GPS (`mock/live.ts`)

### Configuración

```typescript
TICK_INTERVAL_MS = 1000        // 1 Hz (frecuencia GTFS-RT)
SPEED_BASE_KMH = 11            // Velocidad base "paseo"
SPEED_VARIANCE_KMH = 7         // Varianza por vehículo
DELAYED_UNIT_SPEED_KMH = 5     // Unidad retrasada (interno 1234, línea 210)
HEADING_AHEAD_M = 12           // Punto adelante para heading suave
```

### Flujo

1. `buildRouteCache(route)` → precálculo de distancias acumuladas
2. `createVehicle()` → posición inicial aleatoria sobre la ruta
3. `tick()` cada 1s → `advanceVehicle()` mueve cada unidad
4. `subscribeToPositions()` → callbacks filtrados por línea

### Heading Suave

El heading NO es el del segmento actual, sino el **rumbo hacia un punto 12m adelante** en la ruta. Esto produce giros SUAVES en curvas en vez de saltos bruscos.

### Coordenadas Reales

Las 5 líneas mock tienen coordenadas reales de calles de Buenos Aires, ajustadas con OSRM (`scripts/fix-routes-osrm.mjs`). Regenerar con `npm run routes:fix`.

---

## 4. Proyección de Ruta (`route-progress.ts`)

### Funcionamiento

1. Convierte coordenadas `[lng, lat]` a metros locales (proyección equirectangular)
2. Pre calcula segmentos con distancias acumuladas
3. `project(lng, lat)` → encuentra el punto más cercano sobre la polilínea

### API

```typescript
createRouteTrack(coords)       // Crea track con totalM y función project
getRouteTrack(lineId, coords)  // Cacheado por línea
stopsAlongRoute(track, stops)  // Paradas ordenadas por distancia desde inicio
busProgressOn(track, position) // Progreso 0..1 del colectivo vivo
```

### Precisión

- Proyección equirectangular local (≈ metros)
- Suficiente a escala de corredores urbanos (~100m deerror máximo)
- NO es para facturación GPS

---

## 5. Cámara (`camera-controller.ts`)

### Modos

| Modo | Zoom | Pitch | Bearing | Look-ahead |
|------|------|-------|---------|------------|
| `overview` | 10.8 | 0° | 0° | — |
| `follow-user` | 15.6 | 0° | 0° | — |
| `follow-vehicle` | 15.2 | 0° | 0° | 12m |
| `navigation-vehicle` | 16.5–16.9 | 52° | heading | 32–70m (según speed) |
| `free` | — | — | — | — |

### Reglas

- **2D** (`follow-vehicle`): norte arriba, sin pitch, liviano
- **3D** (`navigation-vehicle`): pitch 52°, bearing = heading, look-ahead dinámico
- **El 3D ES SOLO el CTA explícito** "Seguir colectivo en 3D"
- Un gesto manual → modo `free` → CTA de recentrado

---

## 6. Sprites de Vehículos (`vehicle-sprites.ts`)

### Estética

> "La flota es BLANCO PLATEADO de flota real (perlado frío, degradado metálico) y la identidad de línea vive en la franja distintiva"

### Representaciones por Zoom

| Zoom | Sprite | Rotación | Canvas |
|------|--------|----------|--------|
| z < 13.5 | Badge (número + flecha heading) | heading en mapa | 96×96 |
| z 13.4–15.8 | Cenital top-down | heading en mapa | 96×96 |
| z ≥ 14.4 | Isométrico 3/4 | billboard (heading − bearing) | 178×90 |
| z ≥ 14.2 | Sombra | map-aligned | 96×96 |

### Bus Isométrico (`busIsoSvg`)

- Tipo D flat-nose LARGO y ALTO
- **3 variantes**: recto (steer=0), giro izquierda (steer=-1), giro derecha (steer=1)
- Canvas 178×90, cuerpo centrado en (89, 45)
- Capas: techo + lateral izquierdo + frontal
- Detalles: cristal black silver, cartel ámbar, franja del color de línea, espejos, luces

### Bus Cenital (`busTopDownSvg`)

- Vista desde arriba, frente = arriba
- Carrocería perlada fría, franjas laterales del color de línea
- Cristal black silver con pilar, techo gris plateado con nervios

### Rig del Eje Delantero (`vehicle-steer.ts`)

```
steer = -1 (izquierda) | 0 (recto) | 1 (derecha)
```

- Suavizado exponencial de la tasa de giro (deg/s)
- Histéresis: entra a giro >30 deg/s, vuelve a recto <15 deg/s
- Los 3 sprites se pre-bakean y el `icon-image` elige con `match`

---

## 7. Billboard (`vehicle-billboard.ts`)

### Concepto

El sprite isométrico **NO rota en el plano del mapa** (eso causaría que se "de vuelta" al cruzar esquinas). En vez de eso:

- Queda **plano contra la pantalla** (rotation-alignment: viewport)
- **Rota en el plano de pantalla** según `heading − camera.bearing`
- El heading verdadero sobre la calle lo llevan el cenital y la sombra

### Fórmula

```typescript
isoBillboardRotation(heading, camBearing) = heading − camBearing − 90
// -90 porque el arte mira hacia la derecha
```

---

## 8. Capas MapLibre (`map-canvas.tsx`)

### Orden de Capas (de abajo hacia arriba)

1. **Basemap** — CARTO Voyager (light) o Dark Matter (dark)
2. **buildings3d** — fill-extrusion desde source 'carto' (z ≥ 15.4)
3. **route-casing** — borde blanco de las rutas
4. **route-halo-a/b** — halos para pulso (contrafase)
5. **route-line** — línea principal de la ruta
6. **route-flow-tail/head** — corriente animada
7. **route-arrows** — flechas de sentido (symbol-placement: line)
8. **stops** — puntos de paradas
9. **poi-icons/labels** — POIs de OpenStreetMap
10. **signal-icons** — semáforos y PARE (z ≥ 16.2)
11. **crossing-icons** — cruces peatonales (z ≥ 17)
12. **route-stops** — paradas sobre rutas resaltadas
13. **bus-glow** — halo blanco bajo el bus seleccionado
14. **bus-trail** — cometa del seleccionado
15. **bus-shadow** — sombra map-aligned
16. **buses-heading** — badge heading (z < 13.5)
17. **buses-badge** — badge número (z < 13.5)
18. **buses** — cenital (z 13.4–15.8)
19. **buses-iso** — isométrico billboard (z ≥ 14.4)
20. **bus-labels** — etiqueta de línea bajo el bus
21. **user-halo/puck** — ubicación del usuario
22. **planner-*** — origen/destino/parada del planificador

### Pulso de Ruta (Spec #861)

- **Kick**: 650ms easeOutCubic al ganar foco (una línea seleccionada)
- **Breathe**: 1800ms en contrafase entre 2 halos
- Período compartido con el dot "en vivo" de la lista
- **Reduced motion**: halos estáticos, sin RAF

### Corriente en la Ruta (Spec #872)

- 12 fases × 80ms = ciclo de 960ms
- Head + tail: dasharray con 4 segmentos por frame
- Opacidad: head 0.95, tail 0.32
- **Reduced motion**: dash congelado, sin movimiento

### Selección de Bus

- `queryRenderedFeatures` con tolerancia de 14px (tap slop)
- Glow blanco + cámara follow-vehicle
- Trail: cometa de puntos cada 300ms (~16 puntos = 5s)

---

## 9. Theme (Claro/Oscuro)

### Swap de Basemap

```typescript
BASEMAP_LIGHT = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
BASEMAP_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
```

- `setStyle()` con `diff: false` (estilo limpio)
- Todas las capas custom se reinstalan en `style.load`
- La cámara NO se toca tras un swap (el usuario conserva su vista)

### Capas que Cambian

| Capa | Light | Dark |
|------|-------|------|
| buildings3d | `#E4E0D5` opacity 0.85 | `#26304A` opacity 0.95 |
| route-casing | `#FFFFFF` | `#E8ECF2` |
| poi-labels | `#101D3D` halo `#FFFFFF` | `#C9D2DF` halo `#0D1117` |

---

## 10. Bottom Sheet (`map-sheet.tsx`)

### Estados

| Detent | Contenido |
|--------|-----------|
| **collapsed** | Chips de líneas + "Planificar viaje" CTA |
| **medium** | Líneas en vivo + paradas cercanas |
| **expanded** | Tarjeta completa del bus + cronograma |

### Idle → Bus

- **Idle**: buscador + líneas toggle + paradas cercanas con distancia a pie
- **Bus**: mini-fila (peek) + banner de servicio + tarjeta premium + CTA

### Tarjeta Premium del Bus

- Badge de línea + nombre + interno + dirección
- Ocupación (baja/media/alta) por hash determinística del unitId
- Próxima parada + ETA en min (distancia沿route ÷ velocidad)
- Velocidad + señal GPS (en vivo / hace Xs)
- Cronograma RouteTimeline

### Búsqueda

- Filtra por nombre de línea o nombre de parada
- Focus → snap a medium

---

## 11. RouteTimeline (`route-timeline.tsx`)

### Diseño

- Línea vertical: INICIO (círculo) → paradas (dots) → FIN (cuadrado)
- **Fill**: rail de color hasta la posición del bus (proporcional)
- **Dot vivo**: círculo con pulso `rutaba-live-pulse 1.8s`
- Paradas pasadas: atenuadas (opacity 0.6) + check
- Próxima parada: bold

### Accesibilidad

- `role="list"` + `role="listitem"`
- Fila del bus: `aria-hidden` (se actualiza 1 Hz, no debe anunciarse por frame)
- ETA vive en la tarjeta superior, no en el timeline
- `sr-only`: "Parada X de N"

### Auto-scroll

- `scrollIntoView({ block: 'nearest' })` cuando el bus pasa una parada
- Smooth animation (respeta reduced-motion)

---

## 12. Página Mapa (`mapa/page.tsx`)

### Estado

```typescript
positions: VehiclePosition[]           // Feed GPS 1 Hz
selectedRoutes: string[]               // Líneas pintadas (todas al inicio)
selectedVehicleKey: { lineId, unitId }  // Bus seleccionado
cameraMode: CameraMode                 // Modo de cámara
sheetHeight: number                    // Altura quantizada a 24px
sheetDetent: SheetDetent               // collapsed/medium/expanded
showLegend: boolean                    // Panel de leyenda
plannerOpen: boolean                   // Planificador de viaje
```

### Flujo de Selección

1. Tap en bus → `handleBusSelect` → camera follow-vehicle, selectedRoutes = [su línea]
2. Tap en línea del sheet → `handleSelectLine` → fitBounds al recorrido
3. Cerrar → restore ALL_LINE_IDS, camera overview

### Zero SSR Leaks

```typescript
const MapCanvas = dynamic(
  () => import('@/components/features/mapa/map-canvas').then(m => m.MapCanvas),
  { ssr: false, loading: () => <div className="..." /> }
);
```

MapLibre/WebGL/DOM solo en cliente.

---

## 13. POIs Urbanos (`urban-features.ts`)

### Taxonomía

| Tipo | Zoom mínimo | Icono |
|------|-------------|-------|
| `traffic_signal` | 16.2 | Semáforo navy con 3 luces |
| `stop_sign` | 16.2 | Octágono rojo PARE |
| `crossing` | 17.0 | Cebras blancas sobre placa navy |
| `hospital` | 13.6 | Cruz roja sobre círculo blanco |
| `landmark` | 13.6 | Estrella navy sobre círculo blanco |
| `station` | 13.6 | Glifo navy sobre círculo blanco |
| `supermarket` | 13.6 | Carrito navy sobre círculo blanco |
| `place_of_worship` | 13.6 | Iglesia navy sobre círculo blanco |

### Fuente de Datos

- Snapshot offline en `public/data/pois.json`
- Generado por `scripts/fetch-pois.mjs` (Overpass API, build-time)
- Nunca se descarga en runtime (solo en build)
- Si la red falla, el mapa sigue vivo sin capas urbanas

---

## 14. Datos Mock

### Líneas

| ID | Nombre | Color | Dirección | Frecuencia | Unidades |
|----|--------|-------|-----------|------------|----------|
| line-200 | Centro – Sur | `#1D4ED8` | Sur | 15 min | 4 (1234, 0871, 2045, 1892) |
| line-210 | Centro – Oeste | `#FEA619` | Oeste | 10 min | 3 (3012, 3089, 3156) |
| line-215 | Zona Norte | `#006B2C` | Norte | 20 min | 2 (4501, 4578) |
| line-220 | Costanera | `#7C3AED` | Costanera | 25 min | 2 (5601, 5678) |
| line-225 | Aeropuerto – Centro | `#0EA5E9` | Centro | 30 min | 3 (6801, 6878, 6945) |

### Paradas (16 paradas mock)

Av. Corrientes y Belgrano, Diagonal Norte y Maipú, Pje. Castelli y Av. Cabildo, Terminal Central, Av. de Mayo y Perú, Plaza de Mayo, Av. Corrientes y Callao, Av. Rivadavia y Once, Av. Cabildo y Congreso, Av. del Libertador y Sarmiento, Costanera Norte y Juana Manilio, Puerto Madero y Rosario Vera, Autopista Ricchieri y Ezeiza, Terminal.ReadLineal, Av. San Martín y Perdriel, Av. Maipú y Córdoba.

### Alertas

- Retraso en Línea 200 (obra Av. 9 de Julio)
- Retraso en Línea 210 (obra Av. 9 de Julio)
- Línea 225 suspendida (corte acceso aeropuerto)
- Línea 220 cambio de recorrido (evento Costanera)
- Línea 215 normalizada

---

## 15. Dependencias

| Paquete | Uso |
|---------|-----|
| `maplibre-gl` | Mapa vectorial WebGL |
| `motion/react` | Animaciones React (AnimatePresence, useReducedMotion) |
| `next/dynamic` | SSR:false para MapLibre |

### Basemap

- **Light**: CARTO Voyager GL Style (gratis, sin API key)
- **Dark**: CARTO Dark Matter GL Style
- OpenFreeMap evaluado y descartado (tiles vacíos para BA)

---

## 16. Archivos del Módulo

```
src/
├── app/
│   ├── mapa/page.tsx                    # Página principal del mapa
│   └── linea/[id]/page.tsx              # Detalle de línea
├── components/features/mapa/
│   ├── map-canvas.tsx                   # Mapa MapLibre (1822 líneas)
│   ├── map-sheet.tsx                    # Bottom sheet Uber (693 líneas)
│   └── route-timeline.tsx               # Timeline de paradas (186 líneas)
├── lib/map/
│   ├── vehicle-motion-engine.ts         # Motor de movimiento (176 líneas)
│   ├── route-progress.ts                # Proyección sobre ruta (138 líneas)
│   ├── camera-controller.ts             # Frame de cámara (56 líneas)
│   ├── vehicle-steer.ts                 # Rig eje delantero (46 líneas)
│   ├── vehicle-sprites.ts               # Generación SVG (216 líneas)
│   ├── vehicle-billboard.ts             # Rotación billboard (30 líneas)
│   └── urban-features.ts                # Taxonomía OSM (122 líneas)
└── mock/
    ├── live.ts                          # GPS simulado (252 líneas)
    └── data.ts                          # Datos mock (294 líneas)
```

---

## 17. Mejoras Sugeridas (para Gemini)

### Performance

1. **Web Workers** para VehicleMotion (actualmente corre en el hilo principal)
2. **Instancing** para buses idénticos (reducir draw calls)
3. **Lazy load** de POIs urbanos (solo cuando el zoom lo requiere)
4. **Throttle** del trail a 200ms en vez de 300ms (menos puntos, misma estética)

### Funcionalidad

5. **GTFS-RT real** reemplazando el mock (WebSocket o polling)
6. **Schedule display** con horarios reales de cada parada
7. **Route comparison** (dos líneas lado a lado)
8. **Stop details** con fotos, accesibilidad, conexiones
9. **Traffic overlay** (Google/HERE)
10. **Multi-language** (i18n para turistas)

### UX

11. **Haptic feedback** en selección de bus (Capacitor Haptics)
12. **Offline caching** de tiles y POIs (Service Worker)
13. **Share bus location** (deep link con posición en tiempo real)
14. **Accessibility audit** con Lighthouse

### Código

15. **Separar MapCanvas en sub-componentes** (routes, buses, user-location, planner)
16. **Extraer constants** a un archivo dedicado (zooms, thresholds, timings)
17. **Testing** de VehicleMotion con jest (mock timestamps)
18. **Storybook** para sprites SVG (visual regression)

---

## 18. Guía para Recrear en Gemini

1. **Copiar TODO el directorio `src/lib/map/`** — módulos puros sin dependencias React
2. **Copiar `src/mock/live.ts` y `src/mock/data.ts`** — simulación GPS
3. **Copiar `src/components/features/mapa/`** — componentes React
4. **Copiar `src/app/mapa/page.tsx`** — orquestador
5. **Instalar dependencias**: `maplibre-gl`, `motion/react`
6. **Configurar basemap**: CARTO Voyager/Dark Matter (gratis, sin API key)
7. **Ajustar center** a la ciudad objetivo (default: Obelisco BA)
8. **Generar routes.json** con polilíneas reales (OSRM o similar)
9. **Adaptar tokens** de colores y fleet colors al nuevo diseño
10. **Probar reduced motion** — toda la app lo respeta
