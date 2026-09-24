# Charla de 10 minutos: qué construimos y por qué

**Para:** reunión del equipo · **Rama:** `feat/home-assistant-intents` (todo en local, nada pusheado)
**Leelo así:** primero el punto 1 y 2 en voz alta si tenés 2 minutos; el resto es para cuando pregunten "¿y cómo funciona?".

## 1. El pedido del cliente, en una frase

El cliente nos dijo: *"nuestros usuarios se hacen cuatro preguntas: cuándo llega el próximo colectivo, cuál es la parada más cercana, cómo voy de un lado a otro, y cuánto me falta para llegar a tomar el bondi"*. Nosotros las estábamos obligando a aprender a usar un mapa. La idea fue **darles una cajita donde tocan o escriben esa pregunta y reciben la respuesta**, directo en el inicio.

## 2. La decisión más importante: NO usamos IA

Parece lo obvio ("pregunta → chatbot"), pero frenemos ahí. Esas cuatro preguntas son un **dominio cerrado**: solo hay 4 tipos de respuesta y los datos (GPS de los colectivos, paradas, planificador de viajes) **ya estaban hechos en el repo**. Un chat con un LLM nos iba a dar: latencia, costo por mensaje, y lo peor — la posibilidad de que *invente* un horario. Elegimos un **parser de intents**: ~150 líneas de reglas que leen la pregunta, la clasifican (con tildes, mayúsculas y todo, porque normalizamos el texto antes), y la mandan al servicio de datos que ya existía. Es auditable, se testea sin abrir el navegador, sale gratis y **no miente**: si no encuentra el lugar, pregunta "¿quisiste decir…?" con 3 candidatos, en vez de inventar.

Ah, y le habla al usuario como habla un porteño: "me da tiempo a caminar", "llegás bien", "apurate".

## 3. Qué se ve en pantalla

En `/inicio` (el dashboard; antes era `/home`, ahora estandarizado), arriba de todo:

- **Una caja de texto**: escribí "¿cuándo llega el 194?" o "como llego a once" y mandá.
- **Cuatro botones (chips)** con las preguntas del cliente, por si escribir es mucho pedirle a un señor en la parada del bondi.
- **Flujo guiado (PBI-019)**: al tocar un chip de ubicación NO salta la respuesta de una — primero aparece un **modal de permiso de ubicación** (decorativo, con copy honesto de demo), después un **selector para elegir la avenida o el lugar donde estás esperando** (autocompletado sobre avenidas y lugares mockeados, con quick chips para la demo), y recién ahí la hoja con los 1·2·3 colectivos y su llegada.
- Cuando respondés, aparece **una hoja que flota arriba del menú de abajo**, con la respuesta y botones para seguir: "¿Cuándo llega?" sobre una parada de la lista, "Ver en el mapa", "Ver todas las llegadas". En su barra de título figura el lugar en uso como botón **"Cambiar lugar"**.
- El chip activo es **toggle**: se toca de nuevo y la hoja se esconde; se vuelve a tocar y **vuelve la misma información** (permiso + lugar persistidos en localStorage) con los minutos refrescados del GPS live. Y si a alguien le **recarga la página (F5), todo se limpia** para poder repetir la demo con otros destinos.
- Si la respuesta es un viaje, el botón "Ver el viaje completo en el mapa" te lleva al mapa **ya abierto en Modo Viaje con el destino cargado**.

Demo sugerida para la reunión (2 min): `npm run dev` → `/inicio` → tocar "¿Cuándo llega el próximo?" → sale el **permiso**, "Permitir (demo)" → **selector**, quick chip "Av. Cabildo" → hoja con llegadas que cambian solas → tocar el chip de nuevo (se esconde) y de nuevo (vuelve igual, fresca) → **F5** y la demo arranca limpia de nuevo.

## 4. Cómo funciona por debajo (por si preguntan)

Flujo: **caja/chips → parser → resolver → hoja de respuestas**.

| Pregunta | Intent | Qué usa por debajo |
|---|---|---|
| ¿Cuándo llega el próximo? | `next_arrival` | GPS en vivo de los colectivos (el mismo feed 1 Hz del mapa) |
| ¿Parada más cercana? | `nearest_stop` | Distancia real a las paradas + minutos caminando |
| ¿Cómo llego a X? | `trip_plan` | El geocoder local que habíamos hecho + el planificador de viajes |
| ¿Me da tiempo a caminar? | `walk_timing` | Compara tus minutos caminando contra la llegada del próximo bondi |

- El parser es una función **pura**: texto adentro, objeto afuera, sin React ni red. Se prueba con `npx tsx scripts/qa-assistant-intents.mts` (18 casos, todos verdes).
- Si el texto no se entiende o el destino no existe en nuestra red, la respuesta es `clarify`: **nunca** respondemos con datos de un lugar equivocado.
- Todo lo demás son componentes de React que consumen esa respuesta.

## 5. Un detalle de higiene que nos ahorró un bug feo

El planificador de /mapas tenía una maña: si no encontraba una dirección, **la anclaba en secreto a Parque Centenario** (la ubicación simulada del demo). Si eso pasaba en el asistente, le diríamos "tu viaje sale 40 minutos" desde un lugar donde el usuario NO está. Extrajimos esas coordenadas a un solo archivo (`src/lib/config/user-location.ts`) con un TODO para conectar la geolocalización real del celular cuando corresponde, y en el asistente el "no encontré" pregunta en vez de adivinar. Hay una prueba de regresión específica para eso.

## 6. Alcances y deudas (para no vender humo)

- **La ubicación todavía es simulada** (Parque Centenario). El día que toquemos `navigator.geolocation`, "parada más cercana" y "¿me da tiempo?" pasan a ser reales sin tocar nada más.
- **Solo conocemos las líneas 65 y 194 con geometría.** Si el usuario está lejos del corredor, el asistente lo dice honestamente ("no encuentro paradas cerca") — no es un bug, es el alcance de la maqueta.
- La página `/parada/[id]` muestra llegadas **por horario simulado**, mientras el asistente muestra **GPS en vivo**: algún día hay que unificarlas. Quedó anotado como deuda.
- El parser entiende es-AR razonablemente escrito; no perdona todo tipo de error de tipeo. Es un trade-off consciente: preferimos preguntar "¿quisiste decir…?" antes que adivinar.

## 7. Archivos para el code review

**Nuevos** (lo grueso del feature):

- `src/lib/services/assistant-intent-service.ts` — parser + resolver (el corazón, 350 líneas, sin React)
- `src/lib/assistant-session.ts` — store del contexto (consentido + lugar + última consulta) con **clear-on-reload** (F5 resetea la demo)
- `src/hooks/use-assistant-session.ts` — hook del store (mismo patrón que use-favorites)
- `src/components/home/LocationConsentModal.tsx` — modal de permiso decorativo
- `src/components/home/PlaceSelector.tsx` — combobox de avenidas/lugares con quick chips
- `src/components/home/AssistantBar.tsx` — caja de texto + 4 chips
- `src/components/home/AssistantAnswerSheet.tsx` — hoja flotante colapsable (reusa `useDragCollapse`)
- `src/components/home/AssistantAnswerCard.tsx` — la respuesta pintada según el tipo
- `src/lib/config/user-location.ts` — la ubicación compartida
- `scripts/qa-assistant-intents.mts` — las 18 pruebas
- `docs/Asistente-Home.md` (+.docx) — el documento técnico

**Modificados** (pocas líneas cada uno):

- `src/app/inicio/page.tsx` — monta todo, suscribe el GPS, guarda el estado
- `src/app/mapas/page.tsx` — acepta `?trip=1&destino=...` y `?parada=...` en la URL
- `src/components/viaje/ViajeHeader.tsx` — usa la constante de ubicación

**También entró en esta sesión** (PBI-018, cambios chicos del review anterior): botón Limpiar en Modo Viaje, la X al borde derecho, y la jerarquía del ESC (primero cancela lo último que tocaste). Y el rename de la ruta `/home` → `/inicio` (estándar en español, con redirect desde la vieja).

## 8. Estado y siguiente paso

Nada comiteado todavía: queríamos mostrarlo primero. Los gates pasaron todos (typecheck, QA, build, Impeccable; el único ruido de eslint son 7 errores viejos del equipo en /mapas que no tocamos). **Propuesta**: revisar juntos esto en la charla, y si gusta, partir en 2 commits limpios — PBI-017 (asistente) y PBI-018 (viaje) — con el docx de backlog regenerado.

El backlog ya está actualizado: `docs/backlog.json` → PBI-017 y PBI-018, exportado a `docs/Backlog-feat-home-assistant-intents.docx`.
