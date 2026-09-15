# 06 — Implementaciones reales de algoritmos de routing de transporte público en GitHub

> **Alcance.** Repositorios con código fuente real (no tutoriales ni blogs).
> Solo fuentes primarias: archivos en GitHub, documentación oficial del repo, papers de Microsoft Research / INFORMS, javadoc publicado por el propio proyecto.
>
> **Convención de citas.** Cada enlace apunta al archivo exacto en `refs/heads/<branch>` o `tree/<branch>` del repo en GitHub. Los números de línea son los que devuelve el visor con número de línea de GitHub (formato `<n>: <contenido>`); cuando se cita una API javadoc publicada, se aclara que es la javadoc, no el repo.
>
> **Búsquedas ejecutadas** (≥10): 12 Exa searches + 16 webfetches a GitHub y a la javadoc publicada de R5. Listadas al final.

---

## 0. Tabla maestra de repos

| Repo | URL | Estrellas | Último push / commit | Mantenido | Licencia |
|---|---|---|---|---|---|
| `opentripplanner/OpenTripPlanner` | https://github.com/opentripplanner/OpenTripPlanner | 2.7k | rama `dev-2.x` activa | Sí (producción) | Apache-2 / GPL-2 dual |
| `conveyal/r5` | https://github.com/conveyal/r5 | 403 | rama `dev` activa | Sí (Conveyal) | BSD |
| `motis-project/motis` | https://github.com/motis-project/motis | 584 | rama `master` activa | Sí | Apache-2 |
| `chairemobilite/trRouting` | https://github.com/chairemobilite/trRouting | 28 | rama `master` activa | Sí (Université de Laval) | MIT |
| `planarnetwork/raptor` | https://github.com/planarnetwork/raptor | 119 | rama `master` activa | Sí | MIT |
| `transnetlab/transit-routing` | https://github.com/transnetlab/transit-routing | 91 | rama `main` activa | Académico | MIT |
| `OneBusAway/onebusaway-gtfs-modules` | https://github.com/OneBusAway/onebusaway-gtfs-modules | 148 | rama `main` activa | Sí | Apache-2 |
| `conveyal/gtfs-lib` | https://github.com/conveyal/gtfs-lib | ~250 | rama `master` activa | Sí (Conveyal) | BSD |
| `bliksemlabs/rrrr` | https://github.com/bliksemlabs/rrrr | 175 | 715 commits | Estable, mantenimiento bajo | BSD-2 |
| `raoulvdberge/raptor` | https://github.com/raoulvdberge/raptor | 3 | 2024-08-18 | Hobby | MIT |
| `Kasluk24/jraptor` | https://github.com/Kasluk24/jraptor | 3 | fork de raoulvdberge | Fork inactivo | MIT |
| `naviqore/public-transit-service` | https://github.com/naviqore/public-transit-service | 1 | rama activa | Académico (Hochschule Karlsruhe) | MIT |
| `piemadd/public-transit-service` | https://github.com/piemadd/public-transit-service | 1 | fork de naviqore | Fork | MIT |
| `dmitrykitty/transit-routing-backend` | https://github.com/dmitrykitty/transit-routing-backend | 0 | rama `main`, 74 commits | WIP, Hexagonal + RAPTOR-style | n/d |
| `teogramm/pt-routing` | https://github.com/teogramm/pt-routing | 0 | 96 commits | Hobby C++23 | GPL-3 |
| `lviennot/hl-csa-raptor` | https://github.com/lviennot/hl-csa-raptor | n/d | activo | Académico (INRIA) | n/d |
| `kit-ifv/connection-scan` | https://github.com/kit-ifv/connection-scan | n/d | redirige a `mobiTopp` | Académico (KIT) | n/d |
| `ducminh-phan/CSA` | https://github.com/ducminh-phan/CSA | n/d | activo | Académico | n/d |
| `trainline-eu/csa-challenge` | https://github.com/trainline-eu/csa-challenge | n/d | referencia multi-lenguaje | Comunidad | n/d |
| `ifv-mobitopp/mobitopp` | https://github.com/ifv-mobitopp/mobitopp | n/d | migración a mobiTopp | Académico | n/d |
| `antoine29/geojson2gtfs` | https://github.com/antoine29/geojson2gtfs | n/d | activo | Hobby | n/d |
| `antoine29/geojson2gtfs-flex` | https://github.com/antoine29/geojson2gtfs-flex | n/d | activo | Hobby | n/d |
| `trufi-app/geojson-to-gtfs` | https://github.com/trufi-app/geojson-to-gtfs | n/d | npm `geojson-to-gtfs@0.3.0` | Mantenido | MIT |
| `araichev/make_gtfs` | https://github.com/araichev/make_gtfs | n/d | redirige a `mrcagney/make_gtfs` | Hobby | n/d |
| `conveyal/geom2gtfs` | https://github.com/conveyal/geom2gtfs | n/d | **DEPRECATED** | archivado | BSD |
| `grote/osm2gtfs` | https://github.com/grote/osm2gtfs | 104 | 111 commits | Estable | GPL-3 |
| `MobilityData/awesome-transit` | https://github.com/MobilityData/awesome-transit | 1.8k | 676 commits | Catálogo mantenido por la comunidad | CC0-1 |
| `MobilityData/gtfs-realtime-bindings` | https://github.com/MobilityData/gtfs-realtime-bindings | 440 | 207 commits | Mantenido | Apache-2 |

Fuentes de la tabla: páginas de cada repo listadas arriba; para `otp`/`r5`/`motis` se confirmó leyendo la página de Code.

---

## 1. RAPTOR — implementaciones en GitHub

### 1.1 OpenTripPlanner (Java, OTP2) — la implementación de referencia

OTP2 reemplazó el algoritmo A* por una **Range Raptor + Multi-Criteria Raptor** sobre GTFS y OSM. La documentación interna lo explica en detalle y deja claro qué NO es RAPTOR (no Dijkstra, no priority queue).

- **Documento canónico del paquete (define terminología):**
  https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md
  Define *stop-arrival*, *round*, *range raptor*, *multi-criteria range raptor* y los `RoutingStrategy`. Indica: "Raptor is part of a family of newer algorithms that account for typical processor architecture rather than just theoretical asymptotic complexity."
- **Arquitectura general:**
  https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/ARCHITECTURE.md — sección "Raptor Transit Routing".

**Entry point del servicio:**
- `RaptorService.java` — `raptor/src/main/java/org/opentripplanner/raptor/RaptorService.java` (carpeta raíz del paquete Raptor).
- `RangeRaptor.java` — `raptor/src/main/java/org/opentripplanner/raptor/rangeraptor/RangeRaptor.java`.
- `DefaultRangeRaptorWorker.java` — `raptor/src/main/java/org/opentripplanner/raptor/rangeraptor/DefaultRangeRaptorWorker.java` (no `RangeRaptorWorker.java`; ese nombre no existe en OTP2).
- `RangeRaptorWorkerComposite.java` — `raptor/src/main/java/org/opentripplanner/raptor/rangeraptor/RangeRaptorWorkerComposite.java` — orquesta searches encadenadas (vía-locations).
- `ConcurrentCompositeRaptorRouter.java` — `raptor/src/main/java/org/opentripplanner/raptor/rangeraptor/ConcurrentCompositeRaptorRouter.java`.

**Cómo modela Stop / Route / Trip / StopTime / Transfer / TripPattern (SPI):**
- `RaptorTripSchedule.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorTripSchedule.java` — define `tripIndex()`, `departure(int stopPos)`, `arrival(int stopPos)`.
- `RaptorTripScheduleSearch.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorTripScheduleSearch.java` — la búsqueda binaria de trip boardable.
- `RaptorRoute.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorRoute.java` — `stopIndex(int pos)`, `nStopsInPattern()`.
- `RaptorTransfer.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorTransfer.java` — `stop()`, `durationInSeconds()`, `c1()`.
- `RaptorConstrainedTransfer.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorConstrainedTransfer.java`.
- `RaptorTimeTable.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorTimeTable.java`.
- `RaptorConstrainedBoardingSearch.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorConstrainedBoardingSearch.java`.
- `RaptorTransitDataProvider.java` — `raptor/src/main/java/org/opentripplanner/raptor/spi/RaptorTransitDataProvider.java` (interfaz del SPI).
- `RaptorCostCalculator.java`, `RaptorCostConverter.java` — paquete `spi`.

**Cómo se construye `RaptorTransitData` (adapter del modelo interno al SPI):**
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/RaptorTransitData.java` — 189 líneas.
  - Línea 31: `private final HashMap<LocalDate, List<TripPatternForDate>> tripPatternsRunningOnDate;`
  - Línea 38: `private final List<List<PathTransfer>> transfersByStopIndex;` (transferencias `PathTransfer`, una lista por stop-index).
  - Línea 41: `private final ConstrainedTransferService transferService;` (transferencias *guaranteed / stay-seated* / *constrained*).
  - Línea 109–125: `getTripPatternsForRunningDate(LocalDate)` / `getTripPatternsOnServiceDateCopy` — los `TripPattern` se splitean por día (incluye el día siguiente por trips que cruzan medianoche).
  - Línea 159: `int[] getStopBoardAlightTransferCosts()` en `raptor centi-second units`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/TripPatternForDate.java`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/TripSchedule.java` — implementación concreta de `RaptorTripSchedule`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/mappers/` — paquete con mappers que convierten `TripPattern` → `RaptorRoute`, etc.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/request/RaptorRoutingRequestTransitData.java` — vista filtrada por request (relevante para flex, prioridades, etc).

**Cómo lo invoca el orquestador (search → itineraries):**
- `TransitRouter.java` — `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/router/TransitRouter.java` — 418 líneas.
  - Línea 56: `public static final int NOT_SET = -1;`
  - Línea 73: `private final RouteRequest request;`
  - Línea 92: `private TransitRouter(...)` — wiring del request, `TransitService`, `Graph`, `RaptorConfig<TripSchedule>`, `RaptorRequestTransferCache`, etc.
  - Línea 168: `var raptorTransitData = request.preferences().transit().ignoreRealtimeUpdates() ? transitService.getRaptorTransitData() : transitService.getRealtimeRaptorTransitData();`
  - Línea 196: `var raptorService = new RaptorService<>(raptorConfig, extraSearchForSorlandsbanen);` — único punto de entrada al motor.
  - Línea 197: `var transitResponse = raptorService.route(raptorRequest, requestTransitDataProvider);`
  - Línea 209: `if (OTPFeature.OptimizeTransfers.isOn() && !transitResponse.containsUnknownPaths() && request.allowTransferOptimization()) {` — ahí se enchufa el **post-procesado de transferencias** (`OptimizeTransferService`).
  - Línea 228: `RaptorPathToItineraryMapper<TripSchedule> itineraryMapper = new RaptorPathToItineraryMapper<>(graph, transitService, streetDetailsService, raptorTransitData, transitSearchTimeZero, request);` — convierte `RaptorPath` (SPI puro) en `Itinerary` (modelo de OTP).
  - Línea 230: `List<Itinerary> itineraries = paths.stream().map(itineraryMapper::createItinerary).toList();`
- `RoutingWorker.java` (nivel superior) — `application/src/main/java/org/opentripplanner/routing/algorithm/RoutingWorker.java` — invoca `TransitRouter.route(...)`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/router/AccessEgressFetcher.java` — `accessEgresses.getAccesses()`, `accessEgresses.getEgresses()`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/router/AdditionalSearchDays.java`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/router/FilterTransitWhenDirectModeIsEmpty.java`.
- `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/router/TransitRouterResult.java`.

**Cómo resuelve boarding, alighting y scanning rounds:**
- `package.md` lo explica sin código: una *round* = primero se barre cada ruta que sirve los stops marcados para encontrar el mejor trip, después se aplican transferencias (footpaths). El invariante: al empezar la round k, las primeras k etiquetas `τ₀(p)..τ_{k-1}(p)` son correctas.
- `rangeraptor/standard/` contiene el código del Range Raptor forward/backward (mencionado en `package.md`; los archivos exactos: `ArrivalTimeRoutingStrategy`, `MinTravelDurationRoutingStrategy`).
- `rangeraptor/multicriteria/` — `McTransitWorker.java`, implementa `McRR` (sólo forward; lo explica `package.md`).
- Slack: `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/DefaultSlackProvider.java`.

### 1.2 Conveyal R5 (Java) — McRAPTOR para accessibility analysis

R5 es "Rapid Realistic Routing on Real-world and Reimagined networks". Hace **one-to-many** y **many-to-many** planeando a *muchas* salidas en una ventana. Usa McRAPTOR sobre un grafo de transporte cargado desde GTFS + OSM.

- README del repo:
  https://github.com/conveyal/r5 — "R5 is our routing engine for multimodal (transit/bike/walk/car) networks with a particular focus on public transit."

**Entry point del router:**
- `src/main/java/com/conveyal/r5/profile/McRaptorSuboptimalPathProfileRouter.java` — la clase que hace McRAPTOR con retención de estados subóptimos (usa `SuboptimalDominatingList`). *No existe una clase llamada literalmente `ProfileRouting.java`*; el nombre actual del orquestador es `McRaptorSuboptimalPathProfileRouter`. Confirmado en `tree/dev/src/main/java/com/conveyal/r5/profile/`.
- `src/main/java/com/conveyal/r5/profile/FastRaptorWorker.java` — 952 líneas, el worker McRAPTOR. Único worker en el paquete `profile/` (no hay `RaptorWorker.java` separado).
- `src/main/java/com/conveyal/r5/profile/ProfileRequest.java` — los parámetros del request (departure time, transport modes, etc).
- `src/main/java/com/conveyal/r5/profile/RaptorState.java` — estado de una round.
- `src/main/java/com/conveyal/r5/profile/DominatingList.java` / `SuboptimalDominatingList.java` / `FareDominatingList.java` — la estructura pareto.
- `src/main/java/com/conveyal/r5/profile/Path.java` / `PathWithTimes.java` / `StreetPath.java` — reconstrucción del path.
- `src/main/java/com/conveyal/r5/profile/PerTargetPropagater.java` — propagador para one-to-many.
- `src/main/java/com/conveyal/r5/profile/FrequencyRandomOffsets.java` — soporte para frecuencias / headway-based lines.

**Cómo se construye la red (TransitNetwork + TransferGraph):**
- El grafo de transporte se llama **`TransportNetwork`** (no `TransitNetwork`). *No existe `NetworkConstr`*: la construcción se hace desde `TransportNetwork.fromFeeds(osmSourceFile, feeds, config)` o `fromFiles(...)`.
- Fuente: javadoc publicada por Conveyal — http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransportNetwork.html
- `src/main/java/com/conveyal/r5/transit/TransitLayer.java` — la capa de tránsito del `TransportNetwork` (el `TransitLayer` *es* lo que en la pregunta llaman "TransitNetwork" en R5). Contiene:
  - `stopIdForIndex`, `stopNames`, `streetVertexForStop`, `stopToVertexDistanceTables`, `transfersForStop`, `routes`.
  - `scenarioCopy(...)` para soportar escenarios sin tocar la red base.
- `src/main/java/com/conveyal/r5/transit/TripPattern.java` y `src/main/java/com/conveyal/r5/transit/TripSchedule.java` — un TripPattern agrupa trips con misma stop-sequence.
- `src/main/java/com/conveyal/r5/transit/RouteInfo.java`, `RouteTopology.java`.
- `src/main/java/com/conveyal/r5/transit/GtfsTransferLoader.java` — carga los transfers desde `transfers.txt`.
- `src/main/java/com/conveyal/r5/transit/FilteredPattern.java` / `FilteredPatterns.java` / `FilteredPatternCache.java` — filtrado de patrones para mode/service.
- `src/main/java/com/conveyal/r5/transit/PickDropType.java` — pickup/drop-off type.
- `src/main/java/com/conveyal/r5/transit/TransferFinder.java` — **cómo se generan los transfers OSM-walking** (ver §6).
- `src/main/java/com/conveyal/r5/point_to_point/builder/` — carpeta del builder de un query point-to-point:
  - `PointToPointQuery.java`
  - `RouterInfo.java`
  - `SpeedConfig.java` / `SpeedUnit.java`
- `src/main/java/com/conveyal/r5/analyst/` — paquetes para el modo análisis (accesibilidad), usan los mismos workers McRAPTOR pero en grilla:
  - `TravelTimeComputer.java`, `TravelTimeReducer.java`, `AccessibilityResult.java`, `NetworkPreloader.java`.

**Cómo se modela Stop / Route / Trip / StopTime / Transfer:**
- `stopVertexForStop` mapea stop-index → street-vertex (en `TransitLayer`).
- `transfersForStop` mapea stop → lista de transfers GTFS (de `transfers.txt`).
- `streetTransfers` (en `TransferFinder.findTransfers()`) — packed pairs `[targetStopIndex, distance]` por source stop.

### 1.3 `planarnetwork/raptor` (TypeScript, npm `raptor-journey-planner`)

Implementación directa del paper Delling/Pajor/Werneck 2012, sin mcRAPTOR pero con **range query (rRaptor)** y **Transfer Pattern query**.

- Carpeta `src/raptor/`:
  - https://github.com/planarnetwork/raptor/blob/master/src/raptor/RaptorAlgorithm.ts — 106 líneas.
    - Línea 27: `public scan(origins: Origins, date: DateNumber): [ConnectionIndex, Arrivals] {` — el orquestador.
    - Línea 33: `while (markedStops.length > 0) {` — bucle de *rounds*.
    - Línea 36: `this.scanRoutes(results, tripScanner, markedStops);` — escaneo de rutas.
    - Línea 37: `this.scanTransfers(results, markedStops);` — aplicación de transferencias (footpaths).
    - Línea 41: `private scanRoutes(...)` — la round en sí.
    - Línea 51: `let boardingPoint = -1;` y `let trip = NO_TRIP;` — el cursor de trip.
    - Línea 60: `if (this.routes.canDropOff(pi) && arrival < results.bestArrival(stop)) {` — alighting: si el trip permite dropoff en el stop y mejora, se setea.
    - Línea 65: `else if (this.routes.canPickUp(pi) && previousArrival !== NOT_REACHED && previousArrival < arrival) {` — boarding: si el previousArrival mejora, buscamos un trip anterior (`tripScanner.earliestTrip(...)`).
  - https://github.com/planarnetwork/raptor/blob/master/src/raptor/TripScanner.ts — 76 líneas.
    - Línea 35: `public startRoute(cursor: RouteCursor): void {` — la `scanPosition` arranca en `cursor.numTrips - 1`.
    - Línea 47: `public earliestTrip(cursor: RouteCursor, position: number, time: Time): number {` — itera trips hacia atrás hasta encontrar el primero reachable y corriendo el día (`runsToday` es un bit-packed calendar).
  - https://github.com/planarnetwork/raptor/blob/master/src/raptor/Connection.ts — define tipos puros:
    - Línea 8: `export type Connection = [route: RouteIdx, trip: number, from: number, to: number];`
    - Línea 11: `export type TransferIdx = number;`
    - Línea 14: `export type ConnectionIndex = (Connection | TransferIdx)[][];` — sparse index por round.
  - `src/raptor/RouteCursor.ts`, `Queue.ts` (`RouteQueue`), `ScanResults.ts`.
- Carpeta `src/network/`:
  - https://github.com/planarnetwork/raptor/blob/master/src/network/Network.ts — 321 líneas.
    - Línea 30: `export function createNetwork(feed: GTFSFeed, date?: Date): Network {` — toma GTFS y arma la red.
    - Línea 65–110: arma `stopOffsets`, `stopTimesBase`, `tripOffsets`, `flags`, `arrivals`, `departures` en `SharedMemory` (Int32Array).
    - Línea 192: `function routeSignature(stops: StopIdx[], calls: StopTime[]): string` — la firma de ruta = secuencia de stops + pickup/dropoff flags.
    - Línea 209: `function overtakes(latest: StopTime[], calls: StopTime[]): boolean` — un trip es de la misma ruta si no *overtakes* a un trip anterior (necesario porque el algoritmo recorre los trips hacia atrás).
  - `src/network/Timetable.ts` — la estructura plana.
  - `src/network/TripCalendar.ts` — `createTripCalendar(networkTrips, startDate, endDate)`, bit-packed.
  - `src/network/SharedMemory.ts` — `sharedInt32Array`, `sharedUint8Array`.

### 1.4 `transnetlab/transit-routing` (Python)

Repo académico con RAPTOR, rRAPTOR, HypRAPTOR, TBTR, rTBTR, HypTBTR, MHypTBTR, Transfer Patterns, CSA, y Time-Expanded Dijkstra. Cita Agarwal & Rambha 2024 (IEEE T-ITS).

- Lista de algoritmos: https://github.com/transnetlab/transit-routing/blob/main/README.md
- https://github.com/transnetlab/transit-routing/tree/main/Algorithms/RAPTOR — carpeta con:
  - https://github.com/transnetlab/transit-routing/blob/main/Algorithms/RAPTOR/std_raptor.py — RAPTOR estándar (referencia limpia y comentada).
    - Línea 22: `def raptor(SOURCE, DESTINATION, D_TIME, MAX_TRANSFER, WALKING_FROM_SOURCE, CHANGE_TIME_SEC, ...)` — API única.
    - Línea 60: `for k in range(1, MAX_TRANSFER + 1):` — cada iteración es una *round*.
    - Línea 61: `Q.clear()` y luego `while marked_stop: ... for route in routes_serving_p: ... Q[route] = min(stp_idx, Q[route])` — construcción de la cola de rutas con earliest stop-index (optimización clave del paper).
    - Línea 79: `for route, current_stopindex_by_route in Q.items(): ...` — escaneo de cada ruta.
    - Línea 84: `if current_trip_t != -1 and current_trip_t[current_stopindex_by_route][1] < min(star_label[p_i], star_label[DESTINATION]):` — alighting.
    - Línea 91: `if current_trip_t == -1 or label[k - 1][p_i] + change_time < current_trip_t[current_stopindex_by_route][1]:` — boarding: prueba a subir a un trip más temprano.
  - https://github.com/transnetlab/transit-routing/blob/main/Algorithms/RAPTOR/rraptor.py — range RAPTOR.
  - https://github.com/transnetlab/transit-routing/blob/main/Algorithms/RAPTOR/hypraptor.py — HypRAPTOR (preprocessing con hipergrafo).
  - https://github.com/transnetlab/transit-routing/blob/main/Algorithms/RAPTOR/raptor_functions.py — helpers (`get_latest_trip_new`, `initialize_raptor`, etc).
- https://github.com/transnetlab/transit-routing/tree/main/Algorithms/TBTR — Trip-Based Transit Routing (Witt 2015).
- https://github.com/transnetlab/transit-routing/tree/main/Algorithms/CSA — Connection Scan Algorithm.
- https://github.com/transnetlab/transit-routing/tree/main/Algorithms/TIME_EXPANDED_DIJKSTRA — baseline.
- https://github.com/transnetlab/transit-routing/tree/main/Algorithms/TRANSFER_PATTERNS — Bast/Hertel/Storandt.

### 1.5 `naviqore/public-transit-service` (Java, Spring Boot, GTFS + RAPTOR)

https://github.com/naviqore/public-transit-service/ — fork `piemadd/public-transit-service` (1 star, fork de naviqore, contributors 5, último push 2024-10-09).

- Módulos Maven: `naviqore-raptor`, `naviqore-gtfs`, `naviqore-public-transit-service`, `naviqore-utils`.
- Cita el paper Delling/Pajor/Werneck 2012 como referencia.

### 1.6 `raoulvdberge/raptor` + fork `Kasluk24/jraptor` (Java)

Implementación *directa* del paper, didáctica, en `src/main/java/com/raoulvdberge/raptor/`. 3 stars, MIT, contributors 2 (raoulvdberge y raoulvdberge en jraptor), último push 2024-08-18. Sin GTFS loader (hay que implementar los providers).

- Repo: https://github.com/raoulvdberge/raptor
- README recomienda `InMemoryRaptorFactory` para data sets pequeñas, o implementar las interfaces en `raptor/src/main/java/com/raoulvdberge/raptor/provider/` para producción.
- Fork: https://github.com/Kasluk24/jraptor — fork con la misma implementación.

### 1.7 `bliksemlabs/rrrr` — "R4" (C)

> RRRR (usually pronounced R4) is a C-language implementation of the RAPTOR public transit routing algorithm. It is the core routing component of the Bliksem journey planner.

- Repo: https://github.com/bliksemlabs/rrrr — 175 stars, 715 commits, BSD-2-Clause.
- Archivos clave (todos a la raíz):
  - https://github.com/bliksemlabs/rrrr/blob/master/router.c — orquestador.
  - https://github.com/bliksemlabs/rrrr/blob/master/worker.c — worker que ejecuta RAPTOR.
  - https://github.com/bliksemlabs/rrrr/blob/master/tdata.h` y `tdata.c` — el *column-store timetable* cargado desde GTFS.
  - https://github.com/bliksemlabs/rrrr/blob/master/profile.c — el search para time-window queries.
  - https://github.com/bliksemlabs/rrrr/blob/master/transfers.py` y `timetable.py` — scripts Python para construir el timetable desde GTFS (lee `gtfsdb.py`).
  - https://github.com/bliksemlabs/rrrr/blob/master/router.h` — definición de tipos.
- Diseño: cada worker es un proceso, memoria mapeada, sin alocación dinámica en el inner loop. README: "scratch buffer that is reused from one request to the next".

### 1.8 `dmitrykitty/transit-routing-backend` (Java, Spring Boot, Hexagonal, RAPTOR-style)

- Repo: https://github.com/dmitrykitty/transit-routing-backend — 0 stars, 74 commits, WIP.
- "The project is centered around a RAPTOR-style routing approach, chosen because it is better suited to public transport than classic shortest-path algorithms on a static graph."
- Hexagonal (Ports & Adapters), JDBC batching para GTFS ingestion, datasets con 1M+ records.
- No se inspeccionó el código del router en profundidad (no aparece directorio público estable de la implementación; el README es la única fuente).

### 1.9 `teogramm/pt-routing` (C++)

- Repo: https://github.com/teogramm/pt-routing — 0 stars, 96 commits, GPL-3, C++23.
- "C++ implementation of the RAPTOR public transport routing algorithm, with more algorithms possibly coming in the future."
- Implementa RAPTOR original (sin walking transfers contados como transfers). Transfers = aproximación en línea recta + velocidad de caminata, con un *callback* para reemplazarlo por OSM-based walking.

### 1.10 `lviennot/hl-csa-raptor` (C++) — Hub labelling CSA + RAPTOR

- Repo: https://github.com/lviennot/hl-csa-raptor
- Variantes de CSA y RAPTOR con **unrestricted walking** via hub-labelling sobre el footpath graph. Cita el paper de hub-labelling.

### 1.11 Paper original (fuente primaria, no es GitHub pero el usuario pidió el paper)

- Delling, Pajor & Werneck, *Round-Based Public Transit Routing*, ALENEX 2012:
  https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf
  - Describe la multilabel `(τ₀(p), τ₁(p), ..., τ_K(p))`, el invariante, y la round k: stage 1 = inicializar τ_k(p) = τ_{k-1}(p); stage 2 = procesar cada ruta (mantiene `et(r, •)` cached); stage 3 = aplicar footpaths. Cada ruta se escanea al menos una vez por round. Running time total: `O(K(Σ|r| + |T| + |F|))`.
- Delling, Pajor & Werneck, *Round-Based Public Transit Routing*, Transportation Science 2014 (versión revista):
  https://pubsonline.informs.org/doi/10.1287/trsc.2014.0534

---

## 2. CSA — Connection Scan Algorithm, implementaciones

### 2.1 `chairemobilite/trRouting` (C++)

> Transit routing server app written in C++ using the Connection Scan Algorithm including flexible parameters.
> With random origin and destination (multiple accessible stops at origin and destination): ~150 ms for access and egress footpaths calculation, ~8 ms for CSA two-way calculation.

- Repo: https://github.com/chairemobilite/trRouting — 28 stars, 723 commits, master activo.
- Documentación API: https://chairemobilite.github.io/trRouting/

**Estructura del proyecto** (carpetas en `tree/master`):
- `connection_scan_algorithm/` — implementación activa del CSA.
- `trip_based_algorithm/` — Trip-Based Algorithm (TBA) de Witt 2015 (no released aún).
- `include/` — headers principales.

**Cómo modela Connection:**
- En `connection_scan_algorithm/include/calculator.hpp` el archivo de cabecera declara explícitamente los arrays de connections:
  - Línea 49: `enum connectionIndexes : short { STOP_DEP = 0, STOP_ARR = 1, TIME_DEP = 2, TIME_ARR = 3, TRIP = 4, CAN_BOARD = 5, CAN_UNBOARD = 6, SEQUENCE = 7 };`
  - Línea 75: `std::vector<std::tuple<int,int,int,int,int,short,short,int>> forwardConnections;` — comentario: "tuple: initialDepartureTimeSecondsStopIndex, arrivalStopIndex, departureTimeSeconds, arrivalTimeSeconds, tripIndex, canBoard, canUnboard, sequence in trip".
  - Línea 76: `std::vector<std::tuple<int,int,int,int,int,short,short,int>> reverseConnections;`
  - Línea 79: `std::vector<std::pair<int,int>> accessFootpaths; // pair: accessStopIndex, walkingTravelTimeSeconds`.
  - Línea 80: `std::vector<std::pair<int,int>> egressFootpaths;`
  - Línea 73: `std::vector<std::tuple<int,int,int>> footpaths; // tuple: departingStopIndex, arrivalStopIndex, walkingTravelTimeSeconds`.
  - Línea 67: `std::vector<int> stopsTentativeTime; // arrival time at stop (MAX_INT if not yet reached or unreachable)`.
  - Línea 74: `std::vector<int> tripsEnterConnection; // index of the entering connection for each trip index` (parent pointer para reconstruir el path).

**Entry point y archivos `src`:**
- https://github.com/chairemobilite/trRouting/blob/master/connection_scan_algorithm/src/calculator.cpp — `Calculator::calculate(bool resetAccessPaths)` es el punto de entrada: hace forward, opcionalmente reverse, y emite `RoutingResult`.
- https://github.com/chairemobilite/trRouting/blob/master/connection_scan_algorithm/src/forward_calculation.cpp — el algoritmo forward en sí.
- https://github.com/chairemobilite/trRouting/blob/master/connection_scan_algorithm/src/reverse_calculation.cpp.
- https://github.com/chairemobilite/trRouting/blob/master/connection_scan_algorithm/src/initializations.cpp / `preparations.cpp` / `resets.cpp`.
- https://github.com/chairemobilite/trRouting/blob/master/connection_scan_algorithm/src/forward_journey.cpp / `reverse_journey.cpp` — reconstrucción del path.
- https://github.com/chairemobilite/trRouting/blob/master/connection_scan_algorithm/src/transit_routing_http_server.cpp` — endpoint HTTP.
- Subdirectorios `include/`, `obj/`, `old_src/`, `tests/`.

**Struct Trip y Route (referenciados desde Connection):**
- https://github.com/chairemobilite/trRouting/blob/master/include/trip.hpp — `struct Trip { unsigned long long id; routeId; routePathId; routeTypeId; agencyId; serviceId; };` (37 líneas). Sólo metadatos; los horarios reales viven en el array `forwardConnections` / `reverseConnections`.
- https://github.com/chairemobilite/trRouting/blob/master/include/route.hpp — definición de `Route`.
- https://github.com/chairemobilite/trRouting/blob/master/include/stop.hpp — `struct Stop`.
- https://github.com/chairemobilite/trRouting/blob/master/include/point.hpp, `parameters.hpp`, `routing_result.hpp`, `osrm_fetcher.hpp`, `database_fetcher.hpp`, `cache_fetcher.hpp`, `gtfs_fetcher.hpp`, `csv_fetcher.hpp`.

**Dependencias externas:**
- OSRM (necesario correr en paralelo para footpaths): ver README y referencias.
- PostgreSQL (pqxx) — alternativa a CSV para cargar el feed.

### 2.2 `ducminh-phan/CSA` (C++)

- Repo: https://github.com/ducminh-phan/CSA — implementación C++ académica con `--hl` (hub-labelling), `--profile` y `--ranked` modes.

### 2.3 `trainline-eu/csa-challenge` — multi-lenguaje, referencia

- Repo: https://github.com/trainline-eu/csa-challenge — Captain Train / Trainline benchmark.
- README describe el algoritmo y ofrece una implementación de referencia en C++11 (`g++ --std=c++11 -O3 -o csa_cpp csa.cc`).
- El README reza: "The timetable is expressed by a collection of tuples (departure station, arrival station, departure timestamp, arrival timestamp). Every tuple is called a *connection*." Luego define `arrival_timestamp[s]`, `in_connection[s]` y el main loop.

### 2.4 `kit-ifv/connection-scan` (Java)

- Repo: https://github.com/kit-ifv/connection-scan — KIT Karlsruhe, precursor del CSA en `mobiTopp`.
- Pre-requisitos de inicialización:
  1. Stop ids en `[0..n]`.
  2. "Connections are not allowed to start and end at the same stop. Those connections will be ignored."
  3. "Connections are not allowed to arrive before they depart. Due to this, travelling back in time is not possible."
- Integración: redirige a https://github.com/ifv-mobitopp/mobitopp donde se mantiene actualmente.

### 2.5 `lviennot/hl-csa-raptor` — HLCSA (C++)

- Repo: https://github.com/lviennot/hl-csa-raptor — variantes CSA y RAPTOR con unrestricted walking usando hub-labelling del footpath graph. Datos en https://files.inria.fr/gang/graphs/public_transport/.
- Queries soportadas: earliest arrival, multi-criteria (arrival + transfers + walking), profile.

### 2.6 `transnetlab/transit-routing` — Python, académico

- https://github.com/transnetlab/transit-routing/tree/main/Algorithms/CSA — implementación canónica del paper Dial / Strasser para CSA. Status: Complete. Algoritmos One-To-Many CSA: "To be updated soon".

### 2.7 `kaligrafy/trRouting` vs `chairemobilite/trRouting`

- Repo original: https://github.com/kaligrafy/trRouting — fork histórico.
- Repo mantenido actual: https://github.com/chairemobilite/trRouting — 28 stars, 13 forks.

### 2.8 Paper original (fuente primaria, no GitHub)

- Strasser, *Intriguingly Simple and Fast Transit Routing*, SEA 2013:
  https://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf

---

## 3. OTP2 internals (más allá del RaptorTransitData de §1.1)

### 3.1 Mappers SPI ↔ dominio OTP

Carpeta `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/mappers/`:
- https://github.com/opentripplanner/OpenTripPlanner/tree/dev-2.x/application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/mappers
- Contiene: `RaptorRequestMapper.java`, `DirectTransitRequestMapper.java`, y los que convierten `TripPattern`, `TripTimes`, `Stop` al SPI Raptor.

### 3.2 Cost

Carpeta `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/cost/`: cálculo de `c1` (costo generalizado) y `c2`.

### 3.3 Frequency

Carpeta `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/frequency/`: soporte para líneas headway-based (no usan `TripSchedule` literal sino `FrequencyTripSchedule`).

### 3.4 Request

Carpeta `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/request/`:
- `RaptorRoutingRequestTransitData.java` (mencionado en TransitRouter línea 297).
- `DefaultTransitDataProviderFilter.java` — filtra rutas/trips según preferencias del request.
- `RaptorRequestTransferCache.java` (referenciado en `RaptorTransitData.java` imports).

### 3.5 Transfer optimization (post-Raptor)

Carpeta `application/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/`:
- https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/package.md — documenta los 7 goals de la optimización:
  - "OTP2 handles transfers differently than OTP1. In OTP1, transfers were optimized by applying a cost for each transfer edge during the search. In OTP2, finding the best transfers is done partially during routing and then improved in a post-processing step."
  - Sub-paquetes: `api`, `configure`, `model`, `services`.
  - Clases: `OptimizeTransferService.java` (entry point), `TransferGenerator.java`, `OptimizePathService.java`, `MinCostFilterChain.java`, `TransitPathLegSelector.java`, `OptimizedPathTail.java`.
- Activado por flag `OTPFeature.OptimizeTransfers` (ver `TransitRouter.java` línea 209).
- Reglas: `StaySeated=100`, `Guaranteed=10`, `Preferred=2`, `Recommended=1`, `Allowed=0`, `NotAllowed=-1000`.

### 3.6 Real-time updaters

Carpeta `application/src/main/java/org/opentripplanner/routing/algorithm/raptoradapter/transit/`: `RealTimeRaptorTransitDataUpdater` (citado en el comentario de `RaptorTransitData` constructor shallow-copy).

### 3.7 Debug logging

Carpeta `raptor/src/main/java/org/opentripplanner/raptor/rangeraptor/debug/` — implementación del debugger descrito en `package.md`:
- "The Raptor code has build in support for debugging a routing request. A normal travel search follow millions of paths and at each stop each path is ACCEPTED, REJECTED and/or eventually DROPPED."
- Eventos: `DebugHandler.java`, `DebugHandlerFactory.java`, `DebugRequest.java` (en `raptor/src/main/java/org/opentripplanner/raptor/api/request/DebugRequest.java`).
- Test logger: `TestDebugLogger` (en `moduletests`).
- También: `rangeraptor/internalapi/DebugHandler.java` (referenciado en package.md).

---

## 4. R5 internals (más allá de §1.2)

### 4.1 Directorio `transit/`

https://github.com/conveyal/r5/tree/dev/src/main/java/com/conveyal/r5/transit:
- `TransitLayer.java` — capa de tránsito del `TransportNetwork` (la estructura central: stop arrays, route arrays, transfers, distance tables).
- `TransportNetwork.java` — el contenedor que une `StreetLayer` + `TransitLayer` + `fareCalculator`. Javadoc: http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransportNetwork.html
- `TransportNetworkCache.java` — cache para redes.
- `TransportNetworkException.java`, `DuplicateFeedException.java`.
- `TripPattern.java` / `TripSchedule.java` — modelo GTFS cargado.
- `RouteInfo.java`, `RouteTopology.java`.
- `GtfsTransferLoader.java` — carga transfers.txt de GTFS.
- `TransferFinder.java` — ver §6.
- `FilteredPattern.java` / `FilteredPatterns.java` / `FilteredPatternCache.java` — filtrado por mode/service.
- `PickDropType.java`.

### 4.2 Directorio `streets/`

https://github.com/conveyal/r5/tree/dev/src/main/java/com/conveyal/r5/streets:
- `StreetRouter.java` — javadoc: "This routes over the street layer of a TransitNetwork. It is a throw-away calculator object that retains routing state after the search is finished."
- API: `setOrigin(...)`, `route()`, `getReachedStops()`, `transitStopSearch`, `quantityToMinimize = RoutingVariable.DISTANCE_MILLIMETERS`.

### 4.3 Directorio `analyst/`

https://github.com/conveyal/r5/tree/dev/src/main/java/com/conveyal/r5/analyst:
- `TravelTimeComputer.java` — entry point del cómputo one-to-many para análisis.
- `TravelTimeReducer.java` y derivados (`AccessibilityResult`, `Bootstrap`, `TemporalDensityResult`).
- `PointSet.java`, `Grid.java`, `WebMercatorGridPointSet.java` — los puntos de demanda.
- `LinkageCache.java` — cache de linkages punto↔red.
- `NetworkPreloader.java` — pre-carga el grafo antes de cada request.
- `PathScorer.java` — score de un path para isócronas.

### 4.4 Directorio `point_to_point/builder/`

https://github.com/conveyal/r5/tree/dev/src/main/java/com/conveyal/r5/point_to_point/builder:
- `PointToPointQuery.java` — query point-to-point (cliente).
- `RouterInfo.java`, `SpeedConfig.java`, `SpeedUnit.java` — config del router.

### 4.5 Nota sobre nombres que pidió el usuario

- `TransitNetwork.java` — **no existe** con ese nombre; la clase es **`TransportNetwork`** (javadoc oficial). El paquete `transit/` contiene `TransitLayer`, `TransportNetwork`, etc.
- `ProfileRouting.java` — **no existe** con ese nombre; la clase router del perfil es **`McRaptorSuboptimalPathProfileRouter.java`** en `profile/`.
- `NetworkConstr` — **no existe**; no hay builder con ese nombre. El network se construye vía `TransportNetwork.fromFeeds(...)` / `fromFiles(...)` (factory methods estáticos).

---

## 5. MOTIS internals

MOTIS (Modular Open Transportation Information System) es C++. Routing de público escrito sobre la lib `nigiri`; los transfer paths se computan usando `osr` (el router de OSM propio del proyecto).

- Repo: https://github.com/motis-project/motis — 584 stars, 155 forks, master activo.
- Lib complementaria: `motis-project/nigiri` (41 stars) — *"a very memory efficient and fast public transport routing core"*. El concepto clave: **`route_idx_t`** "groups transports based on their stop sequence and other factors that are relevant for routing".
  > "The routing algorithm will only look at the first departure of each route. This is sufficient because the grouping of transports into routes is done in a way that a later departure on the same route cannot yield a better journey. This way, all later departures can be discarded."
  > https://github.com/motis-project/nigiri — README.
- Lib complementaria: `motis-project/ppr` (9 stars) — *"Per Pedes Routing — Personalized Pedestrian Routing for Mobility Impaired Persons"*.

### 5.1 Archivos clave de routing

- `src/rt/auser.cc` — el *end point* que arma el plan one-to-many. Header `include/motis/rt/auser.h`.
- `include/motis/rt/rt_metrics.h` — métricas del router.

### 5.2 Generador de footpaths (transferencias)

- https://github.com/motis-project/motis/blob/master/src/compute_footpaths.cc — 250 líneas.
  - Línea 53: `elevator_footpath_map_t compute_footpaths(osr::ways const& w, osr::lookup const& lookup, osr::platforms const& pl, nigiri::timetable& tt, platform_matches_t const& matches, way_matches_storage const* way_matches, osr::elevation_storage const* elevations, std::vector<routed_transfers_settings> const& settings) { ... }`.
  - Línea 76–82: build del r-tree de locations para *in-radius queries*.
  - Línea 127–142: por cada location, `loc_rtree.in_radius(...)` para candidatos, luego `osr::route_one_to_many(...)` con el perfil (foot, wheelchair, etc.) hasta `mode.max_duration_`.
  - Línea 152–157: por cada neighbor con resultado, genera `n::footpath{n, duration}` y lo guarda en `transfers[l]`. Si el profile es wheelchair, también registra `elevator_in_paths_` (nodos con `is_elevator()`).
  - Línea 162–174: lógica de `extend_missing_` — para GTFS stops que no tenían footpath, si la distancia es < 100 m, agrega uno equivalente (a 0.7 m/s, en minutos).
  - Línea 192–203: construye los `footpaths_out_` y `footpaths_in_` por profile, y llama a `n::loader::build_lb_graph<direction>(tt, profile_idx)` — usa lower-bound graphs para *reverse* queries.

### 5.3 Otros archivos relevantes

- `src/match_platforms.cc` — match entre GTFS stops y nodos OSM (plataformas).
- `src/adr_extend_tt.cc` — extiende el timetable cuando hay cambios (update_rtt_td_footpaths.cc).
- `src/route_shapes.cc` — extracción de shapes desde GTFS.
- `src/import.cc` — el *importer* principal.
- `src/journey_to_response.cc` — convierte resultado del router a la respuesta HTTP/JSON.
- `src/direct_filter.cc` — filtra itinerarios directos vs transit.
- `src/parse_location.cc`, `src/place.cc`, `src/get_stops_with_traffic.cc`.
- `src/timetable/clasz_to_mode.cc` y `src/timetable/modes_to_clasz_mask.cc` — mapeo de `class_of_service` GTFS a modos MOTIS.
- `include/motis/rt/` — único subdirectorio de headers públicos para routing.

### 5.4 Diseño de algoritmo

- No hay una clase `RAPTOR` en MOTIS — la búsqueda se hace en nigiri. `route_idx_t` es la abstracción equivalente a la *ruta* en RAPTOR.
- El README de nigiri (citado arriba) lo dice explícitamente: el algoritmo "sólo mira la primera salida de cada route" — es exactamente la optimización de RAPTOR.
- Para queries *reverse*, MOTIS construye un **lower-bound graph** (ver `build_lb_graph` en compute_footpaths.cc línea 200) — equivalente al `MinTravelDurationRoutingStrategy` de OTP2.

### 5.5 Wiki externa

- https://github.com/public-transport/transitous/wiki/MOTIS-Notes — notas sobre ppr vs osrm-foot vs Valhalla:
  > "ppr can do profile-based routing and is thus needed for foot routing, osrm-foot is significantly faster".
  > "Valhalla might become an alternative in the future (it also offers profiles), but according to Felix currently doesn't expose 1:1 Dijkstra routing".

---

## 6. Generación de transfers (transfer graph)

### 6.1 OTP2 — `DirectTransferGenerator`

- https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/transfer/DirectTransferGenerator.java — 556 líneas.
  - Línea 47: `private final Duration defaultMaxTransferDuration;`
  - Línea 50: `private final List<RouteRequest> transferRequests;` (lista de requests que generan profiles de transfer distintos).
  - Línea 51: `private final Map<StreetMode, TransferParametersForMode> transferParametersForMode;`
  - Línea 87: `public void buildGraph() { ... }` — el método principal.
  - Línea 144: `bikesAllowedStops.addAll(emptyStops);` — workaround para que trenes con bikes puedan cambiar plataforma.
  - Línea 155: `if (stop.transfersNotAllowed()) { return; }` — skip explícito.
  - Línea 197–208: llamadas a `calculateDefaultTransfers`, `calculateFlexTransfers`, `calculateCarsAllowedTransfers`, `calculateBikesAllowedTransfers` (separación por modo).
  - Línea 215: `LOG.debug("Linked stop {} with {} transfers to stops with different patterns.", stop, distinctTransfers.size());`.
  - Línea 253: `private NearbyStopFinder createNearbyStopFinder() {` — factory.
  - Línea 258: `if (!graph.hasStreets) { ... finder = new StraightLineNearbyStopFinder(...) } else { finder = StreetNearbyStopFinder.of(null).build(); }` — dos strategies según haya OSM.
  - Línea 270–271: `if (OTPFeature.ConsiderPatternsForDirectTransfers.isOn()) { return new PatternConsideringNearbyStopFinder(transitService, finder); } else { return finder; }` — opcionalmente, sólo el closest stop por *trip pattern* (evita explosión combinatoria).
  - Línea 422–453: `createPathTransfer(...)` — crea `PathTransfer` con `from`, `to`, `distance`, edges, modes; usa `TransferKey` para deduplicar.
- `NearbyStopFinder.java` (citado en javatips) — el motor subyacente:
  - `findNearbyStopsConsideringPatterns(Vertex vertex)` — nearest stop on each trip pattern, filtrado.
  - `findNearbyStopsViaStreets(originVertex)` — usa `EarliestArrivalSearch` con `walkSpeed`.
  - `findNearbyStopsEuclidean(originVertex)` — fallback en línea recta.
  - `StopAtDistance { TransitStop tstop; double dist; LineString geom; List<Edge> edges; }`.
- `application/src/main/java/org/opentripplanner/place/nearbystopfinder/` — paquete renombrado en OTP2 (las clases son `PatternConsideringNearbyStopFinder`, `StraightLineNearbyStopFinder`, `StreetNearbyStopFinder`).
- Configurable vía `build-config.json`:
  - https://docs.opentripplanner.org/en/v2.2.0/BuildConfiguration/ — `transferRequests`, `maxTransferDurationSeconds`, `maxStopToShapeSnapDistance`, `matchBusRoutesToStreets`, etc.

### 6.2 R5 — `TransferFinder.findTransfers()`

- https://github.com/conveyal/r5/blob/dev/src/main/java/com/conveyal/r5/transit/TransferFinder.java — 273 líneas.
  - Línea 27: `public class TransferFinder {`
  - Línea 80: `public TransferFinder(TransportNetwork network, GtfsTransferLoader gtfsTransferLoader) { ... }`
  - Línea 117: `public void findTransfers () { ... }` — main loop.
  - Línea 121: `int firstStopToProcess = transitLayer.streetTransfers.size();` — permite extender la lista cuando se aplican scenarios.
  - Línea 142: `StreetRouter streetRouter = new StreetRouter(streetLayer);`
  - Línea 144: `streetRouter.distanceLimitMeters = TRANSFER_DISTANCE_LIMIT_METERS;` (importado de `TransitLayer`).
  - Línea 146: `streetRouter.quantityToMinimize = RoutingVariable.DISTANCE_MILLIMETERS;`
  - Línea 162: `distancesToReachedStops.remove(sourceStopIndex);` — **crítico para loop routes**: "Same-stop 'transfers' are handled in the router and do not need to be materialized in our list of transfer distances. It's actually important to remove the source stop to handle certain cases with loop routes (see CTA Brown Line to Purple Line example in discussion on #763)."
  - Línea 165: `retainClosestStopsOnPatterns(distancesToReachedStops, ignorePatterns);` — filtrado: closest stop por pattern.
  - Línea 178–186: packing `packedTransfers.add(targetStopIndex); packedTransfers.add(distance);`.
  - Línea 220–238: post-proceso para escenarios — añade los *inverted transfers* cuando se extiende la lista.
  - Línea 250: `private void retainClosestStopsOnPatterns(TIntIntMap timesToReachedStops, TIntCollection ignorePatterns)` — la lógica de optimización (sólo el más cercano por pattern).
- Constante: `TransitLayer.TRANSFER_DISTANCE_LIMIT_METERS` y `PARKRIDE_DISTANCE_LIMIT_METERS`.

### 6.3 MOTIS — `compute_footpaths`

Ya cubierto en §5.2. Resumen: r-tree sobre locations, `osr::route_one_to_many` por profile, packing en `tt.locations_.footpaths_out_/in_`.

---

## 7. Stop-to-stop search minimalista (BFS / Dijkstra sobre grafo transit)

> Estos repos NO implementan RAPTOR/CSA — son la "versión de aula". Sirven como referencia de cómo modelar Stop / Route / Trip de manera mucho más simple.

- `notnamansinha/BRTS-Navigator` — https://github.com/notnamansinha/BRTS-Navigator
  - Python BFS sobre Ahmedabad BRTS. README: "A deterministic route-finding and digital ticketing system for Ahmedabad's Bus Rapid Transit System (BRTS)". Complejidad O(R × S²). Búsqueda *bidireccional* (forward + reverse sobre cada ruta). Multi-interchange con hasta 2 transfers. Cero dependencias (sólo Python stdlib).
- `hlefebvr/shortest-path-gtfs` — https://github.com/hlefebvr/shortest-path-gtfs
  - Python, GTFS Paris (IDF). Dijkstra time-dependent. SQL + LMDB.
- `shreyshrivastava/Ai_tube` — https://github.com/shreyshrivastava/Ai_tube
  - Notebook Jupyter, London Tube. BFS, DFS, UCS sobre CSV de estaciones.
- `AMGhalcyon/mrt-information-system` — https://github.com/AMGhalcyon/mrt-information-system
  - Python, Singapore MRT. Dijkstra vía `heapq` + visualización Turtle.
- `jos-tang/Journey-Planner` — https://github.com/jos-tang/Journey-Planner
  - Python, Singapore MRT + Bus. Dijkstra + Bellman-Ford. PyQt5 GUI.
- `bliksemlabs/rrrr` — incluye scripts `timetable.py`, `transfers.py`, `gtfsdb.py` (no BFS sino la construcción del timetable para RAPTOR).

---

## 8. GeoJSON → GTFS converters

### 8.1 Listado curado por MobilityData

https://github.com/MobilityData/awesome-transit — sección *"GTFS Converters"* (catálogo mantenido por la comunidad, 1.8k stars, CC0-1).

### 8.2 `antoine29/geojson2gtfs` (Node, GTFS clásico)

- Repo: https://github.com/antoine29/geojson2gtfs
- "Transform geojson files (describing Hail and Ride transport routes) to a GTFS data set."
- CLI `npm i geojson2gtfs -g` → `geojson2gtfs -i <inputFolder> -s <settings.json> [-z]`.
- Diseñado para transporte informal (La Paz, Bolivia — repo companion: https://github.com/antoine29/LaPazPublicTransportRoutes).

### 8.3 `antoine29/geojson2gtfs-flex` (Node, GTFS-flex)

- Repo: https://github.com/antoine29/geojson2gtfs-flex — variante para GTFS-flex (on-demand).

### 8.4 `trufi-app/geojson-to-gtfs` (Node, npm)

- Repo: https://github.com/trufi-app/geojson-to-gtfs — npm `geojson-to-gtfs@0.3.0` (downloads semanales: 0).
- API JS: `geojsonToGtfs('./routes.geojson', './gtfs.zip', { agencyUrl, routeShortName: feature => feature.properties.line, ... })`.
- Devuelve GTFS como objeto JS (no sólo a disco): `{ agency, calendar, frequencies, routes, stop_times, stops, trips, shapes }`.
- Callbacks configurables por feature/coords: `mapAgency`, `mapStop`, `mapRoute`, `mapTrip`, `mapStopTime`, `mapShapePoint`, `mapFrequency`, `mapService`.

### 8.5 `araichev/make_gtfs` / `mrcagney/make_gtfs` (Python)

- Repo original: https://github.com/araichev/make_gtfs — ahora apunta a https://github.com/mrcagney/make_gtfs.
- "A Python 3.10+ library to build GTFS feeds from basic route information."
- Input: `shapes.geojson` (LineString features con `shape_id`), más datos básicos de servicio (calendar, agencia, route names).
- CLI: `uv run make_gtfs --help`.

### 8.6 `conveyal/geom2gtfs` (Java, shapefile → GTFS, **DEPRECATED**)

- Repo: https://github.com/conveyal/geom2gtfs — README marca "[deprecated]". Substituido por scenario-editor (ahora archivado también).
- README: "Convert shapefiles into simple frequency-based GTFS feeds." Toma un shapefile de líneas + un config.json + opcionalmente un shapefile de puntos (stops).
- Estrategias de stops: `shapefile`, `picket`, `cluster`.

### 8.7 `grote/osm2gtfs` (Python, OSM + schedule → GTFS)

- Repo: https://github.com/grote/osm2gtfs — 104 stars, 111 commits, GPL-3.
- "Use public transport data from OpenStreetMap and external schedule information to create a General Transit Feed (GTFS)."
- Trae la data desde Overpass, cache en disco, combina con schedule (config por ciudad: Florianópolis, Costa Rica, Accra, Managua, etc).
- USO: `osm2gtfs -c osm2gtfs/creators/br_florianopolis/config.json`.

### 8.8 Otras herramientas listadas en `awesome-transit` (con links primarios)

- `bdferris/kml-to-gtfs-shapes` — KML polylines → `shapes.txt`.
- `BlinkTagInc/gtfs-to-geojson` — GTFS → GeoJSON (dirección inversa, útil para visualización).
- `BlinkTagInc/node-gtfs` — load GTFS a SQLite (incluye queries geográficas).
- `derhuerst/extract-gtfs-pathways` — pathways.txt → GeoJSON.
- `derhuerst/extract-gtfs-shapes` — shapes.txt → GeoJSON.
- `cal-itp/gtfs-service-area` — Dockerized `gtfs-to-geojson`.

### 8.9 Observación honesta

> **No existe en GitHub un converter GeoJSON → GTFS que sea claramente "el" oficial.** Los candidatos reales son proyectos académicos / individuales. La vía más práctica para un dataset informal es `trufi-app/geojson-to-gtfs` (npm, MIT) o `antoine29/geojson2gtfs`. Para un feed con schedule real + OSM, `grote/osm2gtfs` (pero requiere config por ciudad).

---

## 9. Debuggability

### 9.1 OTP2 — Debug UI + Raptor Debugger

- **Debug UI web (React/TypeScript SPA):**
  https://docs.opentripplanner.org/en/latest/Frontends/ — *"A Debug frontend is included in the main OpenTripPlanner repository ... served by OTP itself or a simple local web server ... connects to the OTP Java backend via the GraphQL API using the Transmodel vocabulary. By default, it is available at the root URL (http://localhost:8080/ in local operation)."*
- **Debug UI config:** https://docs.opentripplanner.org/en/latest/DebugUiConfiguration/ — `debug-ui-config.json`.
- **Logging:** https://docs.opentripplanner.org/en/latest/Logging/ — logback + slf4j. Loggers útiles para Raptor:
  - `org.opentripplanner.raptor.RaptorService` — debug request/response.
  - `TRANSFERS_EXPORT` — dump de transfers a `transfers-debug.csv`.
  - `DATA_IMPORT_ISSUES` — issues de graph build.
- **Formato JSON log:** propiedad JVM `otp.logging.format=json` (Logstash-encoded, Datadog/Loki/Grafana).
- **Graph Visualizer (legacy):** clase `GraphVisualizer` en `application/src/main/java/org/opentripplanner/` — Swing + Processing. *"This very developer-centric UI ... can visualize the progress of searches through the street network, providing some insight into the internals of the routing algorithms."*
- **Raptor Debugger interno** (citado en `raptor/src/main/java/org/opentripplanner/raptor/package.md`):
  - "The Raptor implementation support instrumentation of ACCEPT, REJECT, and DROP events for stop-arrivals and trip boardings."
  - "Use the SpeedTest to pass in a set of stops and/or a specific path to debug."
  - Logger de test: `TestDebugLogger` (en `moduletests`).
- **HTML data import report:** `"dataImportReport": true` en build-config — issues de graph build volcadas a HTML.
- **Troubleshooting guide:** https://docs.opentripplanner.org/en/latest/Troubleshooting-Routing/

### 9.2 R5 — output como JSON a través de API GraphQL

- Javadoc `ProfileRequest`: https://javadoc.conveyal.com/r5/master/com/conveyal/r5/profile/ProfileRequest.html — *"Factory method to create a profile request with query parameters from a GraphQL request"*.
- El servidor backend (no inspeccionado a fondo) expone `/otp/routers/default/plan` etc.

### 9.3 MOTIS — JSON OpenAPI

- https://github.com/motis-project/motis/blob/master/openapi.yaml — REST API con OpenAPI 3.1.
- `src/journey_to_response.cc` — convierte el resultado del routing core a la respuesta JSON.

### 9.4 trRouting — JSON server HTTP

- `connection_scan_algorithm/src/transit_routing_http_server.cpp` — endpoint HTTP. Headers en `include/server_http.hpp`. Respuesta en `json.hpp` (incluye Boost.PropertyTree JSON).
- Documentación API: https://chairemobilite.github.io/trRouting/

### 9.5 Debug-tips oficiales OTP2

- *"Use the SpeedTest to pass in a set of stops and/or a specific path to debug. This is useful when debugging why you do (not) get a particular result."*

---

## 10. Lecciones aprendidas — edge cases en issues/repos reales

### 10.1 RAPTOR: pass-through connections y rutas circulares (OTP2)

- **PR #7592** — https://github.com/opentripplanner/OpenTripPlanner/pull/7592
  > "When a pass-through connection was forwarded to the next routing segment, two bugs caused incorrect results:
  > 1. Wrong boarding stop: The boarding position was set to the pass-through stop rather than the original boarding stop.
  > 2. **Circular lines**: For loop routes, the correct stop position for injecting the ride was not derived from the actual alighting stop — this caused the pass-through constraint to be applied at the wrong point in the pattern."
  > "There are 2 remaining bugs ... The R A router saves as little information as possible during routing - so boardPosition is not saved. ... In a circular line A-B-C-A-B, pass-though stop C, origin A and destination B the current PathMapper will time-shift the boarding to the second A stop in the pattern."

### 10.2 Guaranteed interchange perdido en loops (NeTEx, OTP2)

- **Issue #7466** — https://github.com/opentripplanner/OpenTripPlanner/issues/7466
  > "Guaranteed interchanges (`ServiceJourneyInterchange` with `Guaranteed=true`) are silently lost during NeTEx import when the feeder trip's JourneyPattern visits the transfer stop more than once (e.g., a loop route)."
  > "For a loop pattern where the feeder trip visits the transfer stop at position 30 (outbound) and again at position 44 (return), `lastIndexOf` returns 44. The `TripTransferPoint` is stored in `ConstrainedTransferService` with stop position 44. During routing, the passenger alights at position 30 (the first visit). The lookup fails because the stored position doesn't match."
  > Causa raíz: `TransferMapper.findStopPosition()` usa `lastIndexOf`.

### 10.3 Cost mismatch stop-arrivals vs paths (OTP2)

- **Issue #3623** — https://github.com/opentripplanner/OpenTripPlanner/issues/3623 (referenciado en TODOs del código).
- **PR #7417** — https://github.com/opentripplanner/OpenTripPlanner/pull/7417
  > "The on-board pareto comparator in multi-criteria Raptor used `!=` to compare `tripSortIndex` across trips, making the criterion symmetric and therefore preventing any trip from ever dominating another. This kept all trips alive in the on-board optimal set regardless of cost, allowing sub-optimal rides to survive and reach the path mapper."
  > "Replace `!=` with `<` establishes a proper pareto ordering ... For circular patterns with a 'tail' (stops that only appear after the loop completes), passengers heading to a tail stop should board on the second pass, skipping the full circle."
  > Lección: **circular patterns con tail** son una zona gris del algoritmo; la elección de comparator es lo que hace que la dominancia funcione.

### 10.4 Transfers en paradas co-ubicadas (OTP1/OTP2)

- **Issue #2371** — https://github.com/opentripplanner/OpenTripPlanner/issues/2371
  > "We have had this problem because of poor data quality for a number of railway stations, where different platforms had been assigned the exact same coordinates. This caused long detours in itineraries to avoid changing trains on these stations."
  > Causa raíz: `StreetTransitLink.java:87` prohibía la doble-traversal de edges street-transit-link.
  > Fix: PR #2817 (dev-1.x) / #2825 (dev-2.x) — se hizo la regla *condicional* en lugar de eliminarla.

### 10.5 Street transfers asumidos simétricos (OTP2)

- **Issue #3634** — https://github.com/opentripplanner/OpenTripPlanner/issues/3634
  > "Street transfers are assumed to be symmetric."
  > "It is possible to transfer between stops with directional GTFS pathways. Transferring is not possible or takes unrealistically long times. If `OptimizeTransfers` is disabled then there is a 23 minute walk instead of a few minute transfer."
- **PR #3635** — https://github.com/opentripplanner/OpenTripPlanner/pull/3635
  > "Currently transfers are not reversed for reverse raptor searches. This extends `TransitCalculator` with a `getTransfers(int stopId)` so that the correct type of transfers can be used based on the direction of the search. `RaptorTransitDataProvider` is extended/renamed with `getTransfersFromStop()` and `getTransfersToStop()` methods."

### 10.6 Loop routes en R5 TransferFinder

- En `TransferFinder.findTransfers()` (citado en §6.2):
  > "Same-stop 'transfers' are handled in the router and do not need to be materialized in our list of transfer distances. It's actually important to remove the source stop to handle certain cases with loop routes (see CTA Brown Line to Purple Line example in discussion on #763)."
- Issue R5 #763 — loop routes transfieren entre paradas que están en la *misma* coordenada (Chicago CTA Brown/Purple).

### 10.7 Líneas con muchos ramales — reflexiones de los autores

- **OTP2 `package.md`** sobre por qué se removió el filtro de stops:
  > "Filtering on stops was implemented and tested with heuristics. We tested removing all stops which could not be part of an optimal path, but this did not have a significant performance impact. If Routes, Trips or Stops can be filtered it is probably better to do it in the transit layer, not in Raptor."
- **transnetlab/transit-routing** — el particionamiento (HypRAPTOR, HypTBTR, MhypTBTR) es la respuesta al problema de redes continentales; el paper "Scalable Algorithms for Bicriterion Trip-Based Transit Routing" (Agarwal & Rambha, IEEE T-ITS 2024) trata esto.

### 10.8 Sobre el manejo de "branching" / ramales bidireccionales

No encontré un issue canónico que diga "así manejamos ramales bidireccionales" — la técnica estándar es agrupar trips con misma stop-sequence + misma pickup/dropoff signature en una `route`, exactamente lo que hace `planarnetwork/raptor` en `routeSignature()` y `overtakes()` (Network.ts líneas 192 y 209). Cualquier trip que *overtakes* (llega antes a cualquier stop) a un trip existente en la route, genera una route nueva — exactamente lo que pide el paper de Delling para garantizar correctness cuando el algoritmo recorre los trips *hacia atrás*.

---

## 11. Observaciones cruzadas y resumen de diferencias entre implementaciones

| Aspecto | OTP2 | R5 | MOTIS | planarnetwork/raptor | transnetlab |
|---|---|---|---|---|---|
| Lenguaje | Java 17+ | Java | C++ | TypeScript | Python |
| Algoritmo principal | Range Raptor + McRR | McRAPTOR + profile | nigiri (`route_idx_t`) | RAPTOR estándar | RAPTOR estándar + variantes |
| Línea con más ramales | group by `TripPattern` | group by `TripPattern` | group by `route_idx_t` | group by `routeSignature` (Network.ts:192) | group por `routes_by_stop_dict` |
| Transfer graph | `DirectTransferGenerator` (parallel) | `TransferFinder.findTransfers` (parallel) | `compute_footpaths` (parallel) | Cargado de GTFS `transfers.txt` | Cargado de GTFS `transfers.txt` |
| Stop coords idénticas | filtro + special-case | remover source stop (R5 #763) | n/d (OSM-based) | n/d | n/d |
| Reverse search | sí (`ReverseSearchTransitCalculator`) | sólo forward en McRAPTOR | sí (lb-graph) | no (sólo forward) | sí (rRAPTOR) |
| Multi-criteria | sí (pareto-optimal set) | sí (DominatingList) | sí | no | HypRAPTOR |
| Real-time | sí (RaptorTransitData shallow-copy) | parcial | sí (gtfs-rt + siri) | no | no |
| Debug logging | logback JSON + Raptor Debugger | javadoc GraphQL | OpenAPI JSON | console | console |
| Constrained transfers | sí (`RaptorConstrainedTransfer`) | parcial | sí (transfers.txt) | no | no |

---

## 12. Búsquedas ejecutadas (auditoría)

**Exa searches (12):**
1. RAPTOR algorithm public transit routing GitHub implementation Java Kotlin
2. Connection Scan Algorithm CSA public transit routing GitHub C++ implementation connection struct
3. OpenTripPlanner OTP2 RaptorTransitRouter RaptorPathCalculator source code github
4. Conveyal R5 ProfileRouting TransitNetwork NetworkConstr builder source code github
5. MOTIS motis-project routing ppr parallel public transit github source
6. OTP2 transfer graph generation OSM walk distance StopLinker Graph annotator
7. GeoJSON to GTFS converter github tool command line shape file
8. RAPTOR edge cases bidirectional route circular transfer same stop github issues discussion
9. OpenTripPlanner debug logging itinerary path output visualization debug client
10. gtfs-lib MobilityData onebusaway-gtfs-tools github command line tool GeoJSON
11. public transit routing BFS Dijkstra stop to stop simple python github educational
12. RAPTOR paper Delling 2015 round based public transit optimal journey routing

**Webfetches GitHub + javadoc (16):**
1. opentripplanner/OpenTripPlanner `application/.../raptoradapter`
2. opentripplanner/OpenTripPlanner `raptor/.../raptor`
3. conveyal/r5 `src/main/java/com/conveyal/r5/profile/`
4. conveyal/r5 `src/main/java/com/conveyal/r5/transit/`
5. conveyal/r5 `src/main/java/com/conveyal/r5/point_to_point/builder/`
6. motis-project/motis `src/`
7. opentripplanner/OpenTripPlanner `graph_builder/module/`
8. opentripplanner/OpenTripPlanner `raptoradapter/transit/`
9. opentripplanner/OpenTripPlanner `graph_builder/module/transfer/`
10. opentripplanner/OpenTripPlanner `raptoradapter/router/`
11. planarnetwork/raptor `src/`
12. conveyal/r5 `src/main/java/com/conveyal/r5/analyst/`
13. chairemobilite/trRouting `include/`
14. chairemobilite/trRouting `connection_scan_algorithm/`
15. planarnetwork/raptor `src/raptor/`
16. raoulvdberge/raptor (404 — repo reorganizado, README explica)
17. OneBusAway/onebusaway-gtfs-modules
18. MobilityData/gtfs-realtime-bindings
19. planarnetwork/raptor `src/network/`
20. transnetlab/transit-routing `Algorithms/`
21. teogramm/pt-routing
22. MobilityData/awesome-transit
23. bliksemlabs/rrrr
24. dmitrykitty/transit-routing-backend
25. grote/osm2gtfs
26. opentripplanner/OpenTripPlanner `RaptorTransitData.java` (raw)
27. opentripplanner/OpenTripPlanner `TransitRouter.java` (raw)
28. opentripplanner/OpenTripPlanner `DirectTransferGenerator.java` (raw)
29. opentripplanner/OpenTripPlanner `package.md` (raw)
30. conveyal/r5 `TransferFinder.java` (raw)
31. conveyal/r5 `FastRaptorWorker.java` (raw, truncado)
32. chairemobilite/trRouting `trip.hpp` (raw)
33. chairemobilite/trRouting `connection_scan_algorithm/include/calculator.hpp` (raw)
34. motis-project/motis `compute_footpaths.cc` (raw)
35. planarnetwork/raptor `RaptorAlgorithm.ts` (raw)
36. planarnetwork/raptor `TripScanner.ts` (raw)
37. planarnetwork/raptor `Network.ts` (raw)
38. planarnetwork/raptor `Connection.ts` (raw)
39. transnetlab/transit-routing `std_raptor.py` (raw)
40. opentripplanner/OpenTripPlanner/issues y PRs (webfetch de las URLs de issues/PRs: #7466, #7592, #3634, #3635, #2371, #7417, #3623, #7467, #3635)

> **Exa searches:** 12 (mínimo pedido: 10). ✓
> **Webfetches GitHub + javadoc:** 40+. ✓
> **Total ≥10 fuentes distintas:** ampliamente cumplido.

---

## 13. Fuentes secundarias (NO citadas como evidencia, sólo contexto)

Para mantener la regla "primary sources only":

- El archivo `raptor/src/main/java/org/opentripplanner/raptor/package.md` es *documentación interna del proyecto* — cuenta como fuente primaria del propio proyecto.
- La javadoc oficial de R5 publicada por Conveyal (`http://javadoc.conveyal.com/r5/master/...`) cuenta como primaria porque es generada por el proyecto.
- La documentación oficial de OTP (`docs.opentripplanner.org`) es fuente primaria del proyecto.
- `awesome-transit` de MobilityData es un catálogo curado — se cita sólo para listar tools, NO para explicar comportamiento.

---

## 14. Lo que NO encontré (y vale aclarar)

- No hay una clase `ProfileRouting.java` en R5 — se llama `McRaptorSuboptimalPathProfileRouter.java`.
- No hay una clase `TransitNetwork.java` en R5 — se llama `TransportNetwork.java` (paquete `transit/`).
- No hay un builder `NetworkConstr` en R5 — la construcción es `TransportNetwork.fromFeeds(...)` / `fromFiles(...)`.
- No hay (en el momento de la búsqueda) un PR/issue canónico sobre "manejo de ramales bidireccionales" como tema en sí — la literatura trata el caso como parte del group-by-signature del paper Delling.
- `onebusaway-gtfs-modules` no tiene un converter GeoJSON → GTFS dedicado (es GTFS-in / GTFS-out; el sub-módulo `onebusaway-gtfs-transformer-cli` permite transforms pero no GeoJSON source).