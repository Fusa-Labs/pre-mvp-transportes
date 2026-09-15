# Routing de Transporte Público SIN Horarios

**Tema:** Frequency-based routing, topological routing, y capacidades que se pueden (y no se pueden) calcular sin `stop_times.txt` detallado.

**Fuentes:** únicamente papers primarios, specs oficiales (gtfs.org), docs oficiales de OTP2/R5/MOTIS, y código fuente.

---

## 0. Contexto: ¿Qué significa "sin horarios"?

Hay tres niveles progresivos de información temporal que podemos tener sobre una red de transporte público:

| Nivel | Datos disponibles | GTFS mínimo |
|---|---|---|
| **0. Topología pura** | Stops, routes, transfers, geometría | `stops.txt`, `routes.txt`, `transfers.txt`, `shapes.txt` (sin `trips.txt` ni `stop_times.txt` con tiempos) |
| **1. Frequency-based** | Topología + frecuencias/headways por franja horaria | + `frequencies.txt` (con `headway_secs`) |
| **2. Timetable completo** | Topología + frecuencias + horarios discretos por trip | + `trips.txt` + `stop_times.txt` con `arrival_time`/`departure_time` |

Este documento cubre principalmente los **niveles 0 y 1**: qué se puede y qué NO se puede calcular sin un timetable discreto.

---

## 1. Frequency-based routing

### 1.1 Paper fundacional: Delling, Pajor, Werneck (RAPTOR, 2012)

El paper **"Round-Based Public Transit Routing"** ([Microsoft Research, ALENEX 2012](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf); [Transportation Science 2015](https://ideas.repec.org/a/inm/ortrsc/v49y2015i3p591-604.html)) introduce RAPTOR como alternativa a Dijkstra para redes de transporte público. El algoritmo **no usa priority queue** y procesa cada ruta (línea de bus/tren) **una vez por round**.

El paper **asume timetable discreto** (cada trip tiene departure/arrival absolutos). RAPTOR en su forma original calcula Pareto-optimal journeys minimizando **arrival time + number of transfers** en queries tipo "earliest arrival from s@t".

Lo crítico: RAPTOR **sí es extensible** a frequency-based. La sección 3 muestra cómo los rounds scan todas las rutas relevantes; para frecuencias, el barrido cambia pero la estructura se mantiene. El paper "Frequency-Based Search for Public Transit" (Bast & Storandt 2014, ver §1.4) es la extensión frequency-based de la familia.

> *"Because it does not rely on preprocessing, RAPTOR works in fully dynamic scenarios. Moreover, it can be easily extended to handle flexible departure times or arbitrary additional criteria, such as fare zones."* ([Delling et al. 2012](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf))

### 1.2 Delling, Katz, Pajor: "Frequency-based search for public transit" (2014)

Paper en SIGSPATIAL 2014, [ACM Digital Library](https://dl.acm.org/doi/10.1145/2666310.2666405), [PDF Freiburg](https://ad-publications.informatik.uni-freiburg.de/SIGSPATIAL_frequency_BS_2014.pdf).

Idea clave: **comprimir trips discretos en frequency labels** `([a, b], p, c)` donde:
- `[a, b]` = ventana de tiempo
- `p` = período
- `c` = travel cost

Cuando la frecuencia es suficientemente periódica, en vez de guardar miles de departure events discretos se guarda una tupla con `(start, end, headway, travel_time)`. La evaluación es **O(1)** vs. binary search sobre events discretos.

> *"We will now introduce a new type of profile search which incorporates the frequency-based compression directly. For this purpose, we consider the time-dependent graph model. Conventionally, the arcs in this model are augmented with sets of departure times each paired with a travel cost. We now replace these sets by our frequency-based representation. For every tuple constructed to cover departure times with the same associated costs, we insert a frequency label ([a, b], p, c)."* ([Bast & Storandt 2014](https://ad-publications.informatik.uni-freiburg.de/SIGSPATIAL_frequency_BS_2014.pdf))

Para profile queries (todos los journeys óptimos en una ventana horaria): un solo run de **Dijkstra con labels de frecuencia** produce la respuesta. Resultados: **5× más rápido que Transfer Patterns**, mejor compresión de espacio. Probado en redes metropolitanas y nacionales (London, Sweden, Germany).

**Finding sobre optimal compression**: encontrar la compresión frequency-óptima es **NP-hard**, por eso se usan heurísticas.

### 1.3 Pyrga et al. (2007/2008): time-dependent graph model

[ACM JEA 12, 2008](https://dl.acm.org/doi/10.1145/1227161.1227166) — paper fundacional sobre modelos de grafo para timetable information.

Dos modelos canónicos:
- **Time-expanded** (TE): un nodo por cada departure/arrival event, aristas con pesos escalares.
- **Time-dependent** (TD): un nodo por estación; las aristas tienen **funciones de costo piecewise-linear** que dependen del departure time.

> *"In a time-dependent graph there is one node for each stop and there arcs connecting the nodes with a cost function depending on the departure time."* ([Niels Lindner, ZIB lecture notes](https://www.zib.de/userpage/lindner/MAPTN_2018/L3.pdf))

El modelo TD es la base para incrustar frecuencias como labels. Es compacto pero requiere **Time-Dependent Dijkstra** (no el clásico Dijkstra).

### 1.4 MOTIS (Karlsruhe) — handling de frecuencias

[MOTIS](https://github.com/motis-project/motis/) es un routing engine de Karlsruhe, sucesor del original MOTIS descrito en la tesis de [Mathias Schnee (2009)](https://doi.org/10.26083/tuprints-00001989).

El core de MOTIS es **[nigiri](https://github.com/motis-project/nigiri)** — *"a very memory efficient and fast public transport routing core"*. Nigiri trabaja sobre datos de timetable **estático** (GTFS/NeTEx) con bitsets para service days.

> *"Ensure a valid timetable is used. If the timetable is outdated, it will not contain any trips to consider for upcoming dates."* ([motis-project/motis](https://github.com/motis-project/motis/))

Para MOTIS, **el timetable es obligatorio**: sin `stop_times.txt` con absolute times, no hay `transport_idx_t` para rutear. **Sí soporta GTFS frecuencias vía el timetable estándar** porque en MOTIS las frecuencias se modelan igual que trips discretos al ingest (no hay soporte nativo "frequency-only" distinto).

**API de MOTIS** ([openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml)) ofrece `realtimeMode: REALTIME | REALTIME_ANNOTATION_ONLY | OFF`, pero estos controlan GTFS-RT (real-time), NO frequencies vs. timetable. El parámetro `timetableView` distingue búsqueda "later departure + earlier arrival" (timetable-style) vs "waiting for first departure counts as travel time".

### 1.5 OTP2 (OpenTripPlanner v2) — handling de frecuencias

**OTP2 NO soportaba `frequencies.txt` originalmente**. Issue [#3262](https://github.com/opentripplanner/OpenTripPlanner/issues/3262) lo documenta explícitamente:

> *"OTP2 do not support the GTFS frequency.txt."* ([GitHub issue #3262](https://github.com/opentripplanner/OpenTripPlanner/issues/3262))

Soporte añadido en PR [#3916](https://github.com/opentripplanner/OpenTripPlanner/pull/3916) y mergeado en OTP2 v2.1 ([Changelog](https://docs.opentripplanner.org/en/v2.1.0/Changelog/)). Sin embargo:

> *"This PR adds support for using frequency entries in the RAPTOR routing. When using a mostly frequency-based network, I recommend adding searchWindow=0 to the query parameters."* ([PR #3916](https://github.com/opentripplanner/OpenTripPlanner/pull/3916))

La implementación inicial **ignoraba `exact_times=0`** y trataba todos los frequency trips como scheduled. Mejoras progresivas (v2.1 → v2.6) corrigieron issues como:
- NullPointerException en backward search con frequency-based trips ([#6211](https://github.com/opentripplanner/OpenTripPlanner/issues/6211))
- Crash en itineraries con frequencies donde `distanceM` no se computaba ([#6580](https://github.com/opentripplanner/OpenTripPlanner/issues/6580))

OTP2 sí soporta GTFS-Flex v2 (servicios on-demand), documentado en [Routing Modes](https://docs.opentripplanner.org/en/v2.6.0/RoutingModes/) — modo `FLEXIBLE`.

### 1.6 R5 (Conveyal)

[R5](https://github.com/conveyal/r5) *"is the routing engine for Conveyal, a web-based system that allows users to create transportation scenarios and evaluate them in terms of cumulative opportunities accessibility indicators."*

R5 está **diseñado desde el inicio** para redes mixtas (scheduled + headway-based):

> *"R5 handles both scheduled public transit and headway-based lines, using novel methods to characterize variation and uncertainty in travel times."* ([Conveyal R5 README](https://github.com/conveyal/r5/))

Para frequency-based routes, R5 usa **simulated schedules** (Monte Carlo). El parámetro `simulated schedules` en Conveyal UI ([methodology docs](https://docs.conveyal.com/analysis/methodology)) controla cuántas timetable alternativas se samplean:

> *"Conveyal's routing engine allows you to understand this uncertainty by simulating feasible timetables for all headway-based routes. For example, if the Red Line is set to depart Airport Station every ten minutes, without explicit timetables, one simulated timetable could include departures at 7:00, 7:10, 7:20…, and another simulated timetable could include departures at 7:02, 7:12, 7:22…"* ([Conveyal methodology](https://docs.conveyal.com/analysis/methodology))

[TransitLayer API de R5](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransitLayer.html) expone flags:
- `hasFrequencies`: boolean — ¿hay trips frequency-based?
- `hasSchedules`: boolean — ¿hay trips con timetable explícito?

Conveyal maneja ambos modos en el mismo engine, **no requiere timetable discreto**.

### 1.7 Expected arrival time cuando solo hay headway

Teoría clásica (desde los '60s):

**Half-headway rule**: cuando un servicio tiene headway regular `H`, los pasajeros llegan uniformemente → **waiting time esperado = H/2**.

> *"In the case of regular services where headways are equal, the mean waiting time of passengers is estimated assuming that (i) passengers arrive randomly at stops and (ii) passengers can be served by the first arriving vehicle, and is given by: E(W) = 1/2 H"* ([Esfeh et al., 2020](https://www.tandfonline.com/doi/full/10.1080/01441647.2020.1806942))

**Osuna-Newell correction** (1972) para headways variables:
> *"E(W) = 1/2 E(H) + Var(H)/E(H)"* ([Esfeh et al., 2020](https://www.sciencedirect.com/science/article/pii/S0965856421003001))

Para **múltiples rutas** sirviendo el mismo stop (modelo de Spiess-Florian 1989):
> *"E(W) = α/f_s, where f_s = Σ f_l"*, donde α representa la distribución (α=1/2 para headways iguales) ([Esfeh et al., 2020](https://www.tandfonline.com/doi/full/10.1080/01441647.2020.1806942))

**El paper "Half-(head)way there"** ([Stewart & Byrd, 2022](https://doi.org/10.1177/23998083221137077)) compara dos métodos:
1. **R5 método**: simulación Monte Carlo de timetables plausibles.
2. **Half-headway assumption**: E[W] = H/2.

> *"For travel time and accessibility results, there are spatially varying differences between our method and the conventional method relying on the assumption of half-headway waiting times. The conventional method appears to understate the benefits of transit in certain locations, particularly those served by multiple lines."* ([Stewart & Byrd 2022](https://doi.org/10.1177/23998083221137077))

**Threshold empírico** para servicios de alta frecuencia: **10 minutos de headway** es la línea divisoria estándar.

> *"There is no universal demarcation line available to distinguish between high and low frequency of bus service, 10 minutes of headway is a common threshold."* ([Islam 2022, UNSW thesis](https://doi.org/10.26190/unsworks/2583))

---

## 2. Routing puramente topológico/geográfico

### 2.1 ¿Es posible?

**Sí.** Pero hay una distinción crucial entre dos modelos de grafo:

**Time-expanded graph (TE)** ([Sternisko thesis](https://ad-publications.informatik.uni-freiburg.de/theses/Master_Jonas_Sternisko_2013.pdf)):
- Un nodo por cada **event** (departure/arrival de cada vehicle en cada stop).
- Aristas con peso escalar (tiempo entre eventos consecutivos).
- Necesita **horarios discretos**.
- Tamaño: O(|V| × T) donde T = número de trips.

**Time-dependent graph (TD)** ([Pyrga et al. 2007](https://dl.acm.org/doi/10.1145/1227161.1227166)):
- Un nodo por estación.
- Aristas con **función de tiempo** `f: t → travel_cost(t)`.
- Permite incrustar frecuencias como labels `([a,b], p, c)`.
- Tamaño: O(|V| + |E|).
- Funciona con o sin frecuencias.

**Modelo topológico puro** (sin tiempo):
- Grafo `G = (S, R, T)`:
  - `S` = stops (nodos)
  - `R` = rutas como hiperaristas o secuencias
  - `T` = transfer edges
- Pesos de aristas = distancia geográfica o tiempo de viaje promedio.

### 2.2 Dijkstra sobre grafo de paradas-rutas-transfers

El algoritmo base es **Dijkstra estándar** sobre el grafo topológico. Sin función de tiempo en las aristas, Dijkstra da el camino más corto en distancia/número de transfers/número de paradas.

El paper **"Adapting Dijkstra for Buffers and Unlimited Transfers"** ([arXiv 2603.11729](https://www.arxiv.org/pdf/2603.11729)) formaliza el modelo:

> *"We define a public transit network as a 4-tuple (S, T, R, G), where S denotes the set of stops, T the set of trips, R the set of routes, and G=(V,E) a directed, weighted transfer graph... Each edge e=(v,w)∈E is associated with a transfer time τ_tra(e)."* ([arXiv 2603.11729](https://www.arxiv.org/pdf/2603.11729))

Para topología pura:
- Eliminar `T` (trips).
- Mantener `S` (stops), `R` (routes como secuencias de stops), `G` (transfer graph).
- Cada edge (v, w) ∈ R tiene peso = distancia o tiempo medio de viaje entre paradas consecutivas.

> *"Our algorithm places no constraints on the structure of G and does not require precomputation: transitive closure is not required, strong connectivity is permitted."* ([arXiv 2603.11729](https://www.arxiv.org/pdf/2603.11729))

### 2.3 Casos de uso: accesibilidad y análisis de cobertura

**UrbanAccess** ([docs](https://udst.github.io/urbanaccess/introduction.html); [GitHub](https://github.com/CalthorpeAnalytics/urbanaccess)):
> *"UrbanAccess is tool for creating multi-modal graph networks for use in multi-scale (e.g. address level to the metropolitan level) transit accessibility analyses... It uses open data from General Transit Feed Specification (GTFS) data to represent disparate operational schedule transit networks and pedestrian OpenStreetMap (OSM) data."*

UrbanAccess computa impedancia de red **incluyendo average passenger headways para aproximar wait time**:

> *"by including average passenger headways to approximate passenger transit stop wait time"* ([UrbanAccess](https://udst.github.io/urbanaccess/introduction.html))

**GeoSimLab tau_net_calc** ([GitHub](https://github.com/geosimlab/tau_net_calc)) — Cumulative Number of Opportunities (CNO):
> *"The default CNO measure of a building's FROM-accessibility is the total number of buildings in the area accessible from B within a given travel time."*

**Mishra et al. (2013, TRB)** — *"A Graph Theoretic Approach for Public Transit Connectivity"* ([PDF](https://www.ce.memphis.edu/smishra/PDFs/Conference/2013_TRB_TransitConnectivityPaper.pdf)):
> *"The proposed methodology consists of better representations of transit node index measures... The connectivity index measures aggregate connecting power of all lines that are accessible to a given node."*

Estos papers computan **conectividad topológica pura** sin horarios.

---

## 3. Capacidades que SÍ podemos calcular sin horarios

### 3.1 Conectividad binaria entre dos paradas

¿Hay un camino entre A y B usando la red de transporte? Responde con un simple graph reachability (BFS/DFS).

Basado en: [Mishra et al. (2013)](https://www.ce.memphis.edu/smishra/PDFs/Conference/2013_TRB_TransitConnectivityPaper.pdf), [Barrena et al. (2015)](https://aimspress.com/aimspress-data/nhm/2015/1/PDF/1556-1801_2015_1_1.pdf) — hypergraph L-space connectivity.

### 3.2 Número mínimo de transfers (betweenness topological)

En un hypergraph donde cada ruta es un hyperedge, la distancia topológica en el **linear graph** L(H) cuenta el número mínimo de transfers:

> *"In the linear graph L(H), the distance dL(H)(Lp, Lq) from node Lp to Lq is the minimum number of edges of a shortest path between Lp and Lq. From the point of view of transfers, this distance indicates the number of transfers one needs to make when traveling from one line to different lines in the CTLN."* ([Barrena et al. 2015](https://aimspress.com/aimspress-data/nhm/2015/1/PDF/1556-1801_2015_1_1.pdf))

BFS en el L-space da esta respuesta.

### 3.3 Distancia transit total (suma de segmentos)

Si cada arista (stop_i → stop_{i+1}) tiene una distancia `d(s_i, s_{i+1})`, el camino más corto por Dijkstra da la distancia mínima en transit puro (sin walking entre paradas).

### 3.4 Distancia walking (acceso/egreso + transfers peatonales)

Si el grafo `G` incluye transfer edges con peso = walking distance / walking speed, Dijkstra resuelve distancia walking total.

El paper de Fayyaz et al. (2017, PLOS ONE):
> *"Step 2: Find connected routes to each station and update travel time by walking. The distances between all stations are calculated and converted to travel time assuming a constant walking speed of 2.98 miles per hour."* ([Fayyaz et al. 2017](https://doi.org/10.1371/journal.pone.0185333))

### 3.5 Número de paradas en el camino

Contando aristas (segmentos consecutivos) en el camino mínimo.

### 3.6 Línea/ramal a tomar (secuencia de routes)

Por ejemplo: tomar Línea A desde origen, transbordar a Línea B en parada X, transbordar a Línea C en parada Y, hasta destino. Esta secuencia viene del camino en el L-space graph (rutas como nodos).

### 3.7 Punto de transbordo

Cualquier nodo donde dos rutas distintas se intersectan y la ruta del camino cambia. Calculable desde la secuencia de routes.

### 3.8 Tiempo aproximado (con heurística)

Ver §5 — heurísticas de tiempo sin timetable.

---

## 4. Capacidades que NO podemos calcular sin horarios

### 4.1 Departure time exacto

Imposible sin timetable. Necesitamos al menos el primer trip disponible desde una parada en un momento dado.

### 4.2 Arrival time exacto

Imposible sin departure_time + durations en stop_times. **Solo con timetable discreto** (o frequency expansion exacta con `exact_times=1`).

### 4.3 Waiting time real

Depende de arrival time del pasajero + próximo departure. Sin horario no se sabe cuándo pasa el próximo vehículo.

### 4.4 Optimal time-dependent route

Por definición, time-dependent. Sin `f(t)` por arista o timetable, no hay cómo elegir.

> *"The classical approach is to model the public transit timetable as a graph and then apply a multicriteria variant of Dijkstra's Algorithm. The time-dependent and time-expanded approaches are the two most prominent ways of modeling the timetable."* ([Berger et al., SEA 2023](https://doi.org/10.4230/LIPIcs.SEA.2023.16))

### 4.5 Real ETA en vivo

Requiere GTFS-RT o SIRI-VM. Imposible con datos estáticos puros.

### 4.6 Reliability de un transfer

¿Puedo llegar a tiempo para tomar la línea B después de bajarme de la línea A? Depende de los tiempos reales. La tesis de MOTIS ([Schnee 2009](https://doi.org/10.26083/tuprints-00001989)) propone un criterio explícito:

> *"the reliability of interchanges, a measure of how likely it is to catch all connecting trains of a trip."*

---

## 5. Heurísticas de tiempo sin horarios

### 5.1 Tiempo = distancia / velocidad promedio

La heurística más simple:

```
travel_time(stop_i → stop_{i+1}) = distance(stop_i, stop_{i+1}) / avg_speed(mode)
```

Donde `avg_speed(mode)` puede ser:
- Bus urbano: 15-25 km/h
- Metro/subway: 30-45 km/h
- Tren: 50-100 km/h

Fayyaz et al. (2017) usa:
> *"2.98 miles per hour" ≈ 4.8 km/h* para walking. ([Fayyaz et al. 2017](https://doi.org/10.1371/journal.pone.0185333))

### 5.2 Tiempo por número de paradas

Empirical rule: tiempo entre paradas consecutivas de bus urbano ≈ **1.5-3 minutos** (incluye dwell time + aceleración + deceleración).

Bargegol et al. (2017, [PDF](https://reference-global.com/download/article/10.2478/ttj-2021-0004.pdf)) formaliza:
> *"Passengers wasted time because of acceleration and deacceleration... Passengers wasted time because of alighting and boarding of passengers at the stop n."*

Total travel time = walking_to_stop + waiting + in_vehicle + alighting/boarding_delay + walking_from_stop.

### 5.3 Expected travel time con fórmula half-headway

Para **frequent services** (headway ≤ 10 min):
```
E[total_travel_time] = walking_to + H/2 + Σ in_vehicle_per_leg + walking_from
```

Para **infrequent services** (headway > 10 min), los pasajeros sincronizan con timetable → waiting time ≈ 0 si tenés app; si no, E[W] ≈ H/2 peor caso.

Osuna-Newell para headways variables:
```
E[W] = (1/2) × E[H] + Var(H) / E[H]
```

### 5.4 Stochastic travel time (LET — Least Expected Time)

[Waller & Li (2016)](https://onlinelibrary.wiley.com/doi/10.1155/2016/7609572) propone:
> *"We consider the problem of determining a least expected time (LET) path that minimizes the number of transfers and the expected total travel time in a stochastic schedule-based transit network."*

Combina transfer penalty + expected travel time sobre un scenario set.

### 5.5 Pace-based accessibility

[Yang et al. (2026, Springer)](https://link.springer.com/article/10.1186/s44147-026-00887-x):
> *"Pace is defined as the reciprocal of journey speed (i.e., travel time per unit distance)... The utility is represented as the maximum expected utility of reaching various destinations that are reachable from the specified origin at the given time window within the desired time budget."*

```
pace = (α × IVTT + β × Walk + γ × Wait) / distance
accessibility_i = log(1 + Σ_j Σ_k w_ijk × exp(-pace_ijk))
```

Esto desacopla distance de congestion effects.

---

## 6. GTFS frequencies.txt

### 6.1 Definición oficial

[GTFS Schedule Reference](https://gtfs.org/documentation/schedule/reference/#frequenciestxt):
> *"frequencies.txt — Headway (time between trips) for headway-based service or a compressed representation of fixed-schedule service."* — **Optional**

### 6.2 Esquema (campos)

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `trip_id` | Foreign ID | Required | Referencia a `trips.txt` |
| `start_time` | Time | Required | HH:MM:SS |
| `end_time` | Time | Required | HH:MM:SS |
| `headway_secs` | Non-negative Integer | Required | Segundos entre departures |
| `exact_times` | Enum | Optional | 0 (default) = frecuencia pura, 1 = exactamente schedule |

[GTFS Schedule Reference](https://gtfs.org/documentation/schedule/reference/#frequenciestxt); [stuebinm.eu GTFS guide](https://stuebinm.eu/bookshelf/gtfs/ch-10-frequencies.html); [gtfs_engine docs](https://sangster.github.io/gtfs_engine/resources/frequency/).

### 6.3 Ejemplo real

Société de Transport de Montréal (STM) — Metro Green Line:

```csv
trip_id,start_time,end_time,headway_secs
22M-GLOBAUX-00-S_1_2,16:01:25,16:19:25,180
22M-GLOBAUX-00-S_1_2,16:19:25,17:03:25,165
```

([GTFS Frequencies Example](https://gtfs.org/documentation/schedule/examples/frequencies/))

Interpretación: entre 16:01 y 16:19, **trenes cada 3 minutos (180s)**. Entre 16:19 y 17:03, **cada 2:45 (165s)**.

### 6.4 Diferencia clave: `exact_times=0` vs `exact_times=1`

**`exact_times=0` (default)** — servicio puro de frecuencia:
> *"Between 9 AM and 10 AM this trip departs every 5 minutes."* ([stuebinm.eu](https://stuebinm.eu/bookshelf/gtfs/ch-10-frequencies.html))

El operador garantiza headway pero no departure times absolutos. El planning engine debe asumir una distribución uniforme de arrivals.

**`exact_times=1`** — frecuencia **discretizada** (compressed timetable):
> *"This trip departs at 9 AM, 9:05 AM, 9:10 AM, ..."*

Para `exact_times=1`, los trips **ocurren en** `start_time + x × headway_secs` para `x ∈ (0, 1, 2, ...)`. El planner puede tratarlos como timetable expandido.

> *"The value of exact_times must be the same for all frequencies.txt rows with the same trip_id. If exact_times is 1 and a frequencies.txt row has a start_time equal to end_time, no trip must be scheduled."* ([gtfs_engine docs](https://sangster.github.io/gtfs_engine/resources/frequency/))

### 6.5 Importante sobre stop_times.txt con frequencies

> *"Actual stop times are ignored for trips referenced by frequencies.txt; only travel time intervals between stops are significant for frequency-based trips."* ([GTFS Best Practices](https://gtfs.org/documentation/schedule/schedule-best-practices/))

Es decir: para un trip con `frequencies.txt`, `stop_times.txt` solo importa la **diferencia de tiempo entre paradas consecutivas** (relative offsets), no los absolute times.

---

## 7. Cómo lo resuelven los motores cuando NO hay horarios

### 7.1 OTP2 (OpenTripPlanner)

**Requiere timetable en general.** Sin `stop_times.txt` con absolute times, OTP2 no puede construir el timetable data model.

Frequencies están soportados desde v2.1 ([Changelog v2.1](https://docs.opentripplanner.org/en/v2.1.0/Changelog/)):

> *"Support for frequency-based trips (GTFS frequencies.txt, does not exist in Netex)"*

Limitaciones prácticas:
- `exact_times=0` históricamente se trataba como `exact_times=1` (PR [#3394](https://github.com/opentripplanner/OpenTripPlanner/pull/3394) lo implementó así).
- Issue [#3262](https://github.com/opentripplanner/OpenTripPlanner/issues/3262) es el long-running thread sobre el diseño.
- Issue [#7099](https://github.com/opentripplanner/OpenTripPlanner/issues/7099) "Improvement on frequency based trips support" sigue abierto (refleja que aún hay work-in-progress).
- GTFS-RT en frequency-based trips sigue **NO implementado** ([#1347](https://github.com/opentripplanner/OpenTripPlanner/issues/1347) aún sin resolución).

### 7.2 R5 (Conveyal)

**Trabaja con o sin horarios.** Diseñado nativamente para ambos:
- Detecta automáticamente si una red es "frequency-only".
- Si no hay schedules: usa **simulated schedules** (Monte Carlo sobre `frequencies.txt`).
- Parámetro `simulated schedules` (200 recomendado para interactive, 1000 para análisis final).
- Soporta phasing (timed transfers) para reducir incertidumbre.

> *"If your scenario does not include frequency-based routes there is no need to simulate schedules so the requested number of simulated schedules is ignored."* ([Conveyal configuration](https://docs.conveyal.com/analysis/configuration))

**TransitLayer** tiene campos específicos:
- `hasFrequencies`: ¿hay trips frequency-based?
- `hasSchedules`: ¿hay trips con timetable explícito?
- `frequencyEntryIndexForId`: index de frequency entries por trip.

([R5 TransitLayer javadoc](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransitLayer.html))

### 7.3 MOTIS (Karlsruhe)

**Requiere timetable** (`stop_times.txt` con absolute times). Nigiri trabaja sobre bitsets de service days con secuencias `(departure, arrival, departure, arrival, ...)` por trip.

> *"trip_idx_t: a trip is used to communicate with the outside world. Trips come from static timetable data which is usually given in some kind of local time"* ([nigiri README](https://github.com/motis-project/nigiri))

Frequencies se ingestan expandiéndolas a trips discretos durante el build (equivalente a `exact_times=1`). No hay soporte explícito para **frequency-only** sin ningún absolute time.

---

## 8. Tabla resumen

| Capacidad | Topología pura | Frequencies only | Timetable |
|---|---|---|---|
| Conectividad binaria A→B | ✅ | ✅ | ✅ |
| Número mínimo de transfers | ✅ | ✅ | ✅ |
| Secuencia de rutas/líneas | ✅ | ✅ | ✅ |
| Punto de transbordo | ✅ | ✅ | ✅ |
| Distancia transit (geométrica) | ✅ | ✅ | ✅ |
| Distancia walking | ✅ | ✅ | ✅ |
| Número de paradas | ✅ | ✅ | ✅ |
| Tiempo approx (distancia/velocidad) | ✅ (heurística) | ✅ (heurística mejor) | ✅ |
| Tiempo approx (con headway formula) | ❌ | ✅ (E[W] = H/2) | ✅ |
| Tiempo medio (mean across distribution) | ❌ | ✅ (Monte Carlo / Osuna-Newell) | ✅ |
| **Departure time exacto** | ❌ | ❌ (excepto `exact_times=1`) | ✅ |
| **Arrival time exacto** | ❌ | ❌ (excepto `exact_times=1`) | ✅ |
| **Waiting time real** | ❌ | ❌ | ✅ |
| **Optimal time-dependent route** | ❌ | ⚠️ (profile queries) | ✅ |
| **Real ETA (live)** | ❌ | ❌ | ❌ (necesita RT) |
| **Reliability de transfer** | ❌ | ⚠️ (probabilístico) | ✅ |

---

## 9. Recomendaciones para Fusalabs

Si el input es solo `stops.txt + routes.txt + frequencies.txt` (sin `stop_times.txt` con absolute times):

1. **Sí implementar**:
   - Grafo topológico paradas-rutas-transfers.
   - Dijkstra/BFS sobre el grafo L-space para: conectividad, transfers mínimos, secuencia de líneas.
   - Heurística de tiempo: `E[travel_time] = walking_to + H/2 + Σ(dist/avg_speed) + walking_from`.
   - Para high-frequency (H ≤ 10 min): fórmula half-headway.
   - Para frequencies con varianza: Osuna-Newell.
   - Perfil de accesibilidad cumulative opportunities (estilo R5 / UrbanAccess).

2. **NO prometer**:
   - Departure/arrival time exactos.
   - "Optimal route en este momento exacto" — sin departure_time input es imposible.
   - Live ETA.

3. **Casos edge**:
   - Mixto (algunas rutas con frequencies, otras con schedules): OTP2/R5 lo soportan; considerar integración.
   - Si frecuencias tienen `exact_times=1`: **expandir** a trips discretos al build (RAPTOR/MOTIS lo hacen internamente).

4. **Validación**:
   - Comparar E[travel_time] estimado vs. R5 sobre misma red.
   - Comparar con [Stewart & Byrd 2022](https://doi.org/10.1177/23998083221137077): el half-headway tiende a **subestimar beneficios** en zonas servidas por múltiples líneas → usar corrección tipo Spiess-Florian.

---

## Referencias citadas (solo primarias)

### Papers

1. Delling, Pajor, Werneck (2012/2015). *Round-Based Public Transit Routing*. ALENEX / Transportation Science. — [PDF Microsoft](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf); [MS Research page](https://www.microsoft.com/en-us/research/publication/round-based-public-transit-routing/); [INFORMS repec](https://ideas.repec.org/a/inm/ortrsc/v49y2015i3p591-604.html).
2. Bast, Storandt (2014). *Frequency-based search for public transit*. SIGSPATIAL. — [ACM DL](https://dl.acm.org/doi/10.1145/2666310.2666405); [PDF Freiburg](https://ad-publications.informatik.uni-freiburg.de/SIGSPATIAL_frequency_BS_2014.pdf).
3. Pyrga, Schulz, Wagner, Zaroliagis (2007/2008). *Efficient models for timetable information in public transportation systems*. ACM JEA 12. — [ACM DL](https://dl.acm.org/doi/10.1145/1227161.1227166).
4. Bast et al. (2010). *Fast Routing in Very Large Public Transportation Networks Using Transfer Patterns*. ESA. — [PDF Freiburg](https://ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf); [Google Research](https://research.google/pubs/fast-routing-in-very-large-public-transportation-networks-using-transfer-patterns/); [Springer](https://link.springer.com/chapter/10.1007/978-3-642-15775-2_25).
5. Dibbelt, Pajor, Strasser, Wagner (2013). *Intriguingly Simple and Fast Transit Routing*. SEA. — [PDF ben-strasser.net](http://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf).
6. Conway, Byrd, van der Linden (2017). *Evidence-Based Transit and Land Use Sketch Planning Using Interactive Accessibility Methods on Combined Schedule and Headway-Based Networks*. TRR. — [DOI](https://doi.org/10.3141/2653-06).
7. Stewart, Byrd (2022). *Half-(head)way there: Comparing two methods to account for public transport waiting time in accessibility indicators*. SAGE / MIT. — [DOI](https://doi.org/10.1177/23998083221137077); [MIT DSpace](https://dspace.mit.edu/handle/1721.1/146736).
8. Esfeh et al. (2020). *Waiting time and headway modelling for urban transit...*. Taylor & Francis. — [DOI](https://www.tandfonline.com/doi/full/10.1080/01441647.2020.1806942); [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0965856421003001).
9. Waller, Li (2016). *Least Expected Time Paths in Stochastic Schedule-Based Transit Networks*. Wiley. — [DOI](https://onlinelibrary.wiley.com/doi/10.1155/2016/7609572).
10. Fayyaz, Liu, Zhang (2017). *An efficient GTFS-enabled algorithm for dynamic transit accessibility analysis*. PLOS ONE. — [DOI](https://doi.org/10.1371/journal.pone.0185333).
11. Mishra et al. (2013). *A Graph Theoretic Approach for Public Transit Connectivity*. TRB. — [PDF Memphis](https://www.ce.memphis.edu/smishra/PDFs/Conference/2013_TRB_TransitConnectivityPaper.pdf).
12. Barrena, De-Los-Santos, Laporte, Mesa (2015). *Analyzing the transferability of collective transportation line networks*. NHM. — [PDF AIMS Press](https://aimspress.com/aimspress-data/nhm/2015/1/PDF/1556-1801_2015_1_1.pdf).
13. Schnee, M. (2009). *Fully Realistic Multi-Criteria Timetable Information Systems*. TUPrints. — [DOI](https://doi.org/10.26083/tuprints-00001989).
14. Sternisko, J. (2013). *Master thesis on Transfer Patterns*. Freiburg. — [PDF](https://ad-publications.informatik.uni-freiburg.de/theses/Master_Jonas_Sternisko_2013.pdf).
15. Berger et al. (2023). *Arc-Flags Meet Trip-Based Public Transit Routing*. SEA. — [PDF Dagstuhl](http://dagstuhl.sunsite.rwth-aachen.de/volltexte/2023/18366/pdf/LIPIcs-SEA-2023-16.pdf).
16. Amin-Naseri, Baradaran (2014). *Accurate Estimation of Average Waiting Time in Public Transportation Systems*. Transportation Science. — [DOI](https://doi.org/10.1287/trsc.2013.0514).
18. Islam, M. K. (2022). *Stochastic modelling for evaluation of impacts of headway variability on public transit performance*. UNSW thesis. — [DOI](https://doi.org/10.26190/unsworks/2583).
19. Yang et al. (2026). *Revisiting transit accessibility: effect of stochasticity, real-time information...* Springer. — [DOI](https://link.springer.com/article/10.1186/s44147-026-00887-x).
20. Bargegol et al. (2021). *Robust Optimization of Bus Stop Placement...* Transport Technique. — [PDF](https://reference-global.com/download/article/10.2478/ttj-2021-0004.pdf).
21. Lee et al. (PMC). *Realizable accessibility: evaluating the reliability of public transit...* — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9122481/).
22. *Adapting Dijkstra for Buffers and Unlimited Transfers*. arXiv 2603.11729. — [HTML](https://arxiv.org/html/2603.11729v5); [PDF](https://www.arxiv.org/pdf/2603.11729).
23. Lindner, N. (2018). *Mathematical Aspects of Public Transportation Networks*. ZIB lecture notes. — [PDF](https://www.zib.de/userpage/lindner/MAPTN_2018/L3.pdf).
24. Nguyen, H. C. *Engineering Multimodal Transit Route Planning*. KIT thesis. — [PDF](https://algo.iti.kit.edu/_media/teaching/theses/ma-nguyen.pdf).
25. Khani, Hickman, Noh (2015). *Trip-Based Path Algorithms Using the Transit Network Hierarchy*. Networks and Spatial Economics. — [RePEc](https://ideas.repec.org/a/kap/netspa/v15y2015i3p635-653.html).
26. Bast, H. (2009). *Car or Public Transport—Two Worlds*. Efficient Algorithms LNCS. — [PDF](https://ad-publications.informatik.uni-freiburg.de/EfficientAlgorithms_Car_Bast_2009.pdf).
27. *An efficient GTFS enabled algorithm...* (2017). PLOS ONE open archive. — [PDF](https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0185333&type=printable).
28. Wessel, Allen, Farber. *On the accuracy of schedule-based GTFS for measuring accessibility*. JTLU. — [Article](https://www.jtlu.org/index.php/jtlu/article/view/1502).
29. Mishra et al. *A Tool for Measuring and Visualizing Connectivity...* — [PDF](https://www.ce.memphis.edu/smishra/PDFs/Journal/PublicTransit_TransitConnectivity.pdf).

### Specs oficiales

30. GTFS Schedule Reference (MobilityData). — [gtfs.org](https://gtfs.org/documentation/schedule/reference/).
31. GTFS frequencies.txt Reference. — [gtfs.org](https://gtfs.org/documentation/schedule/reference/#frequenciestxt).
32. GTFS Frequencies Example. — [gtfs.org](https://gtfs.org/documentation/schedule/examples/frequencies/).
33. GTFS Best Practices (frequencies.txt). — [gtfs.org](https://gtfs.org/documentation/schedule/schedule-best-practices/).

### Documentación de motores

34. OTP2 Routing Modes. — [docs.opentripplanner.org](https://docs.opentripplanner.org/en/v2.6.0/RoutingModes/).
35. OTP2 Changelog. — [docs.opentripplanner.org v2.1](https://docs.opentripplanner.org/en/v2.1.0/Changelog/); [v2.3](https://docs.opentripplanner.org/en/v2.3.0/Changelog/); [latest](https://docs.opentripplanner.org/en/latest/Changelog/).
36. Conveyal R5 README. — [GitHub](https://github.com/conveyal/r5).
37. Conveyal Methodology (frequency-based). — [docs.conveyal.com](https://docs.conveyal.com/analysis/methodology).
38. Conveyal Configuration (simulated schedules). — [docs.conveyal.com](https://docs.conveyal.com/analysis/configuration).
39. Conveyal R5 TransitLayer Javadoc. — [javadoc.conveyal.com](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransitLayer.html).
40. MOTIS GitHub. — [motis-project/motis](https://github.com/motis-project/motis/).
41. MOTIS OpenAPI spec. — [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml).
42. MOTIS nigiri. — [motis-project/nigiri](https://github.com/motis-project/nigiri).
43. UrbanAccess introduction. — [udst.github.io](https://udst.github.io/urbanaccess/introduction.html).
44. GeoSimLab tau_net_calc. — [GitHub](https://github.com/geosimlab/tau_net_calc).
45. r5r R package accessibility(). — [rdrr.io](https://rdrr.io/cran/r5r/man/accessibility.html).

### GitHub issues / PRs / código fuente

46. OTP2 Issue #3262: Add back frequency.txt to OTP2. — [GitHub](https://github.com/opentripplanner/OpenTripPlanner/issues/3262).
47. OTP2 PR #3916: Add routing using frequency trips. — [GitHub](https://github.com/opentripplanner/OpenTripPlanner/pull/3916).
48. OTP2 PR #3394: feat: Support for Frequency based trips. — [GitHub](https://github.com/opentripplanner/OpenTripPlanner/pull/3394).
49. OTP2 Issue #6422: Frequency-based trips don't appear in stoptimesForPatterns query. — [GitHub](https://github.com/opentripplanner/OpenTripPlanner/issues/6422).
50. OTP2 Issue #7099: Improvement on frequency based trips support. — [GitHub](https://github.com/opentripplanner/OpenTripPlanner/issues/7099).
51. OTP2 Issue #1347: GTFS-realtime support for Frequency Based trip. — [GitHub](https://github.com/opentripplanner/OpenTripPlanner/issues/1347).
52. MOTIS PR #1473: query without realtime. — [GitHub](https://github.com/motis-project/motis/pull/1473).
53. Transit-routing: TE_DIJ Dijkstra docs. — [transnetlab](https://transnetlab.github.io/transit-routing/html/Algorithms/TIME_EXPANDED/TE_DIJ.html).
54. Catenary routing engine transit_dijkstras.rs. — [GitHub](https://github.com/catenarytransit/catenary-routing-engine/blob/main/src/transit_dijkstras.rs).

### Guías secundarias (consultadas como referencia, no como autoridad)

55. stuebinm.eu *The Definitive Guide to GTFS*. — [Chapter 10](https://stuebinm.eu/bookshelf/gtfs/ch-10-frequencies.html).
56. gtfs_engine frequency docs. — [sangster.github.io](https://sangster.github.io/gtfs_engine/resources/frequency/).
57. StackExchange *Average wait time arriving at subway randomly*. — [math.stackexchange](https://math.stackexchange.com/questions/52493/average-wait-time-arriving-at-subway-randomly).
58. Catenary Routing Engine docs. — [catenarymaps.org](https://docs.catenarymaps.org/contributing/backend/routing).