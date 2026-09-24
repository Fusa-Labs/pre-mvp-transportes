# Asistente: wizard de 3 pasos, header responsive y transición al mapa (PBI-020)

**Rama:** `feat/home-assistant-intents` · **Fecha:** 2026-09-23 · **Depende de:** PBI-017 / PBI-019
**Estado:** implementado y verificado, en local (sin commitear, a revisión del equipo).

## 1 · Header responsive del sheet (bug mobile)

La pill "Cambiar lugar" deformaba la barra de la hoja en pantallas chicas.

- Barra de título ahora es `flex-wrap` (`min-h-[52px]`): en <~480px los controles caen a una segunda fila sin pisarse.
- La pill: `max-w-[calc(100%-96px)]`, `shrink`, texto con `nowrap + overflow-hidden + ellipsis` reales, `title` con el nombre completo, altura táctil **40px**, y la palabra "Cambiar" dentro de la propia pill (un solo target claro, lejos de la X).
- Botones de colapsar y cerrar subieron a **36px** (`w-9 h-9`) para separar los targets.
- La hoja pasó de `58dvh` a `62dvh` para compensar la cabecera de dos filas sin cortar contenido.

## 2 · Flujo del asistente en 3 pasos (wizard "¿Cómo llego a…?")

Nuevo `AssistantWizard` (modal propio, `z-[60]`, con stepper 1/3·2/3·3/3):

| Paso | Qué hace | Datos que usa |
|---|---|---|
| **1 · Ubicación** | Confirma el punto de referencia (tras el permiso decorativo de PBI-019) o "Cambiar ubicación" → reabre el selector de lugar y el wizard vuelve con el nuevo punto | `session.lugar` / `assistantRefFromSession` |
| **2 · Paradas cercanas** | Lista las 3 paradas más cercanas (distancia + caminata + badges de líneas); al tocar una, pasa al paso 3 | `nearbyStopsFor(ctx)` (nuevo helper del service) |
| **3 · Destino** | Pregunta "¿A dónde querés ir desde <parada>?" con input + sugerencias en vivo del geocoder; Enter o tocar una sugerencia valida | `searchLocations` |

**Modal final (resultados):** nueva respuesta compuesta `trip-guide` en el service
(`resolveTripGuide`): origen = la parada del paso 2, destino = el texto validado del
paso 3 → muestra el viaje sugerido (líneas, transbordos, minutos) **y** los 1·2·3
colectivos reales en ESA parada con su ETA. Se renderiza en el `AssistantAnswerSheet`
de siempre. Un destino no resuelto → `clarify` con candidatos (la regla de oro sigue viva).

Persistencia: `session.paradaSelId` + `lastQuery.originStopId` → re-tocar el chip
reabre la guía completa (toggle de PBI-019 respetado); el F5 sigue limpiando todo.
Cambiar de lugar invalida la parada elegida.

## 3 · Transición mapa / Modo Viaje al tocar una opción

- **Tocar un colectivo de la lista de llegadas** (en `arrivals` o en la guía final) navega a `/mapas?parada=<id>&linea=<id>` → el mapa enfoca la parada, abre el bubble y **preselecciona la línea**: sus unidades quedan visibles en vivo y su traza resaltada desde el primer frame.
- **CTA "Ver el viaje completo en el mapa"**: la hoja pasa a `idle` (se cierra sola, requisito §3.1) y navega a `/mapas?trip=1&origen=<stopId>&destino=<nombre>&linea=<id>&ramal=<id>` → `/mapas` abre **Modo Viaje**, fija origen (la parada del wizard, ya no el seed genérico) y destino, preselecciona línea/ramal y el `tripFocus` existente encuadra y traza el recorrido con las paradas usadas.
- `resolveLocationPoint` resuelve stopId directamente (sin riesgo del fallback Parque Centenario: null-check en ambos efectos de URL de `/mapas`).
- Los efectos de query de `/mapas` limpian todos los params nuevos (`origen/linea/ramal`) tras consumirlos.

## Archivos

- **Nuevos:** `src/components/home/AssistantWizard.tsx`
- **Modificados:** `assistant-intent-service.ts` (`trip-guide`, `originPoint`, `originStopId`, `nearbyStopsFor`, `resolveTripGuide` — ramas viejas intactas), `assistant-session.ts` + hook (`paradaSelId`, `lastQuery.originStopId`), `AssistantAnswerSheet.tsx` (header responsive + `supplement`/`onOpenTripOnMap`), `AssistantAnswerCard.tsx` (filas de llegadas tocables, render `trip-guide`, `tripMapUrl`), `inicio/page.tsx` (gate del wizard, reanudación, cierre de hoja al navegar), `mapas/page.tsx` (params `origen/linea/ramal`).

## Verificación

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npx tsx scripts/qa-assistant-intents.mts` | **21/21** (18 viejos + `nearbyStopsFor`, `trip-guide`, destino imposible → clarify) |
| `npx eslint` (archivos del feature) | 0 errores nuevos (7 pre-existentes del equipo en mapas quedan fuera de scope) |
| Impeccable detect | `[]` |
| `next build` | ✓ 8 rutas |
| Smoke dev | `/inicio` 200 |

## Corrección post-demo (PBI-021, 2026-09-23)

Probando la demo en vivo se reportó que el wizard **"no pedía el destino"**:
`openTripWizard` tenía un atajo de reapertura (heredado de la regla toggle del
PBI-019) que, si ya existía una guía persistida (`paradaSelId` + último
`trip_plan` con destino), mostraba el resultado viejo **saltándose el wizard
entero**. Fix:

- El chip "¿Cómo llego a…?" **siempre** abre el wizard (tras el gate permiso/lugar).
- Con guía previa, el wizard **reanuda en el paso 3 "Destino"** con la parada y
  el destino cargados en el input: se confirman con un toque o se escribe otro.
  Las flechas hacia atrás muestran los pasos 1 y 2 también precargados.
- `AssistantWizard` acepta `initialStep / initialParadaId / initialDestino`
  aplicados en el reset-on-open (adjusting-state-in-render, sin setState en effect).

Además, la cabecera del sheet pasó a **una sola fila**: pill del lugar a la
izquierda (icono + ellipsis, sin el texto "Cambiar" redundante) y a la misma
altura los botones minimizar y X a la derecha; se eliminó la etiqueta
"ASISTENTE". Revalidado: tsc 0 · eslint 0 nuevos · detect `[]` · `/inicio` 200.
