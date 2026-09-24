# Asistente del Home — Intents deterministas para preguntas de usuarios finales

**Rama:** `feat/home-assistant-intents` · **PBI:** PBI-017 · **Fecha:** 2026-09-22
**Estado:** implementado, verificado (tsc + QA + build + smoke), cambios en local sin commitear.

## 1. Qué es

El cliente pidió que el home responda las 4 preguntas típicas de un pasajero:

1. *¿Cuándo llega el próximo colectivo?*
2. *¿Cuál es la parada más cercana?*
3. *¿Cómo voy de un lugar a otro?*
4. *¿Cuánto me falta para llegar a tomar el colectivo?*

Se implementó como un **asistente de intents deterministas, sin LLM ni backend**:
una barra en `/inicio` con **caja de texto libre + 4 chips** de preguntas sugeridas.
Tanto el chip como el texto libre caen en el mismo pipeline: un parser por
regex clasifica la pregunta en un intent, y un resolver la contesta delegando a
los servicios de datos que ya existían en el repo.

## 2. Arquitectura

```
AssistantBar (chips + caja)          /inicio (estado + feed GPS 1 Hz)
      │ intent / texto libre              │
      ▼                                   ▼
parseAssistantQuery ──► AssistantQuery ──► resolveAssistantQuery
   (regex, es-AR)         (parser puro)      (delega a servicios)
                                                 │
        ┌────────────────┬───────────────────────┼──────────────────┐
        ▼                ▼                       ▼                  ▼
  getArrivals      findCandidateStops      resolveLocationPoint  calculateWalkFeasibility
  (GPS live)       (Haversine + caminata)  + planTrip            (bondi vs. a pie)
        └────────────────┴───────────┬───────────┴──────────────────┘
                                     ▼
                          AssistantAnswer (unión discriminada)
                    arrivals · nearby-stops · trip · walk-timing · clarify · no-coverage
                                     ▼
                        AssistantAnswerSheet (hoja fija sobre el dock,
                        colapsable por arrastre — useDragCollapse)
```

### 2.1 Intents

| Intent | Dispara con (ejemplos) | Motor | Respuesta |
|---|---|---|---|
| `next_arrival` | chip · "cuándo llega el 194" | `TransportService.getArrivals(paradaId, positions)` filtrado por línea si se menciona | Top-4 llegadas en vivo con displayLabel |
| `nearest_stop` | chip · "parada más cercana" | `TripPlannerService.findCandidateStops` (≤2000 m, top-3) | Lista con distancia + caminata + refinamientos |
| `trip_plan` | chip · "cómo llego a Once" | `searchLocations`/`resolveLocationPoint` → `planTrip` | Resumen (tiempo, transbordos, líneas) + CTA al mapa |
| `walk_timing` | chip · "me da tiempo a caminar" | `calculateWalkFeasibility(userLocation, parada, etaMin)` | "Llegás bien / Apurate / Llegás al siguiente" |
| — | texto sin match o destino ambiguo | — | `clarify` con hasta 3 candidatos tocables |

**Prioridad del parser** (desempate deliberado): `walk_timing` > `next_arrival` >
`nearest_stop` > `trip_plan` > unknown. Las keywords de caminata son las más
específicas y ganan cuando la frase también menciona "colectivo" o "llega".

### 2.2 Regla de oro: nunca resolver a ciegas

El `ViajeHeader` de /mapas tiene un fallback que ancla textos no resueltos a
Parque Centenario (coordenadas mágicas). Para el asistente eso sería mentirle
al usuario: `resolveLocationPoint === null` ⇒ **`clarify` con candidatos**, y el
QA incluye una regresión que lo verifica (`destino imposible no cae en la
ubicación simulada`).

Como parte de esto, las coordenadas simuladas pasaron a
`src/lib/config/user-location.ts` (`SIMULATED_USER_LOCATION` +
`getUserLocation()`): único punto de cambio cuando se conecte
`navigator.geolocation` de verdad (marcado `TODO(geo-real)`).

### 2.3 Deep-links con el mapa

Misma mecánica que el doble-tap del dock (`window.location.search` +
`history.replaceState`, sin `<Suspense>`):

- `/mapas?trip=1&destino=<nombre>` → abre Modo Viaje y precarga el destino
  (si el geocoder lo resuelve; si no, abre sin destino, nunca con uno falso).
- `/mapas?parada=<id>` → enfoca la parada y abre el bubble de llegadas
  (el setState se difiere a un `requestAnimationFrame` para respetar
  `react-hooks/set-state-in-effect`).
- El CTA del viaje lleva además a `/parada/[id]` para "Ver todas las llegadas".

## 3. Archivos

| Archivo | Rol |
|---|---|
| `src/lib/config/user-location.ts` | Ubicación de referencia compartida (nueva) |
| `src/lib/services/assistant-intent-service.ts` | Parser + resolver puros; `ASSISTANT_CHIPS` (copy UI) (nuevo) |
| `src/components/home/AssistantBar.tsx` | Caja de texto + chips (nuevo) |
| `src/components/home/AssistantAnswerSheet.tsx` | Hoja de respuestas fija/colapsable (nuevo) |
| `src/components/home/AssistantAnswerCard.tsx` | Render por tipo de respuesta (nuevo) |
| `scripts/qa-assistant-intents.mts` | Suite QA parser + resolver (nuevo) |
| `src/app/inicio/page.tsx` | Montaje, estado, feed GPS, refine contextual (mod) |
| `src/app/mapas/page.tsx` | `?destino=`, `?parada=`, constante de ubicación (mod) |
| `src/components/viaje/ViajeHeader.tsx` | Fallback usa la constante compartida (mod) |

## 4. Deciciones de diseño

- **Sin LLM**: las 4 preguntas son un dominio cerrado y los datos ya tienen
  motor propio. Un parser de ~150 líneas es auditable, testeadle sin red y
  gratis; un LLM agregaría latencia, costo y alucinaciones sobre horarios.
- **Todo síncrono**: resolver es CPU puro sobre mocks deterministas; no hay
  estados de carga que diseñar.
- **Contexto con memoria corta**: tras "parada más cercana", el botón
  "¿Cuándo llega?" de cada fila fija `paradaRef` y re-emite `next_arrival`
  sobre ESA parada (refinamiento sin chat con historial).
- **Copy es-AR** (voseo) centralizado en `ASSISTANT_CHIPS` y en los headlines
  del resolver: QA y UI comparten las mismas frases.
- **Accesibilidad**: `aria-pressed` en chips, `aria-live="polite"` en la hoja,
  targets ≥ 44 px, ESC cierra la hoja sin cancelar escritura.

## 5. Verificación

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npx tsx scripts/qa-assistant-intents.mts` | 18/18 ✓ (11 parser + 7 resolver) |
| `npx eslint` (archivos nuevos) | 0 errores; 7 pre-existentes del equipo en mapas/ViajeHeader fuera de scope |
| Impeccable detect | `[]` |
| `npm run build` | ✓ 8 rutas |
| Smoke dev server | `/inicio` y `/mapas` → 200; markup del asistente presente |

## 6. Limitaciones conocidas

- **Ubicación simulada**: "más cercana" y "me da tiempo" se calculan contra
  Parque Centenario hasta conectar `navigator.geolocation` (`TODO(geo-real)`).
- **Red mock 65/194**: fuera del corredor, `nearest_stop` responde
  `no-coverage` (comportamiento honesto, no un bug).
- `/parada/[id]` muestra llegadas por hash (sin GPS); el asistente muestra las
  live. Unificar ambas fuentes queda marcado como deuda.
- El parser cubre variantes razonables de es-AR pero no typos agresivos ni
  otras idiomas (por diseño: dominio cerrado).

## 7. Cómo probarlo

1. `npm run dev` → `/inicio`.
2. Tocar "¿Cuándo llega el próximo?" → hoja con llegadas live sobre la parada
   de referencia.
3. Escribir "como llego a once" → viaje con CTA "Ver el viaje completo en el
   mapa" → `/mapas` en Modo Viaje con destino precargado.
4. "parada más cercana" → lista con "¿Cuándo llega?" → refinamiento sobre esa
   parada.
5. "xyz" → `clarify`: "No te entendí. Tocá una pregunta sugerida…".
6. QA sin navegador: `npx tsx scripts/qa-assistant-intents.mts`.
