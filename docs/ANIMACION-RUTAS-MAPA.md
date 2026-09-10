# Colectivos AMBA — Motor de Animación GPS sobre Polilíneas

Detalle técnico del sistema de movimiento de colectivos en el mapa: simulación GPS, interpolación, heading, proyección y cámara.

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                   MOTOR DE ANIMACIÓN                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────────┐               │
│  │  mock/live.ts │───▶│ vehicle-motion-  │               │
│  │  (GPS Sim)    │    │ engine.ts        │               │
│  │  1 Hz tick    │    │ (interpolación)  │               │
│  └──────────────┘    └────────┬─────────┘               │
│                               │                          │
│                    ┌──────────▼──────────┐               │
│                    │   MapCanvas/MapLibre │               │
│                    │   (render 60fps)     │               │
│                    └──────────┬──────────┘               │
│                               │                          │
│              ┌────────────────┼────────────────┐        │
│              │                │                │        │
│    ┌─────────▼─────┐ ┌───────▼───────┐ ┌──────▼──────┐ │
│    │ route-progress │ │camera-control │ │  Vehicle3D  │ │
│    │ (proyección)   │ │ (seguimiento) │ │ (símbolo)   │ │
│    └───────────────┘ └───────────────┘ └─────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Motor GPS Simulado (`src/mock/live.ts`)

Simula posiciones GPS en tiempo real para la maqueta. Los vehículos **SIEMPRE** viajan sobre la polilínea (sin ruido GPS aleatorio).

### Constantes

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `TICK_INTERVAL_MS` | 1000 ms | Frecuencia de emisión (1 Hz, como GTFS-RT real) |
| `SPEED_BASE_KMH` | 11 km/h | Velocidad base "paseo" |
| `SPEED_VARIANCE_KMH` | 7 km/h | Varianza aleatoria (rango real: 4–18 km/h) |
| `DELAYED_UNIT_SPEED_KMH` | 5 km/h | Velocidad de unidad retrasada (simula congestión) |
| `HEADING_AHEAD_M` | 12 metros | Distancia adelante para calcular heading suave |

### Flujo por tick (1 Hz)

```
1. Para cada vehículo:
   a. Calcular metros este tick: speed_km/h ÷ 3.6 = metros_por_segundo
   b. Sumar a distanceTraveled (acumulador circular)
   c. Buscar segmento en la polilínea
   d. Interpolar posición dentro del segmento (lerp)
   e. Calcular heading hacia punto 12m adelante

2. Emitir array de VehiclePosition[] a todos los suscriptores
```

### Funciones clave

```typescript
// Distancia euclidiana equirectangular (≈ metros)
function distanceMeters(a: [number, number], b: [number, number]): number

// Rumbo 0-360° de un punto hacia otro
function bearingDeg(from: [number, number], to: [number, number]): number

// Interpolación lineal
function lerp(a: number, b: number, t: number): number

// Precálculo de la ruta (distancias acumuladas)
function buildRouteCache(route: [number, number][]): RouteCache

// Posición en la polilínea a X metros del inicio
function positionAtDistance(cache: RouteCache, dist: number): { lng, lat }

// Heading suave (rumbo hacia punto 12m adelante)
function headingAtDistance(cache: RouteCache, dist: number): number

// Avanzar vehículo un tick
function advanceVehicle(state: VehicleState): VehicleState
```

### RouteCache (precálculo)

```typescript
interface RouteCache {
  points: [number, number][];    // Coordenadas de la polilínea
  segmentBearings: number[];     // Bearings de cada segmento
  cumLength: number[];           // Distancia acumulada por vértice
  totalLength: number;           // Distancia total de la ruta
}
```

### API pública

```typescript
// Suscribirse a feed 1 Hz (retorna unsubscribe)
subscribeToPositions(lineIds: string[], cb: (positions: VehiclePosition[]) => void): Unsubscribe

// Obtener posiciones actuales (para tests)
getCurrentPositions(): VehiclePosition[]
```

### Comportamiento especial

- **Unidad retrasada**: unidad `1234` de línea `210` tiene velocidad fija de 5 km/h
- **Circuito cerrado**: `positionAtDistance` usa módulo sobre `totalLength` → loop infinito
- **Primer tick inmediato**: se ejecuta `tick()` una vez al suscribir (no espera 1s)

---

## 2. Vehicle Motion Engine (`src/lib/map/vehicle-motion-engine.ts`)

Módulo puro (sin DOM, sin MapLibre) que consume los ticks del feed GPS y produce frames renderizables a 60fps.

### Estados del feed

```
         ┌──────────┐    4s sin fixes    ┌──────────┐    10s sin fixes    ┌──────────┐
         │   LIVE   │ ─────────────────▶ │  STALE   │ ──────────────────▶ │ OFFLINE  │
         │          │ ◀───────────────── │          │ ◀────────────────── │          │
         └──────────┘    fix nuevo       └──────────┘    fix nuevo       └──────────┘
                                                                  (congela último fix)
```

| Estado | Significado | Comportamiento |
|--------|-------------|----------------|
| `live` | Fix reciente (< 4s) | Interpolación/extrapolación normal |
| `stale` | Feed demorado (4–10s) | Dead-reckoning corto, heading fijo |
| `offline` | Feed muerto (> 10s) | Congela último fix (no desaparece) |

### Clase VehicleMotion

```typescript
class VehicleMotion {
  constructor(options?: VehicleMotionOptions)

  // Último fix crudo del feed (verdad)
  get fix(): MotionSample | null

  // Ingresar nuevo fix (descarta muestras atrasadas)
  push(sample: MotionSample): void

  // Posición renderizada en el instante `now` (epoch ms)
  frame(now: number): MotionFrame | null
}
```

### Opciones

```typescript
interface VehicleMotionOptions {
  staleMs?: number;           // Default: 4000 (4s → stale)
  offlineMs?: number;         // Default: 10000 (10s → offline)
  maxExtrapolationMs?: number; // Default: 1500 (techo dead-reckoning)
  teleportMeters?: number;    // Default: 400 (salto imposible → snap)
}
```

### Algoritmo de frame(now)

```
1. Si no hay fix → null
2. Reloj monotónico interno (nunca rebobina)
3. Calcular age = now - fix.timestamp
4. Determinar status: live / stale / offline
5. Si offline → devolver último fix (congelado)
6. Si now < fix.timestamp:
   → Reloj detrás del feed: interpolar prev→current (lerp)
7. Si now > fix.timestamp:
   → Feed demorado: dead-reckoning limitado
   → meters = (speed / 3.6) × (over_ms / 1000)
   → pointAhead(lat, lng, heading, meters)
   → Techo: maxExtrapolationMs (default 1500ms)
```

### Detección de teleports

```typescript
push(sample: MotionSample): void {
  // Si salto > 400m entre fixes consecutivos:
  //   → NO interpolar (atravesaría manzanas)
  //   → Snap directo (jumped: true en frame)
  //   → Descarta prev (null)
}
```

### Frame renderizado

```typescript
interface MotionFrame {
  lng: number;
  lat: number;
  heading: number;
  speed: number;
  status: MotionStatus;      // 'live' | 'stale' | 'offline'
  extrapolated: boolean;     // true si va más allá del último fix
  jumped: boolean;           // true si reconcilió un teleport
}
```

### Utilidades internas

```typescript
// Heading con lerp circular (corta por 180°)
function headingLerp(from: number, to: number, t: number): number

// Proyectar punto hacia adelante por heading + distancia
function pointAhead(lat, lng, headingDeg, meters): { lat, lng }
```

---

## 3. Proyección sobre Polilínea (`src/lib/map/route-progress.ts`)

Convierte la polilínea de una línea en un "track" con distancias acumuladas. Permite proyectar cualquier punto a "metros desde el inicio" y progreso 0..1.

### API

```typescript
// Crear track desde coordenadas
createRouteTrack(coords: [number, number][]): RouteTrack | null

// Track cacheado por línea
getRouteTrack(lineId: string, coords: [number, number][]): RouteTrack | null

// Paradas ordenadas por distancia desde el inicio
stopsAlongRoute(track: RouteTrack, stops: SimpleStop[]): StopAlongRoute[]

// Progreso del colectivo vivo (0..1)
busProgressOn(track: RouteTrack, position: { lng, lat }): number
```

### RouteTrack

```typescript
interface RouteTrack {
  readonly totalM: number;  // Distancia total en metros
  project(lng, lat): { alongM: number; totalM: number }  // Proyección
}
```

### Proyección equirectangular

```
1. Convertir coordenadas a metros locales (origen: coords[0])
   x = (lng - originLng) × 111320 × cos(originLat)
   y = (lat - originLat) × 111320

2. Para cada segmento:
   - Proyectar punto sobre la línea del segmento (clamp 0..1)
   - Calcular distancia al segmento
   - Si es la más cercana → guardar alongM = cum + segLen × t

3. Resultado: metros desde el inicio + totalM
```

### StopAlongRoute

```typescript
interface StopAlongRoute {
  id: string;
  name: string;
  alongM: number;    // metros desde el inicio
  progress: number;  // 0..1
}
```

---

## 4. Control de Cámara (`src/lib/map/camera-controller.ts`)

Define cómo la cámara sigue a los vehículos en el mapa.

### Modos de cámara

| Modo | Descripción | Pitch | Bearing | Zoom |
|------|-------------|-------|---------|------|
| `overview` | Vista general de la ciudad | 0° | 0° | Variable |
| `follow-user` | Sigue la ubicación del usuario | 0° | 0° | Variable |
| `follow-vehicle` | Sigue un colectivo (2D, liviano) | 0° | 0° | 15.2 |
| `navigation-vehicle` | Perspectiva 3D del colectivo | 52° | heading | 16.5–16.9 |
| `free` | Usuario mueve el mapa libremente | Variable | Variable | Variable |

### follow-vehicle (2D)

```typescript
{
  center: pointAhead(position, 12),  // 12m adelante del bus
  zoom: 15.2,
  pitch: 0,
  bearing: 0,  // Norte arriba siempre
}
```

### navigation-vehicle (3D)

```typescript
const lookAheadMeters = Math.min(70, Math.max(32, speed * 1.8));

{
  center: pointAhead(position, lookAheadMeters),
  zoom: speed > 35 ? 16.5 : 16.9,
  pitch: 52,
  bearing: position.heading,  // Rotar según dirección del bus
}
```

### pointAhead (utility)

```typescript
function pointAhead(
  position: { lat, lng, heading },
  meters: number
): [number, number]
```

Proyecta un punto hacia adelante por el heading del vehículo. Usado para:
- Centrar la cámara adelante del bus (no en su exacta posición)
- Calcular punto para heading suave en el motor GPS

---

## 5. Datos de Entrada

### Coordenadas de polilínea (`src/data/routes.json`)

Cada línea tiene un array de coordenadas `[lng, lat]` ajustadas con OSRM a calles reales:

```json
{
  "line-200": [[-58.38195, -34.603304], [-58.381072, -34.603982], ...],
  "line-210": [[-58.38195, -34.603304], [-58.38107, -34.603655], ...],
  "line-215": [[-58.380439, -34.604364], [-58.381072, -34.603982], ...],
  "line-220": [[-58.365143, -34.620668], [-58.366291, -34.616868], ...],
  "line-225": [[-58.38195, -34.603304], [-58.381072, -34.603982], ...]
}
```

### VehiclePosition (feed 1 Hz)

```typescript
interface VehiclePosition {
  lineId: string;    // 'line-200'
  unitId: string;    // '1234'
  lat: number;       // -34.6037
  lng: number;       // -58.3816
  heading: number;   // 180 (grados 0-360)
  speed: number;     // 15 (km/h)
  timestamp: number; // Date.now() (epoch ms)
}
```

### Unidades por línea

| Línea | Unidades | Color |
|-------|----------|-------|
| line-200 | 1234, 0871, 2045, 1892 | #1D4ED8 (Azul) |
| line-210 | 3012, 3089, 3156 | #FEA619 (Ámbar) |
| line-215 | 4501, 4578 | #006B2C (Verde) |
| line-220 | 5601, 5678 | #7C3AED (Violeta) |
| line-225 | 6801, 6878, 6945 | #0EA5E9 (Cyan) |

---

## 6. Métricas de Renderizado

| Métrica | Valor |
|---------|-------|
| Feed GPS | 1 Hz (1000 ms entre ticks) |
| Interpolación cliente | 60 fps (requestAnimationFrame) |
| Latencia percibida | ~16 ms (frame) + 1000 ms (tick) |
| Dead-reckoning máximo | 1500 ms más allá del último fix |
| Detección de teleport | Saltos > 400 m entre fixes |
| Heading suave | Punto 12 m adelante en la polilínea |

---

## Archivos del motor de animación

| Archivo | Rol |
|---------|-----|
| `src/mock/live.ts` | GPS simulado (emite ticks 1 Hz sobre polilínea) |
| `src/mock/data.ts` | Datos mock: líneas, rutas, unidades |
| `src/data/routes.json` | Coordenadas de polilíneas (OSRM) |
| `src/lib/map/vehicle-motion-engine.ts` | Interpolación/extrapolación + estados |
| `src/lib/map/route-progress.ts` | Proyección sobre polilínea (metros + progreso) |
| `src/lib/map/camera-controller.ts` | Modos de cámara (overview, follow, navigation) |
| `src/lib/data-service.ts` | Interfaz VehiclePosition (contrato del feed) |

---

*Detalle técnico del motor de animación — Colectivos AMBA Maqueta Fase 1*
