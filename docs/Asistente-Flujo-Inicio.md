# Flujo del asistente en /inicio — permiso, selector de lugar y persistencia (PBI-019)

**Rama:** `feat/home-assistant-intents` · **Fecha:** 2026-09-23
**Depende de:** PBI-017 (intents deterministas) · **Estado:** implementado y verificado, cambios en local (sin commitear, a revisión del equipo)

## 1. Qué cambia respecto de PBI-017

Antes, tocar un chip resolvía y mostraba la hoja de respuesta **de una**. Ahora, los tres chips de ubicación (`¿Cuándo llega el próximo?`, `¿Parada más cercana?`, `¿Me da tiempo a caminar?`) siguen un flujo guiado:

```
idle ──chip──► PERMISO (modal decorativo) ──Permitir──► SELECTOR DE LUGAR ──elegir──► RESPUESTA
                │                                                            ▲
                └── "Elegir otro lugar" ─────────────────────────────────────┘

RESPUESTA ──chip otra vez──► idle (hoja oculta; permiso + lugar + consulta SIGUEN guardados)
idle (con estado) ──chip──► RESPUESTA directa (sin pedir permiso ni lugar de nuevo)
```

- **Permiso decorativo (decisión de producto):** esta demo NO pide `navigator.geolocation` al navegador; el modal lo aclara con honestidad ("usamos una ubicación simulada: Parque Centenario"). Cuando se conecte el GPS real, el único punto de cambio sigue siendo `src/lib/config/user-location.ts` (`TODO(geo-real)`).
- **Selector de lugar:** combobox con autocompletado sobre avenidas (`STREET_INDEX`: Cabildo, Corrientes, Rivadavia, Santa Fe, 9 de Julio…) y lugares mockeados (`KNOWN_POIS` + paradas), más **quick chips** para elegir sin tipear. Enter toma el primer resultado; Escape cancela.
- **Respuesta:** la hoja de PBI-017 muestra los 1·2·3 colectivos y su ETA **en vivo**; si el lugar elegido es una parada exacta, se usa esa parada como referencia.
- **Toggle del chip:** tocar el chip activo esconde la hoja sin borrar nada; al re-tocarlo vuelve el mismo contexto con datos actualizados.
- **En la barra de la hoja** aparece el lugar en uso (p. ej. "Av. Cabildo") como botón **"Cambiar lugar"**, que reabre el selector sin repetir el permiso.

## 2. Persistencia (y su regla de demo)

Store: `src/lib/assistant-session.ts` → localStorage `rutaba_asistente_v1`
Forma: `{ consentido, lugar: {name,address,lat,lng,stopId?}, lastQuery, savedAt }`

| Acción | Resultado |
|---|---|
| Cerrar/reabrir la hoja (toggle del chip) | Conserva permiso + lugar + consulta, con ETAs refrescados |
| Navegar `/inicio` ↔ `/mapas` (dock) | Conserva (navegación client-side, no es reload) |
| **Refresh del navegador (F5)** | **LIMPIA todo** — `Navigation Timing type === "reload"` — para repetir la demo con otros destinos |
| Recarga de otro día con sesión > 12 h | Se ignora (TTL) |
| "Cambiar lugar" en la hoja | Itera destinos sin recargar |

Hook React: `src/hooks/use-assistant-session.ts` — mismo patrón `useSyncExternalStore` + evento `storage` (sync cross-tab) que `use-favorites`, SSR-safe con snapshot vacío.

## 3. Refresco live sin setState-en-effect

La respuesta **se deriva** en `useMemo` desde `activeQuery + session + positions`. El feed GPS de 1 Hz (`subscribeToPositions`, igual que /mapas) recalcula la hoja sola: sin timers, sin efectos, y `eslint react-hooks/set-state-in-effect` conforme. `trip_plan` y `nearest_stop` (distancias estáticas) se recalculan pero su contenido no varía con el GPS.

## 4. Archivos

**Nuevos:**
- `src/lib/assistant-session.ts` — store puro + clear-on-reload + `assistantRefFromSession()`
- `src/hooks/use-assistant-session.ts` — `useAssistantSession()` (setConsentido/setLugar/setLastQuery/reset)
- `src/components/home/LocationConsentModal.tsx` — modal de permiso (dialog accesible, copy demo-honesto)
- `src/components/home/PlaceSelector.tsx` — combobox avenidas/POIs + quick chips

**Modificados:**
- `src/app/inicio/page.tsx` — máquina de fases (`idle|consent|selector|answer`), `answer` derivada por `useMemo`, gate de los 3 chips de ubicación, free-text pasa por el mismo gate, "Cambiar lugar"
- `src/components/home/AssistantAnswerSheet.tsx` — props `contextLabel` + `onChangePlace` (chip de lugar en la barra de título)

**Sin tocar:** parser/resolver de PBI-017 (QA sigue 18/18), `/mapas`, `trip_plan` conserva su atajo directo a destino (sin permiso).

## 5. Verificación

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npx eslint` (6 archivos del feature) | 0 errores nuevos |
| `npx tsx scripts/qa-assistant-intents.mts` | 18/18 ✓ (intactos) |
| Impeccable detect (nuevos + modificados) | `[]` |
| Smoke dev `/inicio` | 200, barra presente |

**Testeo manual sugerido (viewport mobile):**
1. `/inicio` → tocar "¿Cuándo llega el próximo?" → sale **modal de permiso**, no la hoja.
2. "Permitir (demo)" → **selector**; tocar quick chip "Av. Cabildo".
3. Hoja con top-3 llegadas; los minutos cambian solos (1 Hz); la barra dice "Av. Cabildo".
4. Tocar el chip otra vez → hoja oculta. Re-tocar → **vuelve directo la hoja con Av. Cabildo** y ETAs frescos.
5. Botón "Av. Cabildo" en la hoja → cambia a "9 de Julio" → la respuesta se recalcula alrededor del nuevo lugar.
6. **F5** → el chip vuelve a arrancar desde el modal de permiso (demo reiniciable).
7. Escribir "cuando pasa el 65" en la caja → mismo gate; si ya hay estado, responde directo filtrando línea 65.

## 6. Decisiones registradas (del usuario, 2026-09-23)

1. Permiso **decorativo con ubicación simulada** (sin `navigator.geolocation` por ahora).
2. Flujo aplica a los **3 chips de ubicación**; `¿Cómo llego a…?` mantiene su atajo de destino.
3. Persistencia = **contexto guardado + datos live**, y **F5 limpia las elecciones** para repetir la demo con otros destinos.
