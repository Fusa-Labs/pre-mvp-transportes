# Planificador de Viajes + Horarios — Documentación Técnica

> Módulo de planificación Uber-style + sistema de horarios mock determinístico.

---

## 1. Visión General

### Qué hace

El usuario elige **origen** y **destino** (por búsqueda, guardados, mapa o POIs) y el sistema encuentra **qué líneas de colectivo cubren ese viaje**, mostrando frecuencia, horarios y combinaciones.

### Componentes

| Componente | Archivo | Responsabilidad |
|------------|---------|-----------------|
| **TripPlannerSheet** | `src/components/features/planner/trip-planner-sheet.tsx` | Sheet principal: inputs, sugerencias, resumen de viaje |
| **RouteInputGroup** | `src/components/features/planner/route-input-group.tsx` | Bloque visual origen→destino con swap y waypoints |
| **SchedulePicker** | `src/components/features/planner/schedule-picker.tsx` | Selector "Ahora / En 15 min / En 30 min / En 1 hora" |
| **QuickActionsBar** | `src/components/features/planner/quick-actions-bar.tsx` | Pills Casa / Trabajo / Guardados |
| **LocationItemRow** | `src/components/features/planner/location-item-row.tsx` | Fila de sugerencia con icono, título, distancia, menú |
| **SavedPlacesSection** | `src/components/features/planner/saved-places-section.tsx` | Listado "Tus lugares" con CRUD |
| **SavePlaceSheet** | `src/components/features/planner/save-place-sheet.tsx` | Diálogo crear/editar lugar (Casa/Trabajo/Favorito) |
| **ConfirmDeleteDialog** | `src/components/features/planner/confirm-delete-dialog.tsx` | Confirmación de eliminación de sugerencias |
| **HorariosButton** | `src/components/ui/horarios-button.tsx` | CTA "Ver todos los horarios" con animación |
| **HorariosPage** | `src/app/horarios/page.tsx` | Listado de líneas + combinaciones |
| **HorariosLineaPage** | `src/app/horarios/[id]/page.tsx` | Tabla completa de horarios por línea |

### Módulos Lib

| Módulo | Archivo | Responsabilidad |
|--------|---------|-----------------|
| **trip-match** | `src/lib/planner/trip-match.ts` | Heurística: qué líneas cubren un viaje |
| **geocoder** | `src/lib/planner/geocoder.ts` | Búsqueda local de lugares (paradas + POIs + guardados) |
| **pois-source** | `src/lib/planner/pois-source.ts` | Carga y cache de POIs OSM |
| **types** | `src/lib/planner/types.ts` | Tipos: LocationItem, SavedPlace, TripMatch |
| **schedules** | `src/lib/schedules.ts` | Generación determinística de horarios + combinaciones |
| **service-reports** | `src/lib/service-reports.ts` | Informes de servicio (enriquece alertas) |
| **useTripPlanner** | `src/hooks/use-trip-planner.ts` | Hook: lugares guardados/recientes en localStorage |

---

## 2. Flujo del Planificador

### 2.1 Origen y Destino

El usuario puede elegir desde 4 fuentes:
- **Búsqueda local**: filtra paradas mock + POIs OSM + guardados + recientes
- **Guardados**: Casa / Trabajo / Favoritos (localStorage)
- **Mapa**: tap en el mapa → coordenadas directas
- **POIs**: puntos de interés del snapshot OSM

### 2.2 Algoritmo de Matching (`trip-match.ts`)

```
Para cada línea:
  1. Calcular distancia origen → polilínea (metros)
  2. Calcular distancia destino → polilínea (metros)
  3. Score = peor de las dos distancias
  4. Si score ≤ 900m → la línea sirve
  5. Ordenar por score ascendente (menor = mejor)
```

**Proyección equirectangular local**: convierte `[lng, lat]` a metros planos. Error despreciable a escala AMBA (~100m máximo).

### 2.3 Resumen de Viaje

El `TripSummary` muestra:
- Card con origen/destino (círculo → línea → cuadrado)
- Lista de líneas que cubren el viaje
- Cada línea: badge color, nombre, frecuencia, distancia del peor extremo
- Tap en línea → encuadra el mapa y baja el sheet

---

## 3. Sistema de Horarios (`schedules.ts`)

### Generación Determinística

Los horarios NO son random — se generan por **semilla** (hash del lineId):

```typescript
hashOf(lineId) → offset (0–13 min para hábil, 0–21 para domingo)
```

Misma entrada → misma salida. Sin mismatch SSR/client.

### Configuración

- **Ventana**: 05:00 – 22:50 (INICIO_MIN = 300, FIN_MIN = 1370)
- **Hábil**: cada `frequency` minutos (ej: línea 200 = cada 15 min)
- **Domingo**: `min(frequency × 2, frequency + 15)` minutos
- **Vuelta**: offset de ida + `max(6, frequency/2)`

### Ejemplo Línea 200 (frequency = 15)

| Servicio | Ida starts | Vuelta starts | Freq |
|----------|-----------|---------------|------|
| Hábil | 05:XX | 05:XX+12 | 15 min |
| Domingo | 05:XX | 05:XX+12 | 30 min |

### API

```typescript
buildLineSchedules(lineId)     // LineSchedule[] (habil + dom)
firstLast(times)               // { primera, ultima }
nextDeparture(times, nowMin)   // próximo horario ≥ nowMin
combinationsByStop()           // paradas con 2+ líneas (transbordo)
```

---

## 4. Páginas de Horarios

### `/horarios` — Listado General

- Header fijo con back
- Cards de cada línea: badge + frecuencia + primera/última salida + próxima en vivo
- Sección "Combinaciones": paradas donde se puede transbordar
- BottomNav

### `/horarios/[id]` — Detalle de Línea

- Card de línea: badge + nombre + dirección + frecuencia
- Próxima salida en vivo (calculada en cliente, sin mismatch SSR)
- Tabs: Lun–Sáb / Dom y feriados
- Tablas ida/vuelta con chips de horario (la próxima se resalta en primary)
- Paradas del recorrido con combinaciones (otras líneas en cada parada)
- CTA "Ver horarios de todos los colectivos"

---

## 5. Lógica de Lugares Guardados (`use-trip-planner.ts`)

### Persistencia

- **localStorage** con 3 claves: `rutaba_lugares`, `rutaba_recientes`, `rutaba_ocultas`
- **useSyncExternalStore**: sincronizado entre pestañas vía evento `storage`
- Sin flags de "cargado" — snapshot crudo directo

### CRUD

| Operación | Función | Comportamiento |
|-----------|---------|----------------|
| Crear | `addSaved(kind, item, title)` | Casa/Trabajo: una sola (reemplaza). Favoritos: múltiples |
| Editar | `updateSaved(id, patch)` | Cambia título/subtítulo/coordenadas in-place |
| Eliminar | `removeSaved(id)` | Devuelve el eliminado para Deshacer |
| Restaurar | `restoreSaved(place)` | Vuelve al frente de la lista |
| Recientes | `addRecent(item)` | Dedup por id, tope 6 |
| Ocultar | `dismissSuggestion(id)` | Agrega a `rutaba_ocultas` |

### Tipos de Lugar

| Kind | Icono | bg color | Slot único |
|------|-------|----------|------------|
| `home` | home | primary-container | Sí (una Casa) |
| `work` | work | tertiary-container | Sí (un Trabajo) |
| `saved` | bookmark | surface-container-high | No (múltiples) |

---

## 6. Geocoder Local (`geocoder.ts`)

### Búsqueda

1. Normalizar texto (sin acentos, minúsculas)
2. Buscar en: guardados → recientes → paradas mock → POIs OSM
3. Ranking: prefijo > incluye; guardados/recientes primero
4. Dedup por título normalizado
5. Límite: 8 resultados

### Parada Más Cercana

`nearestStop(point, stops)` → haversine, usa el planner para el pulso del mapa ("tu parada" al elegir destino).

### POIs

- Carga `/data/pois.json` una vez por sesión (memoiza la promesa)
- Si la red falla, busca sin POIs — nunca rompe el planner
- Labels: hospital → "Hospital", station → "Estación", etc.

---

## 7. Adaptación del Spec Uber

| Spec Uber | RutaBA |
|-----------|--------|
| Google Places/Mapbox geocoding | Búsqueda local sobre dataset propio |
| Backend de rutas | Heurística equirectangular (mock) |
| Pasajero seleccionable | "Ahora" / "+15" / "+30" / "+1 hora" (sin selector de pasajero) |
| Bottom sheet | BottomSheet con detents (mobile) + modal centrado (desktop ≥768px) |
| Mapa con ruta visual | Origen→destino con círculo/línea/cuadrado + parada con pulso |

---

## 8. Mejoras Sugeridas (para Gemini)

### Funcionalidad
1. **Google Places API** reemplazando la búsqueda local
2. **Rutas reales** (OSRM/Valhalla) en vez de heurística de 900m
3. **Transbordos inteligentes**: mostrar "tomá la 200 hasta X, después la 215"
4. **ETA real**: frecuencia × distancia al recorrido + tráfico
5. **Geocoding por dirección**: "Av. Corrientes 1234" → coordenadas
6. **Historial de viajes**: reutilizar viajes anteriores

### UX
7. **Animación de ruta** en el mapa al planificar
8. **Modo oscuro** completo en todas las pantallas
9. **Accesibilidad audit** con Lighthouse
10. **Haptic feedback** al confirmar viaje

### Código
11. **Separar TripPlannerSheet en sub-componentes** (Form, Results, Summary)
12. **Testing** de trip-match con jest
13. **Storybook** para LocationItemRow y SavePlaceSheet

---

## 9. Archivos del Módulo

```
src/
├── app/
│   ├── horarios/
│   │   ├── page.tsx                      # Listado de horarios
│   │   └── [id]/page.tsx                 # Detalle de línea
├── components/
│   ├── features/planner/
│   │   ├── trip-planner-sheet.tsx        # Sheet principal (820 líneas)
│   │   ├── route-input-group.tsx         # Bloque origen→destino (234 líneas)
│   │   ├── schedule-picker.tsx           # Selector de hora (77 líneas)
│   │   ├── quick-actions-bar.tsx         # Pills Casa/Trabajo/Guardados (47 líneas)
│   │   ├── location-item-row.tsx         # Fila de sugerencia (155 líneas)
│   │   ├── saved-places-section.tsx      # Listado "Tus lugares" (149 líneas)
│   │   ├── save-place-sheet.tsx          # Diálogo crear/editar (290 líneas)
│   │   └── confirm-delete-dialog.tsx     # Confirmación eliminar (99 líneas)
│   └── ui/
│       └── horarios-button.tsx           # CTA animado (30 líneas)
├── hooks/
│   └── use-trip-planner.ts              # Hook localStorage (174 líneas)
├── lib/
│   ├── planner/
│   │   ├── types.ts                     # Tipos (48 líneas)
│   │   ├── trip-match.ts                # Heurística de matching (66 líneas)
│   │   ├── geocoder.ts                  # Búsqueda local (175 líneas)
│   │   └── pois-source.ts              # Cache de POIs (27 líneas)
│   ├── schedules.ts                     # Horarios mock (114 líneas)
│   └── service-reports.ts              # Informes de servicio (161 líneas)
└── mock/
    └── data.ts                          # Datos mock (294 líneas)
```
