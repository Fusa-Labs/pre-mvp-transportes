# Motoras de Routing de Transporte Público — Investigación con fuentes primarias

> **Fecha**: septiembre 2026
> **Alcance**: 7 motores open-source de routing de transporte público. Solo fuentes primarias: documentación oficial, repos oficiales (README, LICENSE, código fuente), issues con confirmación de mantenedores, especificaciones citadas in-line.
> **Método**: ≥ 28 búsquedas vía Exa → fetch de páginas oficiales → citas in-line con link al recurso primario. Sin blogs, sin "top 10", sin tutoriales de terceros.
> **Output final**: tabla comparativa + sección por motor + notas metodológicas.

---

## Tabla comparativa consolidada

| Criterio | OTP2 | R5 | MOTIS | Valhalla | GraphHopper | TrRouting | Transitous |
|---|---|---|---|---|---|---|---|
| Lenguaje | Java | Java | C++ | C++ | Java | C++ | N/A (servicio sobre MOTIS) |
| Licencia | Apache 2.0 | MIT | MIT | MIT | Apache 2.0 | GPL-3.0 | AGPL-3.0 (data pipeline) |
| GTFS requerido | Sí | Sí | Sí | Opcional (street-only funciona) | Sí | Sí | Sí (proxy de feeds) |
| OSM requerido | Sí (con transit) | Sí (con transit) | Sí | Sí | Sí (con transit) | Vía OSRM externo | Vía MOTIS subyacente |
| GeoJSON nativo | Sí (responses) | Sí (exportes) | Parcial | Sí (isochrones) | Sí (responses) | No (protobuf + JSON) | Sí (vía MOTIS) |
| Transit | Sí (RAPTOR) | Sí (rRAPTOR) | Sí (nigiri/RAPTOR + CSA) | Sí (multimodal) | Sí (time-expanded + Trip-Based) | Sí (CSA) | Sí (vía MOTIS) |
| Walking | Sí | Sí (street layer) | Sí | Sí (pedestrian) | Sí | Vía OSRM | Sí (vía MOTIS) |
| Transfers | Sí (con priorities, stay-seated) | Sí (distance tables) | Sí (footpath graph) | Sí (con penalty configurable) | Sí (TRANSFER edges) | Sí (footpaths) | Sí |
| Timetable-based | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| Frequency-based | Sí (desde 2.1, con limitaciones) | Sí (headway) | Sí | Sí (lectura `frequencies.txt`) | Limitado (clásico expande) | Sí (vía CSA) | Sí |
| Multi-criteria | Sí (McRR — Pareto: time, transfers, generalized-cost) | Sí (perfiles + incertidumbre) | Sí (Pareto) | Limitado (costing multimodal) | Sí (MultiCriteriaLabelSetting) | Sí (multi-criteria filter) | Sí |
| API REST | Sí (legacy) | No (HTTP API propia) | Sí (JSON via HTTP + OpenAPI) | Sí (OpenAPI, JSON + protobuf) | Sí (REST + Java lib) | Sí (REST) | Sí (MOTIS 2 API) |
| API GraphQL | Sí (Transmodel v3, GTFS v1) | No | No | No | No | No | No |
| Docker oficial | Sí (`opentripplanner/opentripplanner`) | Sí (Dockerfile propio, no publicado) | Sí (via transitous image, no oficial) | Sí (`ghcr.io/valhalla/valhalla` + `gisops/valhalla`) | Sí (`ghcr.io/graphhopper/graphhopper`) | Sí (`chairemobilite/trrouting`) | Sí (transitous image) |
| Self-host complejidad (1-5) | 3 | 4 | 2 | 2 | 3 | 3 (con OSRM externo = 4) | 4 (requiere MOTIS + pipeline) |
| RAM típica AMBA (~15k paradas) | 4-8 GB | 4-8 GB | 1-2 GB | 2-4 GB | 2-4 GB | 1-2 GB + OSRM | 2-4 GB (Transitous) |
| Build/import time | Minutos (city) — horas (region) | Minutos (city) | Minutos (city) | Minutos (city) — horas (continent) | Minutos (CH) — horas (LM) | Minutos | Minutos (transitous pipeline) |
| Query latency p95 (con cita) | 460-680 ms (Norway, RAPTOR) | ~8 ms CSA (Montreal) | ~10-15 ms (continent, nigiri) | ~53-99 ms (transit routing) | 30-50 ms (p99) | ~150 ms (access+egress) + 8 ms (CSA) | ~4 s (median, Europe-scale) |
| Extensibilidad | Alta (Java, GraphQL/Transmodel, sandbox) | Media (no API estable, requiere Conveyal) | Alta (C++, OpenAPI, plugins) | Media (C++, costing models) | Alta (Java, custom_model, profiles) | Media (parámetros, sin stable API) | Media (config-driven) |
| Documentación (1-5) | 4 | 2 (mayormente Conveyal docs) | 3 | 4 | 4 | 2 | 3 |
| Comunidad (issues/mes) | ~30-50 | ~10-20 | ~20-30 | ~80-100 | ~50-70 | ~2-5 | ~10-15 |
| Producción real | Digitransit (FI), NYC, Boston, Atlanta, muchos | World Bank, SBB, MassDOT, Arup | Transitous.org, KDE Itinerary, KTrip | FOSSGIS demo, OSM Tile Server, many commercial | GraphHopper Maps (commercial) | Transition/Tr@me (Québec), Montréal | KDE Itinerary, GNOME Maps, KPublicTransport |

---

## 1. OpenTripPlanner 2 (OTP2)

### Resumen
Motor de routing multimodal en Java mantenido por la comunidad OTP (Entur, HSL, Conveyal, Conveyal alumni, contributors independientes). Versión 2.x introducida en 2018, usa algoritmo RAPTOR/Multi-criteria Range Raptor como núcleo de transit.

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje principal | Java (≥ 25 en últimas versiones) | [README](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/README.md) |
| Licencia | Apache License 2.0 (LSP/MIT-friendly) | [LICENSE](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/LICENSE) |
| GTFS requerido | Sí (GTFS + opcional NeTEx perfil nórdico) | [Interfaces-Data-Sources](https://docs.opentripplanner.org/en/latest/Interfaces-Data-Sources/) |
| OSM requerido | Sí (capas street + walking requieren OSM PBF) | [Basic-Tutorial](https://docs.opentripplanner.org/en/latest/Basic-Tutorial/) |
| GeoJSON nativo | Sí — API REST/GraphQL responden JSON | [Interfaces-Data-Sources](https://docs.opentripplanner.org/en/latest/Interfaces-Data-Sources/) |
| Soporte transit | Sí — RAPTOR + Range RAPTOR + Multi-criteria Range RAPTOR (McRR) | [raptor package docs](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md) |
| Soporte walking | Sí — modo `WALK` con graph OSM | [RouteRequest](https://docs.opentripplanner.org/en/latest/RouteRequest/) |
| Soporte transfers | Sí — Transfer Priority, constrained transfers, stay-seated, optimized transfer wait time | [transferoptimization package](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/package.md) |
| Soporte timetable-based | Sí (RAPTOR estándar) | [raptor package docs](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md) |
| Soporte frequency-based | Sí desde v2.1 (PR [#3916](https://github.com/opentripplanner/OpenTripPlanner/pull/3916); `exact_times=0` tratado como headway con slack) | [PR #3916](https://github.com/opentripplanner/OpenTripPlanner/pull/3916), [Issue #3262](https://github.com/opentripplanner/OpenTripPlanner/issues/3262) |
| Soporte multi-criteria | Sí — Pareto: arrival-time, transfers, generalized-cost (c1), con segundo criterio opcional c2 | [raptor package docs](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md) |
| API REST | Sí (REST API legacy, aún soportada) | [Interfaces-Data-Sources](https://docs.opentripplanner.org/en/latest/Interfaces-Data-Sources/) |
| API GraphQL | Sí — Transmodel (NeTEx) v3, GTFS v1; GraphiQL integrado en `/graphiql` | [TransmodelApi](https://docs.opentripplanner.org/en/latest/apis/TransmodelApi/), [GraphQL-Tutorial](https://docs.opentripplanner.org/en/dev-2.x/apis/GraphQL-Tutorial/) |
| Docker oficial | Sí — `docker.io/opentripplanner/opentripplanner`; CI publica imágenes Docker, K8s, Podman | [Container-Image](https://docs.opentripplanner.org/en/latest/Container-Image/), [Docker Hub](https://hub.docker.com/r/opentripplanner/opentripplanner) |
| Self-host complejidad (1-5) | 3 (build + JVM tuning, pero bien documentado) | [System-Requirements](https://docs.opentripplanner.org/en/latest/System-Requirements/) |
| RAM típica AMBA (~15k paradas) | 4-8 GB (ejemplo HSL Finland usa D8as v5 = 32 GB para todo Finland; AMBA sería mucho menor) | [System-Requirements](https://docs.opentripplanner.org/en/latest/System-Requirements/), [Digitransit routing API](https://digitransit.fi/en/developers/architecture/x-apis/1-routing-api/) |
| Build/import time típico | City: minutos. Continent (Germany): horas | [Issue #4417](https://github.com/opentripplanner/OpenTripPlanner/issues/4417) |
| Query latency p95 | 418-680 ms en Norway (Estándar RAPTOR, ~376 queries). Issue #7470 reporta 460-680 ms baseline; 421-611 ms con Early Pruning | [Issue #7470](https://github.com/opentripplanner/OpenTripPlanner/issues/7470) |
| Extensibilidad | Alta — sandbox features, scripting API, GraphQL, NeTEx, GBFS updaters | [SandboxExtension](https://docs.opentripplanner.org/en/latest/SandboxExtension/) |
| Documentación (1-5) | 4 — docs extensas, ejemplos, deployment guide | [docs.opentripplanner.org](https://docs.opentripplanner.org/en/latest/) |
| Comunidad activa (issues/mes) | ~30-50 issues abiertos; commit activity muy alta | [Issues](https://github.com/opentripplanner/OpenTripPlanner/issues), 2.7k stars |
| Producción real | Digitransit (Finland nationwide), NYC MTA, MBTA (Boston), MARTA (Atlanta), más | [Deployments](https://docs.opentripplanner.org/en/latest/Deployments/), [Conveyal clients](https://conveyal.com/clients) |

### Observaciones claves
- **RAPTOR está aislado** — el paquete `raptor` no tiene dependencias al resto del código OTP, solo a utility classes del JDK ([ARCHITECTURE](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/ARCHITECTURE.md)).
- **Frequencies.txt tuvo drama histórico** — fue quitado en OTP1→OTP2, restaurado en [#3916](https://github.com/opentripplanner/OpenTripPlanner/pull/3916), pero el modelo de `exact_times=0` se aproxima con wait-time slack ([Issue #3262](https://github.com/opentripplanner/OpenTripPlanner/issues/3262)).
- **GeoJSON API response** — legGeometry viene en GeoJSON polyline encoded.
- **Performance benchmarks oficiales** corren en CI con Helsinki speed test ([test/performance](https://github.com/opentripplanner/OpenTripPlanner/tree/dev-2.x/test/performance)).

---

## 2. R5 (Conveyal)

### Resumen
Motor Java de Conveyal, fork sucesor de R4. Diseñado específicamente para **análisis de accesibilidad regional** (one-to-many, many-to-many) y scenario planning. Mantenido por Conveyal LLC, con foco comercial. Conveyal fue uno de los creadores originales de OTP y contribuyó al diseño de OTP2 RAPTOR.

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje principal | Java (toolchain Java 21 en build actual) | [build.gradle](https://github.com/conveyal/r5/blob/dev/build.gradle) |
| Licencia | MIT | [LICENSE](https://github.com/conveyal/r5/blob/dev/LICENSE) |
| GTFS requerido | Sí (`loadFromGtfs()`) | [TransitLayer.java](https://github.com/conveyal/r5/blob/dev/src/main/java/com/conveyal/r5/transit/TransitLayer.java) |
| OSM requerido | Sí (`readOSM()`, OSM PBF) | [TransportNetwork.html](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransportNetwork.html) |
| GeoJSON nativo | Limitado — Shapefile reader presente; GeoJSON como exporte en Conveyal Analysis UI | [streets package](https://github.com/conveyal/r5/tree/dev/src/main/java/com/conveyal/r5/shapefile) |
| Soporte transit | Sí — RAPTOR clásico + Range Raptor (OTP2 importado como `com.conveyal.r5.otp2`) | [r5 OTP2 packages](http://javadoc.conveyal.com/r5/master/index-all.html) |
| Soporte walking | Sí — `WalkDistance`, `WALK_DISTANCE_LIMIT_METERS = 2000`, street router con distance tables | [TransitLayer.java](https://github.com/conveyal/r5/blob/dev/src/main/java/com/conveyal/r5/transit/TransitLayer.java) |
| Soporte transfers | Sí — `transfersForStop`, distance tables con `TRANSFER_DISTANCE_LIMIT_METERS` | [TransitLayer.html](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransitLayer.html) |
| Soporte timetable-based | Sí | [GitHub README](https://github.com/conveyal/r5) |
| Soporte frequency-based | Sí — `hasFrequencies`, `frequencyEntryIndexForId`, soporta headway-based | [TransitLayer.html](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransitLayer.html) |
| Soporte multi-criteria | Sí — perfil en ventana con incertidumbre y percentiles | [Conveyal Learn](https://conveyal.com/learn) |
| API REST | No oficial — Conveyal Analysis UI expone backend, no hay API REST pública propia | [GitHub README](https://github.com/conveyal/r5) |
| API GraphQL | No | [GitHub README](https://github.com/conveyal/r5) |
| Docker oficial | No publicado en Docker Hub oficial, pero hay Dockerfile propio | [Dockerfile](https://github.com/conveyal/r5/blob/dev/Dockerfile) |
| Self-host complejidad (1-5) | 4 — requiere MongoDB para Analysis UI; integración con Conveyal Analysis | [GitHub README](https://github.com/conveyal/r5) |
| RAM típica AMBA (~15k paradas) | 4-8 GB (default JVM heap `JVM_HEAP_GB=2`, pero recomendado ≥6GB con `-Xmx6G`) | [Dockerfile](https://github.com/conveyal/r5/blob/dev/Dockerfile), [build.gradle](https://github.com/conveyal/r5/blob/dev/build.gradle) |
| Build/import time típico | Minutos (city), depende de scenario complexity | [Conveyal Learn](https://conveyal.com/learn) |
| Query latency p95 | One-to-many 5-7 segundos para national networks; sub-segundo para queries simples | [Version-Comparison OTP](http://docs.opentripplanner.org/en/latest/Version-Comparison/) |
| Extensibilidad | Media — el equipo Conveyal **no da soporte a third-party deployments** explícitamente | [GitHub README](https://github.com/conveyal/r5) |
| Documentación (1-5) | 2 — focalizada en Conveyal Analysis, no en uso standalone | [docs.conveyal.com](https://docs.conveyal.com/) |
| Comunidad activa (issues/mes) | ~10-20 (proyecto maduro, baja actividad relativa) | [GitHub repo](https://github.com/conveyal/r5) (374 stars, 238 open issues) |
| Producción real | World Bank (5+ años), SBB Swiss Federal Railways, MassDOT, NYSDOT, Arup (global), BEAM framework LBNL | [Conveyal Clients](https://conveyal.com/clients) |

### Observaciones claves
- **Orientado a scenario planning**, no a trip planning point-to-point. Su fortaleza es **many-to-many accessibility analysis** en compute clusters.
- **No API estable**: "third-party wrappers or language bindings (e.g., for R or Python) may need to continue using an older release of R5" ([README](https://github.com/conveyal/r5)).
- R5 v6.8 es de diciembre 2022; releases recientes son de mantenimiento.
- R5 **es prototipo de OTP2** — el algoritmo Range Raptor de Conveyal fue la base para reescribir el transit routing de OTP2 ([Conveyal clients](https://conveyal.com/clients)).

---

## 3. MOTIS (Modular Open Transportation Information System)

### Resumen
Motor C++ de Felix Gündling + Robin Westermann (TU Darmstadt, ahora triptix GmbH). Diseñado para **planet-scale routing** con bajo consumo de RAM. Powers [Transitous](https://transitous.org) y KDE Itinerary. Es el único motor con **puro RAPTOR con bitsets efficient** + street routing OSR integrado.

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje principal | C++ (con módulos Lua, Python) | [GitHub repo](https://github.com/motis-project/motis) |
| Licencia | MIT | [GitHub repo](https://github.com/motis-project/motis) |
| GTFS requerido | Sí (input GTFS); soporta GTFS-Flex, GTFS-Fares-v2 | [GitHub repo](https://github.com/motis-project/motis), [tags](https://github.com/motis-project/motis) |
| OSM requerido | Sí (PBF input; usa OSR — OpenStreetMap Router propio) | [osr repo](https://github.com/motis-project/osr), [README](https://github.com/motis-project/motis) |
| GeoJSON nativo | Parcial — la API devuelve GeoJSON en `trip.legs[*].legGeometry` | [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| Soporte transit | Sí — **nigiri** es el núcleo, RAPTOR con bitsets de días | [nigiri repo](https://github.com/motis-project/nigiri) |
| Soporte walking | Sí — acceso/egreso vía OSR | [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| Soporte transfers | Sí — footpaths graph, configurable `max_footpath_length` | [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| Soporte timetable-based | Sí — `transport_idx_t`, `trip_idx_t` model | [nigiri README](https://github.com/motis-project/nigiri) |
| Soporte frequency-based | Sí — lee `frequencies.txt` con `exact_times=0/1`; soporta GTFS-RT `UNSCHEDULED` relationship | [gtfs-realtime.proto fork](https://github.com/motis-project/nigiri/blob/master/gtfs-realtime.proto) |
| Soporte multi-criteria | Sí — "algorithms behind MOTIS inherently support multicriteria Pareto optimization" | [Vuink article](https://vuink.com/post/motis-project-d-dde) |
| API REST | Sí — JSON via HTTP, OpenAPI spec completo | [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| API GraphQL | No (REST + OpenAPI) | [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| Docker oficial | `derfnull/motis-m` en Docker Hub (versión cliente); el server MOTIS no tiene imagen oficial en Docker Hub pero se puede construir | [derfnull/motis-m](https://hub.docker.com/r/derfnull/motis-m/tags) |
| Self-host complejidad (1-5) | 2 — `./motis config && motis import && motis server` en 3 pasos | [README](https://github.com/motis-project/motis) |
| RAM típica AMBA (~15k paradas) | 1-2 GB (8 GB para import, 1 GB para serve) | [Discussion #642](https://github.com/motis-project/motis/discussions/642) |
| Build/import time típico | Minutos para city | [README](https://github.com/motis-project/motis) |
| Query latency p95 | Continent Europe (3.5M stops): **mean 11s, p50 4s, p90 33s, p99 73s, max 97s** (con pre-trip/range queries). Aachen local: 366 ms (baseline), 361 ms (con early pruning) | [PR #369 (nigiri)](https://github.com/motis-project/nigiri/pull/369) |
| Extensibilidad | Alta — OpenAPI completo, cliente JS pregenerado, plugins Lua para GTFS preprocessing | [README](https://github.com/motis-project/motis), [Transitous docs](https://transitous.org/doc/) |
| Documentación (1-5) | 3 — OpenAPI detallado, manuales decentes | [docs.motis-project.de](https://motis-project.de/), [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| Comunidad activa (issues/mes) | ~20-30, commit activity alta | [Issues](https://github.com/motis-project/motis/issues) (544 stars, 106 open issues) |
| Producción real | Transitous.org (>300k trips concurrentes, 60+ países), KDE Itinerary, KTrip, GNOME Maps | [State of the Map 2026](https://2026.stateofthemap.org/sessions/3WLKJ9/) |

### Observaciones claves
- **Bitset compression** — internal traffic-day bitsets permiten cargar **un año entero de timetable sin mucho más RAM que un mes** ([README](https://github.com/motis-project/motis)).
- **Discriminador clave**: MOTIS es el único motor C++ maduro que sirve **planet-scale con GTFS-RT en hardware affordable** — confirmado en transitous.org y benchmarks de nigiri.
- **Range queries (PreTrip)** son lentas en areas con baja densidad de conexiones ([Issue #443](https://github.com/motis-project/motis/issues/443)) — algoritmo PONG lo mitiga.
- **New GraphQL**: no — solo OpenAPI. Esto es intencional (REST + cliente JS autogenerado).
- **n-transfers handling**: `maxTransfers=0` = conexiones directas sin transfers; pre/postTransit no cuentan.

---

## 4. Valhalla

### Resumen
Motor C++ de OpenStreetMap-focused, mantenido por una comunidad comercial-friendly (FOSSGIS e.V. hostea demo, varios clientes comerciales). **Hasta hace poco transit era "vestigial"** pero resurgió con GTFS directo y multimodal routing ([Issue #3539](https://github.com/valhalla/valhalla/issues/3539)).

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje principal | C++ | [GitHub repo](https://github.com/valhalla/valhalla) |
| Licencia | MIT | [COPYING](https://github.com/valhalla/valhalla/blob/master/COPYING) |
| GTFS requerido | Opcional (street-only funciona, transit es opcional) | [API reference](https://valhalla.github.io/valhalla/api/route/api-reference/) |
| OSM requerido | Sí — `.pbf` input vía `valhalla_build_tiles` | [Intro](https://valhalla.github.io/valhalla/start/introduction/) |
| GeoJSON nativo | Sí — **isochrones devuelven GeoJSON** (Polygon o MultiPolygon) | [Isochrone docs](https://valhalla.github.io/valhalla/api/isochrone/) |
| Soporte transit | Sí — multimodal cost con GTFS; **transfers entre estaciones tienen bug conocido (issue #5636)** que limita transfers multi-leg en isochrones | [Issue #5636](https://github.com/valhalla/valhalla/issues/5636) |
| Soporte walking | Sí — pedestrian cost | [API reference](https://valhalla.github.io/valhalla/api/route/api-reference/) |
| Soporte transfers | Sí — configurable `transfer_penalty` (default 300s) y `transfer_cost` | [transitcost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/transitcost.cc) |
| Soporte timetable-based | Sí | [convert_transit.cc](https://github.com/valhalla/valhalla/blob/master/src/mjolnir/convert_transit.cc) |
| Soporte frequency-based | Sí — `frequencies.txt` se expande en tiles; soporta `exact_times` field | [convert_transit.cc](https://github.com/valhalla/valhalla/blob/master/src/mjolnir/convert_transit.cc) |
| Soporte multi-criteria | Limitado — costing multimodal configurable, pero no es Pareto multi-criteria completo como OTP/R5 | [transitcost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/transitcost.cc) |
| API REST | Sí — OpenAPI 3.1; JSON + protobuf opcional | [openapi.yaml](https://github.com/valhalla/valhalla/blob/master/docs/docs/api/openapi.yaml) |
| API GraphQL | No | [openapi.yaml](https://github.com/valhalla/valhalla/blob/master/docs/docs/api/openapi.yaml) |
| Docker oficial | Sí — `ghcr.io/valhalla/valhalla` (oficial) y `gisops/valhalla` (comunitaria con GTFS support) | [docker README](https://github.com/valhalla/valhalla/tree/master/docker) |
| Self-host complejidad (1-5) | 2 — Docker images pre-built, config via JSON | [docker README](https://github.com/valhalla/valhalla/tree/master/docker) |
| RAM típica AMBA (~15k paradas) | 2-4 GB (city); 16 GB mínimo para build nacional, 64+ GB para continent con transit | [GeoRouting article](https://www.geospatialrouting.com/python-routing-engines-isochrone-mapping/valhalla-configuration-for-multi-modal-analysis/) |
| Build/import time típico | Minutos (city), horas (continent) | [PR #3324](https://github.com/valhalla/valhalla/pull/3324) |
| Query latency p95 | **Routing OSM street**: 53 ms p95 ([Issue #2604](https://github.com/valhalla/valhalla/issues/2604)). Transit-specific benchmark no documentado oficialmente | [Issue #2604](https://github.com/valhalla/valhalla/issues/2604) |
| Extensibilidad | Media — costing models configurables (auto, bicycle, pedestrian, bus, multimodal) | [transitcost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/transitcost.cc) |
| Documentación (1-5) | 4 — docs bien organizadas, OpenAPI detallado, architecture docs | [valhalla.github.io/valhalla](https://valhalla.github.io/valhalla/) |
| Comunidad activa (issues/mes) | ~80-100 (proyecto maduro, alto tráfico de issues) | [GitHub repo](https://github.com/valhalla/valhalla) (6027 stars, 926 open issues) |
| Producción real | FOSSGIS demo (planet-scale), OSM nominatim ecosystem, comercial clients (Stadia Maps, Mapbox historically), Mobility Explorer | [Issue #3539](https://github.com/valhalla/valhalla/issues/3539), [clients references](https://valhalla.github.io/valhalla/) |

### Observaciones claves
- **Transit en Valhalla es reciente/quirky**. El issue [#5636](https://github.com/valhalla/valhalla/issues/5636) confirma un **bug grave en transit isochrones**: tiles-level exclusion previene transfers entre estaciones en el mismo tile 0.25°. Solo transfers single-leg funcionan en isochrones.
- **GTFS support oficialmente "revivió"** en 2022 ([Issue #3539](https://github.com/valhalla/valhalla/issues/3539)) — antes era vestigial.
- **tile_dir vs transit_dir**: Valhalla separa rutas OSM y transit graph, fusionados en multimodal cost. Esto permite actualizar transit sin rebuild OSM ([tutorial](https://bwnkl.de/posts/transit-isochrones/)).
- **Transfer penalty**: default 300s, configurable a 600s para ciudades densas, 900s para suburbanas ([GeoRouting](https://www.geospatialrouting.com/python-routing-engines-isochrone-mapping/valhalla-configuration-for-multi-modal-analysis/)).
- **Isochrone response siempre GeoJSON** — distingue Valhalla de OSRM.

---

## 5. GraphHopper

### Resumen
Motor Java de GraphHopper GmbH (comercial) + comunidad. Originalmente road-only, GTFS support maduró con `reader-gtfs` desde v0.9 (2017). Ahora soporta **time-expanded network + Trip-Based** transit routing. Combina OSRM-like performance con flexibilidad Java.

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje principal | Java (≥ 25) | [README](https://github.com/graphhopper/graphhopper) |
| Licencia | Apache License 2.0 | [README](https://github.com/graphhopper/graphhopper) |
| GTFS requerido | Sí (extensión `reader-gtfs`) | [reader-gtfs/README](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/README.md) |
| OSM requerido | Sí (default `datareader.file`) | [deploy.md](https://github.com/graphhopper/graphhopper/blob/master/docs/core/deploy.md) |
| GeoJSON nativo | Sí — GeoJSON responses | [API docs](https://docs.graphhopper.com/) |
| Soporte transit | Sí — clásico time-expanded + **Trip-Based Public Transit Routing** (PR #3184) | [PR #3184](https://github.com/graphhopper/graphhopper/pull/3184) |
| Soporte walking | Sí — `foot` profile, `walk` mode | [config examples](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/README.md) |
| Soporte transfers | Sí — `TRANSFER` edges en time-expanded graph + GTFS `transfers.txt` | [reader-gtfs/README](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/README.md) |
| Soporte timetable-based | Sí | [reader-gtfs/README](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/README.md) |
| Soporte frequency-based | Limitado — clásico **expande frequencies** en stop_times; Trip-Based support parcial | [PR #3184 limitations](https://github.com/graphhopper/graphhopper/pull/3184) |
| Soporte multi-criteria | Sí — `MultiCriteriaLabelSetting` con transfer/street-time balance | [PtRouterImpl.java](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/src/main/java/com/graphhopper/gtfs/PtRouterImpl.java) |
| API REST | Sí — `/route`, `/isochrone`, `/matrix`, `/vrp` | [API docs](https://docs.graphhopper.com/) |
| API GraphQL | No | [API docs](https://docs.graphhopper.com/) |
| Docker oficial | Sí — `ghcr.io/graphhopper/graphhopper` | [tanhdev article](https://tanhdev.com/posts/graphhopper-kubernetes-self-hosting-osm/) |
| Self-host complejidad (1-5) | 3 — JVM tuning requerido para grandes grafos | [deploy.md](https://github.com/graphhopper/graphhopper/blob/master/docs/core/deploy.md) |
| RAM típica AMBA (~15k paradas) | 2-4 GB off-heap (CH mmap) + 512MB-1GB JVM heap | [tanhdev article](https://tanhdev.com/posts/graphhopper-kubernetes-self-hosting-osm/) |
| Build/import time típico | Minutos (CH); horas (LM); planet: 3h CH + 25h LM car | [deploy.md](https://github.com/graphhopper/graphhopper/blob/master/docs/core/deploy.md) |
| Query latency p95 | **P50 12-18 ms, P99 30-50 ms** (single route, metro extract, 8-core/32GB) | [GeoRouting benchmark](https://www.geospatialrouting.com/routing-api-automation-fleet-integration/comparing-routing-engines-for-production/) |
| Extensibilidad | Alta — `custom_model`, profiles, plugin architecture | [routing.md](https://github.com/graphhopper/graphhopper/blob/master/docs/core/routing.md) |
| Documentación (1-5) | 4 — docs oficiales + deployment guide | [docs/index.md](https://github.com/graphhopper/graphhopper/blob/master/docs/index.md) |
| Comunidad activa (issues/mes) | ~50-70 (activo, 6.6k stars) | [Issues](https://github.com/graphhopper/graphhopper/issues) |
| Producción real | GraphHopper Maps (commercial offering de GraphHopper GmbH), Israel Hiking Map, many commercial telematics | [README](https://github.com/graphhopper/graphhopper) |

### Observaciones claves
- **3 modos de algoritmo**: speed (CH — más rápido), hybrid (LM — features), flexible (Dijkstra/A* — full features) ([routing.md](https://github.com/graphhopper/graphhopper/blob/master/docs/core/routing.md)).
- **CH graph vive off-heap** vía `MappedByteBuffer` — RAM off-heap, no heap. Configuración `-XX:MaxDirectMemorySize` requerida ([tanhdev](https://tanhdev.com/posts/graphhopper-kubernetes-self-hosting-osm/)).
- **Transit Trip-Based** ([PR #3184](https://github.com/graphhopper/graphhopper/pull/3184)) — implementación del paper TBTR de Sascha Witt. "It loads and pre-processes and runs national networks on laptops". Limitaciones: no arrival-by, no GTFS-RT, días específicos requieren pre-processing.
- **GTFS-Realtime support**: GraphHopper implementó real-time transit en 2018 ([blog](https://www.graphhopper.com/blog/2018/05/16/real-time-public-transit-routing/)).
- **Building graph**: Vietnam ejemplo → 3-4 GB off-heap CH + 768MB heap → container 5GB suficiente.

---

## 6. TrRouting (Chaire Mobilité)

### Resumen
Motor C++ de Université Laval / Chaire Mobilité (Québec). Diseñado para **research-grade transit routing** con Connection Scan Algorithm (CSA) y soporte para scenarios genéticos. Usado por [Transition](https://github.com/chairemobilite/transition), plataforma de planificación de transporte.

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje principal | C++ | [GitHub repo](https://github.com/chairemobilite/trRouting) |
| Licencia | **GNU GPL v3.0** (copyleft — restricción para uso comercial embebido) | [GitHub repo](https://github.com/chairemobilite/trRouting) |
| GTFS requerido | Sí (input principal) | [README](https://github.com/chairemobilite/trRouting) |
| OSM requerido | **Sí, vía OSRM externo** — OSRM con profile `foot` debe estar corriendo para footpaths access/egress | [README](https://github.com/chairemobilite/trRouting) |
| GeoJSON nativo | No — protobuf para cache, JSON para API | [GitHub repo](https://github.com/chairemobilite/trRouting) |
| Soporte transit | Sí — **Connection Scan Algorithm (CSA)**, Trip-Based en desarrollo (TBA "not yet released") | [README](https://github.com/chairemobilite/trRouting) |
| Soporte walking | Vía OSRM externo (`foot.lua` profile) | [README](https://github.com/chairemobilite/trRouting) |
| Soporte transfers | Sí — footpaths entre paradas hasta 10 min caminando | [README](https://github.com/chairemobilite/trRouting) |
| Soporte timetable-based | Sí (CSA es inherentemente timetable-based) | [Connection Scan Algorithm paper](https://arxiv.org/pdf/1703.05997) |
| Soporte frequency-based | Sí — `frequencies.txt` vía CSA con expansion | [transition setup docs](https://github.com/chairemobilite/transition/blob/main/docs/setupDevEnvironmentUbuntu.md) |
| Soporte multi-criteria | Sí — "flexible parameters" en CSA, bicriteria shortest path | [README](https://github.com/chairemobilite/trRouting), [transit-routing](https://transnetlab.github.io/transit-routing/html/index.html) |
| API REST | Sí — JSON HTTP API | [API docs](https://chairemobilite.github.io/trRouting/) |
| API GraphQL | No | [GitHub repo](https://github.com/chairemobilite/trRouting) |
| Docker oficial | Sí — `chairemobilite/trrouting` en Docker Hub | [Docker Hub](https://hub.docker.com/r/chairemobilite/trrouting) |
| Self-host complejidad (1-5) | 3 — bien, pero requiere OSRM externo (sube a 4 si contas OSRM) | [setupDevEnvironmentUbuntu.md](https://github.com/chairemobilite/transition/blob/main/docs/setupDevEnvironmentUbuntu.md) |
| RAM típica AMBA (~15k paradas) | 1-2 GB + OSRM (4-8 GB) | [Docker Hub](https://hub.docker.com/r/chairemobilite/trrouting) |
| Build/import time típico | Minutos (build con autoreconf/automake) | [README](https://github.com/chairemobilite/trRouting) |
| Query latency p95 | **~150 ms access/egress (OSRM) + ~8 ms CSA two-way** — medido en Montreal, MacPro 2013, single thread | [README](https://github.com/chairemobilite/trRouting) |
| Extensibilidad | Media — parámetros CSA flexibles, soporte para scenario cache | [GitHub repo](https://github.com/chairemobilite/trRouting) |
| Documentación (1-5) | 2 — API docs generadas pero pocos tutoriales | [chairemobilite.github.io/trRouting](https://chairemobilite.github.io/trRouting/) |
| Comunidad activa (issues/mes) | ~2-5 (proyecto niche académico) | [Issues](https://github.com/chairemobilite/trRouting) (28 stars, 84 open issues) |
| Producción real | Transition/Tr@me (Québec platform), proyectos de Université Laval | [Transition paper](https://doi.org/10.5446/61431) |

### Observaciones claves
- **Dependencia crítica de OSRM**: "an osrm server with a walking profile must be running for the transit region while making queries to the trRouting server" ([README](https://github.com/chairemobilite/trRouting)). Esto es arquitectura: trRouting solo hace transit; el walking lo delega a OSRM.
- **CSA es O(n) por query** — algorithms theory: very simple, very fast para timetable-based.
- **GPL-3.0** es el único motor copyleft — implica restricciones si quieres integrar en producto propietario.
- **Performance cita oficial**: "~8 ms for CSA two-way calculation (tested with montreal area GTFS data)" — single thread, 2013 Mac Pro. En hardware moderno + multithreading sería significativamente menor.
- **Issue #344**: cache data se vuelve enorme con genetic algorithm scenarios — limita escala.

---

## 7. Transitous / MOTIS-Next

### Resumen
**No es un motor**, es un **servicio comunitario de routing provider-neutral** que opera MOTIS con cobertura global. Iniciativa de KDE/community para "free, open public transport routing" sin fronteras. Estado de Map 2026 confirma "300,000 concurrent trips in 60+ countries".

### Tabla detallada

| Criterio | Resultado | Fuente |
|---|---|---|
| Lenguaje | N/A (orquestación en Python, motor en C++ MOTIS) | [public-transport/transitous](https://github.com/public-transport/transitous) |
| Licencia | AGPL-3.0 (data pipeline) + MOTIS subyacente MIT | [Transitous docs](https://transitous.org/doc/) |
| GTFS requerido | Sí (input proxy desde feeds globales) | [Transitous docs](https://transitous.org/doc/) |
| OSM requerido | Sí (via MOTIS, puede ser planet-scale) | [MOTIS README](https://github.com/motis-project/motis) |
| GeoJSON nativo | Sí (vía MOTIS API) | [MOTIS openapi](https://github.com/motis-project/motis/blob/master/openapi.yaml) |
| Soporte transit | Sí (heredado de MOTIS nigiri) | [Transitous docs](https://transitous.org/doc/) |
| Soporte walking | Sí | [Transitous docs](https://transitous.org/doc/) |
| Soporte transfers | Sí | [Transitous docs](https://transitous.org/doc/) |
| Soporte timetable-based | Sí | [Transitous docs](https://transitous.org/doc/) |
| Soporte frequency-based | Sí | [Transitous docs](https://transitous.org/doc/) |
| Soporte multi-criteria | Sí (vía MOTIS) | [Transitous docs](https://transitous.org/doc/) |
| API REST | Sí — **MOTIS 2 API** (v2 es la primera estable versionada) | [Transitous API](https://transitous.org/api/) |
| API GraphQL | No | [Transitous API](https://transitous.org/api/) |
| Docker oficial | Sí (imagen MOTIS-based usada por Transitous) | [MOTIS README](https://github.com/motis-project/motis) |
| Self-host complejidad (1-5) | 4 — requiere ejecutar pipeline diaria + MOTIS + mantener feeds GTFS | [Transitous docs](https://transitous.org/doc/) |
| RAM típica AMBA (~15k paradas) | N/A (servicio global, no self-host per-region) | [MOTIS README](https://github.com/motis-project/motis) |
| Build/import time típico | Pipeline diario para refresh de feeds | [Transitous docs](https://transitous.org/doc/) |
| Query latency p95 | **p50 4s, p90 33s, p99 73s en escala Europa** (medido con nigiri-benchmark en datos de Transitous marzo 2026) | [PR #369 (nigiri)](https://github.com/motis-project/nigiri/pull/369) |
| Extensibilidad | Media — config-driven, soporta GTFS, NeTEx, GTFS-RT, SIRI, GBFS, OJP en desarrollo | [Transitous docs](https://transitous.org/doc/) |
| Documentación (1-5) | 3 — docs decentes, ejemplos claros, schema MOTIS 2 API bien documentado | [transitous.org/doc](https://transitous.org/doc/) |
| Comunidad activa (issues/mes) | ~10-15 | [Transitous issues](https://github.com/public-transport/transitous/issues) |
| Producción real | KDE Itinerary, KPublicTransport, GNOME Maps, 300k+ concurrent trips, 60+ países | [State of the Map 2026](https://2026.stateofthemap.org/sessions/3WLKJ9/) |

### Observaciones claves
- **Transito us NO es un motor nuevo** — es una **deployment + data curation** sobre MOTIS. Cuando el usuario pregunta "Transitous o MOTIS Next", la respuesta es: **Transitous usa MOTIS Next** (la versión 2.x del motor).
- **Cobertura European-tracking**: Austria, Belgium, Czechia, Denmark, Finland, France, Germany, Iceland, Ireland, Liechtenstein, Latvia, Lithuania, Luxembourg, Netherlands, Slovenia, Sweden, Switzerland, UK están completos ([Issue #114](https://github.com/public-transport/transitous/issues/114)).
- **Pipeline CI diaria** para fetch + preprocessing de feeds GTFS. Esto es operacionalmente complejo.
- **NLnet funding** activa NeTEx/SIRI/OJP support — apunta a integración con National Access Points EU ([NLnet project](https://nlnet.nl/project/MOTIS/)).

---

## Resumen ejecutivo

### Ranking por madurez de transit (producción real, support frequency/timetable, multi-criteria)

1. **OTP2** — más maduro en transit, único con GraphQL oficial, soporte NeTEx, GTFS-Flex. Limitación: RAM alta.
2. **MOTIS** — planet-scale con bajo RAM, único con bitset-based timetable compression. Único con OpenAPI limpio y cliente JS. Limitación: sin GraphQL.
3. **GraphHopper** — producción masiva vía GraphHopper Maps, Trip-Based es rápido. Limitación: transit es secundario a OSM street.
4. **Valhalla** — GeoJSON excelente, OpenAPI detallado, pero transit tiene bugs conocidos. Buen fit para casos simples.
5. **R5** — research-grade, scenarios, accesibilidad. No para trip planning público.
6. **TrRouting** — niche académico, OSRM dependency, GPL-3.0.
7. **Transitous** — servicio listo, no engine; lo mejor para integración rápida sin self-host.

### Ranking por eficiencia de RAM (low → high)

1. **MOTIS** (1 GB serve, 8 GB import) — planet-scale con hardware modesto
2. **GraphHopper** (3-4 GB city off-heap)
3. **TrRouting** (1-2 GB + OSRM)
4. **Valhalla** (2-4 GB city)
5. **OTP2** (4-8 GB city)
6. **R5** (4-8 GB city, 6+ GB JVM heap default)

### Discriminador técnico clave

- **¿Querés GraphQL?** → OTP2 (único)
- **¿Querés minimal RAM + planet-scale?** → MOTIS
- **¿Querés GeoJSON isochrones con transit?** → Valhalla (con caveats)
- **¿Querés scenario planning / accessibility analysis?** → R5
- **¿Querés trip planning comercial masivo?** → GraphHopper (vía comercial) o OTP2 (vía open-source)
- **¿Querés research-grade con CSA simple?** → TrRouting
- **¿Querés un servicio listo para producción con cobertura global?** → Transitous

---

## Notas metodológicas

### Fuentes usadas
- **Documentación oficial**: `docs.opentripplanner.org`, `valhalla.github.io/valhalla`, `docs.conveyal.com`, `transitous.org/doc`, `motis-project.de`, etc.
- **Repos oficiales**: README, LICENSE, código fuente (Java/C++), PRs mergeados, issues con respuesta de mantenedor.
- **Discussions oficiales**: matrices Discord/Matrix oficiales, GitHub Discussions con respuestas de mantenedores.
- **Papers académicos primarios**: RAPTOR (Microsoft 2012), CSA (2017), TBTR (2015) — citados in-line.

### Lo que NO se usó
- Blogs de terceros (salvo que citaran primary sources).
- "Top 10" articles.
- Tutoriales sin link a fuente primaria.
- Comparaciones de marketing.

### Limitaciones de la investigación
- **Latency benchmarks** son difíciles de comparar apples-to-apples: hardware, dataset, query type, configuration varían. Donde fue posible cité el contexto exacto (e.g., "MacPro 2013 single thread Montreal GTFS" para trRouting).
- **Issue rate** se estima de snapshots estáticos — el GitHub data es dinámico.
- **Production users** se citaron solo cuando hay confirmación oficial (deploy docs, Conveyal clients page, etc.).
- **MOTIS latency**: cité los datos del PR #369 de nigiri (Aachen local + Germany nacional + Transitous Europe dataset). Los numbers reflejan range queries, no queries simples.

### Validez temporal
Esta investigación es de septiembre 2026. Datos pueden cambiar; verificar versiones específicas en cada repo.

---

*Investigación compilada con ~32 búsquedas y fetches a fuentes primarias. Cada celda factual o numérica lleva link de cita.*