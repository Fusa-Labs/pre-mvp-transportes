# Colectivos AMBA — Recorridos, Líneas y Paradas

Detalle técnico de las 5 líneas mock de la maqueta: colores, tramos, paradas ordenadas, unidades y geometría de rutas (waypoints OSRM).

---

## Tabla de Resumen

| Línea | Nombre | Color | Hex | Dirección | Frecuencia | Unidades | Paradas |
|-------|--------|-------|-----|-----------|------------|----------|---------|
| 200 | Centro – Sur | Azul | `#1D4ED8` | Sur | 15 min | 4 | 6 |
| 210 | Centro – Oeste | Ámbar | `#FEA619` | Oeste | 10 min | 3 | 6 |
| 215 | Zona Norte | Verde | `#006B2C` | Norte | 20 min | 2 | 4 |
| 220 | Costanera | Violeta | `#7C3AED` | Costanera | 25 min | 2 | 3 |
| 225 | Aeropuerto – Centro | Cyan | `#0EA5E9` | Centro | 30 min | 3 | 4 |

**Total:** 5 líneas · 14 unidades · 16 paradas únicas

---

## Colores de Flota

Definidos en `src/lib/theme.ts → tokens.fleetColors`:

```
Índice 0 → #1D4ED8  (Azul)      → Línea 200
Índice 1 → #FEA619  (Ámbar)     → Línea 210
Índice 2 → #006B2C  (Verde)     → Línea 215
Índice 3 → #7C3AED  (Violeta)   → Línea 220
Índice 4 → #0EA5E9  (Cyan)      → Línea 225
```

### Contraste de texto (LINE_ONCOLOR)

| Fondo | Texto | Razón |
|-------|-------|-------|
| `#1D4ED8` (azul) | `#FFFFFF` | Blanco sobre oscuro |
| `#FEA619` (ámbar) | `#1E293B` | Oscuro sobre claro |
| `#006B2C` (verde) | `#FFFFFF` | Blanco sobre oscuro |
| `#7C3AED` (violeta) | `#FFFFFF` | Blanco sobre oscuro |
| `#0EA5E9` (cyan) | `#FFFFFF` | Blanco sobre oscuro |

---

## Línea 200 — Centro – Sur

| Campo | Valor |
|-------|-------|
| **ID** | `line-200` |
| **Nombre** | Centro – Sur |
| **Color** | `#1D4ED8` (Azul) |
| **Dirección** | Sur |
| **Frecuencia** | 15 minutos |
| **Primera salida hábil** | ~05:07 |
| **Última salida hábil** | ~22:47 |

### Paradas ordenadas (recorrido)

| # | ID | Nombre | Lat | Lng | Líneas que pasan |
|---|-----|--------|-----|-----|-------------------|
| 1 | stop-006 | Plaza de Mayo | -34.6033 | -58.3817 | 200, 210 |
| 2 | stop-001 | Av. Corrientes y Belgrano | -34.6037 | -58.3816 | 200, 210 |
| 3 | stop-002 | Diagonal Norte y Maipú | -34.6042 | -58.3803 | 200, 215 |
| 4 | stop-005 | Av. de Mayo y Perú | -34.6089 | -58.3793 | 200, 225 |
| 5 | stop-004 | Terminal Central | -34.6267 | -58.3816 | 200, 210, 225 |
| 6 | stop-007 | Av. Corrientes y Callao | -34.6033 | -58.3907 | 200, 210 |

### Unidades asignadas

| Unidad | Velocidad | Estado |
|--------|-----------|--------|
| 1234 | 11-18 km/h | Normal |
| 0871 | 11-18 km/h | Normal |
| 2045 | 11-18 km/h | Normal |
| 1892 | 11-18 km/h | Normal |

### Coordenadas de ruta (waypoints OSRM)

La ruta comienza en Plaza de Mayo y recorre un circuito cerrado por el centro de Buenos Aires hacia el sur:

```
Punto inicial:  (-58.38195, -34.603304)  ← Plaza de Mayo
Punto final:    (-58.38195, -34.603304)  ← Circuito cerrado

Callejero aproximado:
Plaza de Mayo → Av. Corrientes → Diagonal Norte →
Av. de Mayo → Sur hacia Terminal Central →
Regreso por Av. Corrientes → Callao → Plaza de Mayo
```

**Waypoints clave (lat/lng):**

| Punto | Longitud | Latitud | Referencia |
|-------|----------|---------|------------|
| Inicio | -58.38195 | -34.603304 | Plaza de Mayo |
| 1 | -58.381072 | -34.603982 | Av. Corrientes y Belgrano |
| 2 | -58.380343 | -34.604419 | Diagonal Norte y Maipú |
| 3 | -58.379707 | -34.604749 | Av. de Mayo y Perú |
| 4 | -58.379325 | -34.606002 | Sur hacia Terminal |
| 5 | -58.382004 | -34.606120 | Av. Corrientes (regreso) |
| 6 | -58.381964 | -34.608443 | Av. Corrientes y Callao |
| 7 | -58.381917 | -34.609687 | Zona Once |
| 8 | -58.381468 | -34.610789 | Regreso al centro |
| 9 | -58.381752 | -34.612977 | Sur - Terminal |
| 10 | -58.381056 | -34.609645 | Retorno por Corrientes |
| 11 | -58.381951 | -34.603251 | Vuelta a Plaza de Mayo |

---

## Línea 210 — Centro – Oeste

| Campo | Valor |
|-------|-------|
| **ID** | `line-210` |
| **Nombre** | Centro – Oeste |
| **Color** | `#FEA619` (Ámbar) |
| **Dirección** | Oeste |
| **Frecuencia** | 10 minutos |
| **Primera salida hábil** | ~05:05 |
| **Última salida hábil** | ~22:45 |

### Paradas ordenadas (recorrido)

| # | ID | Nombre | Lat | Lng | Líneas que pasan |
|---|-----|--------|-----|-----|-------------------|
| 1 | stop-006 | Plaza de Mayo | -34.6033 | -58.3817 | 200, 210 |
| 2 | stop-001 | Av. Corrientes y Belgrano | -34.6037 | -58.3816 | 200, 210 |
| 3 | stop-007 | Av. Corrientes y Callao | -34.6033 | -58.3907 | 200, 210 |
| 4 | stop-008 | Av. Rivadavia y Once | -34.6091 | -58.4035 | 210 |
| 5 | stop-015 | Av. San Martín y Perdriel | -34.6163 | -58.3985 | 210 |
| 6 | stop-016 | Av. Maipú y Córdoba | -34.5988 | -58.3792 | 210 |

### Unidades asignadas

| Unidad | Velocidad | Estado |
|--------|-----------|--------|
| 3012 | 11-18 km/h | Normal |
| 3089 | 11-18 km/h | Normal |
| 3156 | 11-18 km/h | Normal |

### Coordenadas de ruta (waypoints OSRM)

La ruta recorre desde el centro hacia el oeste por Av. Rivadavia y zona Once:

```
Punto inicial:  (-58.38195, -34.603304)  ← Plaza de Mayo
Punto final:    (-58.38195, -34.603304)  ← Circuito cerrado

Callejero aproximado:
Plaza de Mayo → Av. Corrientes → Callao →
Once (Av. Rivadavia) → Av. San Martín →
Zona Oeste → Regreso por Maipú → Córdoba → Centro
```

**Waypoints clave (lat/lng):**

| Punto | Longitud | Latitud | Referencia |
|-------|----------|---------|------------|
| Inicio | -58.38195 | -34.603304 | Plaza de Mayo |
| 1 | -58.38107 | -34.603655 | Av. Corrientes |
| 2 | -58.382132 | -34.603726 | Av. Corrientes y Callao |
| 3 | -58.38367 | -34.604591 | Zona Once |
| 4 | -58.387911 | -34.604337 | Av. Rivadavia |
| 5 | -58.390865 | -34.603078 | Oeste intermedio |
| 6 | -58.393967 | -34.603215 | Av. San Martín |
| 7 | -58.396915 | -34.603304 | Zona Oeste |
| 8 | -58.400471 | -34.609924 | Once profundo |
| 9 | -58.401821 | -34.609880 | Av. Rivadavia (vuelta) |
| 10 | -58.397675 | -34.604562 | Regreso al centro |

---

## Línea 215 — Zona Norte

| Campo | Valor |
|-------|-------|
| **ID** | `line-215` |
| **Nombre** | Zona Norte |
| **Color** | `#006B2C` (Verde) |
| **Dirección** | Norte |
| **Frecuencia** | 20 minutos |
| **Primera salida hábil** | ~05:03 |
| **Última salida hábil** | ~22:43 |

### Paradas ordenadas (recorrido)

| # | ID | Nombre | Lat | Lng | Líneas que pasan |
|---|-----|--------|-----|-----|-------------------|
| 1 | stop-002 | Diagonal Norte y Maipú | -34.6042 | -58.3803 | 200, 215 |
| 2 | stop-010 | Av. del Libertador y Sarmiento | -34.5437 | -58.4498 | 215, 220 |
| 3 | stop-009 | Av. Cabildo y Congreso | -34.5583 | -58.4638 | 215 |
| 4 | stop-003 | Pje. Castelli y Av. Cabildo | -34.5632 | -58.4597 | 215 |

### Unidades asignadas

| Unidad | Velocidad | Estado |
|--------|-----------|--------|
| 4501 | 11-18 km/h | Normal |
| 4578 | 11-18 km/h | Normal |

### Coordenadas de ruta (waypoints OSRM)

La ruta recorre desde Diagonal Norte hacia el norte por zona Núñez y Belgrano:

```
Punto inicial:  (-58.380439, -34.604364)  ← Diagonal Norte
Punto final:    (-58.380439, -34.604364)  ← Circuito cerrado

Callejero aproximado:
Diagonal Norte → Av. Libertador → Núñez →
Belgrano (Av. Cabildo) → Pje. Castelli →
Regreso por Av. Cabildo → Libertador → Diagonal Norte
```

**Waypoints clave (lat/lng):**

| Punto | Longitud | Latitud | Referencia |
|-------|----------|---------|------------|
| Inicio | -58.380439 | -34.604364 | Diagonal Norte |
| 1 | -58.381072 | -34.603982 | Av. Corrientes |
| 2 | -58.383924 | -34.601220 | Av. Libertador |
| 3 | -58.385663 | -34.596966 | Núñez |
| 4 | -58.388422 | -34.595764 | Zona norte |
| 5 | -58.390868 | -34.592563 | Belgrano |
| 6 | -58.394638 | -34.589517 | Av. Cabildo |
| 7 | -58.401073 | -34.584012 | Av. Cabildo profundo |
| 8 | -58.407273 | -34.580793 | Zona norte profunda |
| 9 | -58.412591 | -34.572430 | Núñez extremo |
| 10 | -58.421672 | -34.571522 | Av. Libertador (vuelta) |
| 11 | -58.435415 | -34.564291 | Regreso sur |
| 12 | -58.459546 | -34.558052 | Av. Cabildo (vuelta) |
| 13 | -58.420826 | -34.581775 | Retorno al centro |

---

## Línea 220 — Costanera

| Campo | Valor |
|-------|-------|
| **ID** | `line-220` |
| **Nombre** | Costanera |
| **Color** | `#7C3AED` (Violeta) |
| **Dirección** | Costanera |
| **Frecuencia** | 25 minutos |
| **Primera salida hábil** | ~05:11 |
| **Última salida hábil** | ~22:51 |

### Paradas ordenadas (recorrido)

| # | ID | Nombre | Lat | Lng | Líneas que pasan |
|---|-----|--------|-----|-----|-------------------|
| 1 | stop-012 | Puerto Madero y Rosario Vera | -34.6205 | -58.3649 | 220, 225 |
| 2 | stop-011 | Costanera Norte y Juana Manilio | -34.5363 | -58.4617 | 220 |
| 3 | stop-010 | Av. del Libertador y Sarmiento | -34.5437 | -58.4498 | 215, 220 |

### Unidades asignadas

| Unidad | Velocidad | Estado |
|--------|-----------|--------|
| 5601 | 11-18 km/h | Normal |
| 5678 | 11-18 km/h | Normal |

### Coordenadas de ruta (waypoints OSRM)

La ruta recorre la costanera desde Puerto Madero hacia el norte:

```
Punto inicial:  (-58.365143, -34.620668)  ← Puerto Madero
Punto final:    (-58.365143, -34.620668)  ← Circuito cerrado

Callejero aproximado:
Puerto Madero → Costanera Norte →
Zona norte de Costanera → Av. Libertador →
Regreso por Costanera → Puerto Madero
```

**Waypoints clave (lat/lng):**

| Punto | Longitud | Latitud | Referencia |
|-------|----------|---------|------------|
| Inicio | -58.365143 | -34.620668 | Puerto Madero |
| 1 | -58.366291 | -34.616868 | Costanera sur |
| 2 | -58.371727 | -34.616007 | Costanera intermedia |
| 3 | -58.375392 | -34.612699 | Zona norte |
| 4 | -58.377694 | -34.610546 | Costanera norte |
| 5 | -58.381115 | -34.608503 | Av. Libertador |
| 6 | -58.381178 | -34.607280 | Zona centro |
| 7 | -58.380837 | -34.606086 | Regreso sur |
| 8 | -58.381583 | -34.608418 | Costanera (vuelta) |
| 9 | -58.382417 | -34.607370 | Puerto Madero (retorno) |

---

## Línea 225 — Aeropuerto – Centro

| Campo | Valor |
|-------|-------|
| **ID** | `line-225` |
| **Nombre** | Aeropuerto – Centro |
| **Color** | `#0EA5E9` (Cyan) |
| **Dirección** | Centro |
| **Frecuencia** | 30 minutos |
| **Primera salida hábil** | ~05:04 |
| **Última salida hábil** | ~22:44 |

### Paradas ordenadas (recorrido)

| # | ID | Nombre | Lat | Lng | Líneas que pasan |
|---|-----|--------|-----|-----|-------------------|
| 1 | stop-014 | Terminal.ReadLineal | -34.6267 | -58.3780 | 225 |
| 2 | stop-012 | Puerto Madero y Rosario Vera | -34.6205 | -58.3649 | 220, 225 |
| 3 | stop-001 | Av. Corrientes y Belgrano | -34.6037 | -58.3816 | 200, 210 |
| 4 | stop-013 | Autopista Ricchieri y Ezeiza | -34.6583 | -58.4183 | 225 |

### Unidades asignadas

| Unidad | Velocidad | Estado |
|--------|-----------|--------|
| 6801 | 11-18 km/h | Normal |
| 6878 | 11-18 km/h | Normal |
| 6945 | 11-18 km/h | Normal |

### Coordenadas de ruta (waypoints OSRM)

La ruta recorre desde Terminal.ReadLineal hacia el aeropuerto:

```
Punto inicial:  (-58.38195, -34.603304)  ← Centro
Punto final:    (-58.38195, -34.603304)  ← Circuito cerrado

Callejero aproximado:
Centro → Av. Corrientes → Puerto Madero →
Autopista Ricchieri → Zona Aeropuerto →
Regreso al centro
```

**Waypoints clave (lat/lng):**

| Punto | Longitud | Latitud | Referencia |
|-------|----------|---------|------------|
| Inicio | -58.38195 | -34.603304 | Centro |
| 1 | -58.381072 | -34.603982 | Av. Corrientes |
| 2 | -58.380343 | -34.604419 | Diagonal Norte |
| 3 | -58.379707 | -34.604749 | Av. de Mayo |
| 4 | -58.379325 | -34.606002 | Sur |
| 5 | -58.382004 | -34.606120 | Puerto Madero |
| 6 | -58.381964 | -34.608443 | Zona terminal |
| 7 | -58.381917 | -34.609687 | Autopista |
| 8 | -58.381468 | -34.610789 | Ricchieri |
| 9 | -58.381752 | -34.612977 | Zona Aeropuerto |
| 10 | -58.381056 | -34.609645 | Regreso |
| 11 | -58.381951 | -34.603251 | Vuelta al centro |

---

## Catálogo de Alertas

| ID | Línea | Tipo | Severidad | Desde | Estado |
|----|-------|------|-----------|-------|--------|
| alert-001 | 200 (Azul) | Retraso | Amber | 14:10 | Activa |
| alert-004 | 210 (Ámbar) | Retraso | Amber | 14:10 | Activa |
| alert-002 | 225 (Cyan) | Suspensión | Red | 13:05 | Activa |
| alert-003 | 220 (Violeta) | Cambio recorrido | Gray | 11:00 | Activa |
| alert-005 | 215 (Verde) | Retraso | Gray | 15:40 | Resuelta |

### Descripciones

| Alerta | Descripción |
|--------|-------------|
| alert-001 | Obra en Av. 9 de Julio. Retraso de 10 min en sentido Centro. |
| alert-002 | Corte en acceso al aeropuerto. Servicio reemplazado por 215. |
| alert-003 | Recorrido alterado por evento en Costanera. Vuelve a la normalidad a las 16:00. |
| alert-004 | Obra en Av. 9 de Julio. Retraso de 10 min en sentido Oeste. |
| alert-005 | Retrasos por corte en Av. Rivadavia durante la mañana. Frecuencias restablecidas. |

---

## Motor GPS Simulado

Configuración del motor de movimiento (`src/mock/live.ts`):

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `TICK_INTERVAL_MS` | 1000 ms | Frecuencia de actualización (1 Hz, como GTFS-RT) |
| `SPEED_BASE_KMH` | 11 km/h | Velocidad base "paseo" |
| `SPEED_VARIANCE_KMH` | 7 km/h | Varianza aleatoria (4-18 km/h total) |
| `DELAYED_UNIT_SPEED_KMH` | 5 km/h | Velocidad de unidad retrasada |
| `HEADING_AHEAD_M` | 12 metros | Punto adelante para heading suave |

### Comportamiento

- Los vehículos **SIEMPRE** viajan sobre la polilínea de su ruta (sin ruido GPS)
- Heading calculado hacia un punto 12m adelante (curvas suaves, sin saltos)
- Emite posiciones a 1 Hz; el suavizado a 60fps lo hace el cliente (interpolación)
- Unidad `1234` de línea `210` tiene velocidad reducida (simula retraso)

### Cálculo de posición

```
1. Se calcula la distancia recorrida: speed_km/h ÷ 3.6 = metros_por_segundo
2. Se busca el segmento correspondiente en la polilínea
3. Se interpola linealmente dentro del segmento (lerp)
4. El heading se calcula hacia un punto 12m más adelante (bearingDeg)
```

---

## Proyección sobre Polilínea

El módulo `src/lib/map/route-progress.ts` convierte cualquier punto en "metros desde el inicio" y progreso 0..1:

```
createRouteTrack(coords) → RouteTrack
  ├── totalM: distancia total de la ruta en metros
  └── project(lng, lat) → { alongM, totalM }

stopsAlongRoute(track, stops) → StopAlongRoute[]
  └── Cada parada con: id, name, alongM, progress (0..1)

busProgressOn(track, position) → number (0..1)
  └── Progreso del colectivo vivo sobre el recorrido
```

**Proyección equirectangular local** (≈ metros) — suficiente a escala de corredores urbanos.

---

## Paradas Compartidas (Combinaciones)

Paradas donde 2+ líneas se cruzan (posible transbordo):

| Parada | Líneas | Cantidad |
|--------|--------|----------|
| Plaza de Mayo (stop-006) | 200, 210 | 2 |
| Av. Corrientes y Belgrano (stop-001) | 200, 210, 225 | 3 |
| Diagonal Norte y Maipú (stop-002) | 200, 215 | 2 |
| Terminal Central (stop-004) | 200, 210, 225 | 3 |
| Av. de Mayo y Perú (stop-005) | 200, 225 | 2 |
| Av. Corrientes y Callao (stop-007) | 200, 210 | 2 |
| Av. del Libertador y Sarmiento (stop-010) | 215, 220 | 2 |
| Puerto Madero y Rosario Vera (stop-012) | 220, 225 | 2 |

---

## Estructura de Datos (TypeScript)

### Modelo Line

```typescript
interface Line {
  id: string;        // 'line-200'
  name: string;      // 'Centro – Sur'
  shortName: string; // '200'
  color: string;     // '#1D4ED8'
  direction: string; // 'Sur'
  frequency: number; // 15 (minutos)
}
```

### Modelo Stop

```typescript
interface Stop {
  id: string;      // 'stop-001'
  name: string;    // 'Av. Corrientes y Belgrano'
  lat: number;     // -34.6037
  lng: number;     // -58.3816
  lineIds: string[]; // ['line-200', 'line-210']
}
```

### Modelo Arrival

```typescript
interface Arrival {
  lineId: string;    // 'line-200'
  lineName: string;  // '200'
  etaMin: number;    // 5 (minutos hasta la llegada)
  live: boolean;     // true = GPS en tiempo real
  unitId?: string;   // '1234'
}
```

### Modelo VehiclePosition

```typescript
interface VehiclePosition {
  lineId: string;    // 'line-200'
  unitId: string;    // '1234'
  lat: number;       // -34.6037
  lng: number;       // -58.3816
  heading: number;   // 180 (grados 0-360)
  speed: number;     // 15 (km/h)
  timestamp: number; // Date.now()
}
```

### Modelo Alert

```typescript
interface Alert {
  id: string;           // 'alert-001'
  lineId: string;       // 'line-200'
  type: 'delay' | 'suspension' | 'route_change';
  status?: 'active' | 'resolved';
  title: string;        // 'Retraso estimado'
  description: string;  // 'Obra en Av. 9 de Julio...'
  severity: 'amber' | 'red' | 'gray';
  timestamp: number;
  since?: string;       // '14:10'
}
```

---

## Horarios Determinísticos

Los horarios se generan por semilla (hash del lineId) — misma entrada, misma salida. Sin `Math.random()`.

| Parámetro | Hábil | Domingo |
|-----------|-------|---------|
| Primera salida | ~05:00 + offset | ~05:00 + offset |
| Última salida | ~22:50 | ~22:50 |
| Frecuencia | `line.frequency` | `min(freq × 2, freq + 15)` |
| Offset ida/vuelta | `max(6, freq/2)` | 12 min |

### Ejemplo línea 200 (frecuencia 15 min)

| Servicio | Primera ida | Última ida | Freq |
|----------|-------------|------------|------|
| Hábil | 05:07 | 22:47 | 15 min |
| Domingo | 05:03 | 22:43 | 30 min |

---

## Archivos Relacionados

| Archivo | Contenido |
|---------|-----------|
| `src/mock/data.ts` | Datos mock: líneas, paradas, alertas, unidades, rutas |
| `src/mock/live.ts` | Motor GPS simulado (1 Hz, polilínea) |
| `src/mock/service.ts` | MockDataServiceImpl (implementa DataService) |
| `src/data/routes.json` | Geometría de rutas ajustada con OSRM (waypoints) |
| `src/data/routes-authored.json` | Rutas curadas manualmente |
| `src/lib/data-service.ts` | Interfaz DataService (contrato central) |
| `src/lib/theme.ts` | Design tokens: colores de flota, radii, spacing |
| `src/lib/schedules.ts` | Motor de horarios determinístico |
| `src/lib/service-reports.ts` | Informes de servicio por alerta |
| `src/lib/map/route-progress.ts` | Proyección sobre polilínea |

---

*Documento generado el 09/09/2026 — Maqueta Fase 1*
