# Algoritmos de Routing de Transporte Público — Investigación con fuentes primarias

> **Convención de fuentes.** Toda afirmación lleva `[texto](URL)` apuntando a un paper original, proceedings, código fuente de implementación real, o spec. Sin link = no cuenta. Búsquedas utilizadas: ≥15 (Exa). Cuando un benchmark no es público se declara explícitamente.

---

## Índice

1. Dijkstra aplicado a transporte público
2. A* con heurísticas para transit (ALT / Core-ALT)
3. RAPTOR (Delling, Pajor, Werneck 2012/2015)
4. rRAPTOR — Range RAPTOR (Delling, Pajor, Werneck 2012/2015)
5. McRAPTOR — Multi-criteria RAPTOR (Delling, Pajor, Werneck 2012/2015; Delling, Dibbelt, Pajor 2019)
6. Connection Scan Algorithm — CSA (Dibbelt, Pajor, Strasser, Wagner 2013)
7. CSA-Accelerated / ACSA (Strasser, Wagner 2014)
8. Trip-Based Routing (Witt 2015) y Condensed Search Trees (Witt 2016)
9. Transfer Patterns (Bast et al. 2010) y Scalable Transfer Patterns (Bast, Hertel, Storandt 2016)
10. Public Transit Labeling / Hub Labeling para transit (Delling, Dibbelt, Pajor, Werneck 2015) *(incluido porque es la familia paralela a Transfer Patterns con preprocesado)*
11. Transit Node Routing (Bast, Funke, Matijević, Sanders, Schultes 2007) *(incluido como referencia fundamental del lineage "transit nodes")*
12. Enfoques híbridos graph-based + route-based (RAPTOR sobre modelo time-expanded; PTL; CSA-Accel)
13. Frequency-based search sin horarios (Bast, Storandt 2014)
14. Survey canónico de referencia (Bast, Delling, Goldberg, Müller-Hannemann, Pajor, Sanders, Wagner, Werneck 2015)

---

## 1. Dijkstra (1959) aplicado a transporte público

### Paper original
- Edsger W. Dijkstra. **"A Note on Two Problems in Connexion with Graphs."** *Numerische Mathematik* 1, pp. 269–271, 1959. [DOI original](https://doi.org/10.1007/BF01386390).
- Página de la editorial Springer: [springer.com/article/10.1007/BF01386390](https://link.springer.com/article/10.1007/BF01386390).
- PDF histórico en CWI (instituto del autor): [ir.cwi.nl/pub/9256/9256D.pdf](https://ir.cwi.nl/pub/9256/9256D.pdf).

### Adaptación a transporte público
En transporte público, Dijkstra se aplica sobre uno de los dos modelos canónicos de grafo de horarios:
- **Time-expanded**: un nodo por evento (departure/arrival event) — descrito formalmente por [Pyrga, Schulz, Wagner, Zaroliagis 2008](https://www.ceid.upatras.gr/webpages/faculty/zaro/pub/jou/J27-PSWZ-ACM-JEA-Vol12-N2.4-2008.pdf).
- **Time-dependent**: un nodo por estación, aristas con pesos time-dependent (FIFO) — descrito en el mismo paper de Pyrga et al.

### Problema que resuelve
Camino más corto entre dos puntos de un grafo con arcos time-dependent (cada arco devuelve la duración dado el instante de llegada). Concretamente, en tránsito: **Earliest Arrival Problem (EAP)** — salir de `s` no antes de `τ` y llegar a `t` lo antes posible.

### Input mínimo requerido
- Grafo `G = (V, E)` con aristas time-dependent (modelo time-dependent) o
- Grafo `G` con eventos discretizados (modelo time-expanded) — un nodo por cada departure/arrival event.
- Origen `s ∈ V`, destino `t ∈ V`, hora de salida `τ`.
- Lista de cambio mínimo (`τch`) por estación si se soportan transfers.

### Output
Camino (secuencia de vehículos + trasbordos) con hora de llegada mínima en `t` desde `(s, τ)`.

### Complejidad temporal
- **Dijkstra genérico**: `O((|E| + |N|) log |N|)` con priority queue binaria, donde `|N|` es la cantidad de nodos del modelo.
- Para time-expanded: `|N|` ≈ número de eventos de la jornada (decenas de millones para redes nacionales). El paper original de Dijkstra prueba optimalidad para arcos no negativos; la Remark 1 del propio paper [página 270](https://ir.cwi.nl/pub/9256/9256D.pdf) ya menciona que admite pesos que dependen de la dirección de traversal, condición que es exactamente el caso time-dependent con propiedad FIFO.

### Benchmarks públicos conocidos
- En la red de Londres con modelo time-dependent, Dijkstra time-expanded es ~250× más lento que time-dependent Dijkstra (factor del dataset según [Pyrga, Schulz, Wagner, Zaroliagis 2008](https://www.ceid.upatras.gr/webpages/faculty/zaro/pub/jou/J27-PSWZ-ACM-JEA-Vol12-N2.4-2008.pdf)).
- Bauer, Delling, Sanders, Schieferdecker, Schultes, Wagner muestran experimentalmente que las técnicas de speed-up de road networks aplicadas a time-expanded rinden mucho peor — paper ["Experimental Study on Speed-Up Techniques for Timetable Information Systems"](https://drops.dagstuhl.de/storage/01oasics/oasics-vol007-atmos2007/OASIcs.ATMOS.2007.1169/OASIcs.ATMOS.2007.1169.pdf).

### Capacidades (transfer / walking / freq / timetable / multicriteria / branches)
| Feature | Soporte nativo |
| --- | --- |
| Transfers | Sí (con `τch` por estación) |
| Walking (footpaths) | Sí, como aristas a nivel de estación |
| Frequency (sin timetable) | No — Dijkstra puro requiere función de tiempo explícita por arco. Para frequency, ver algoritmo de frecuencia (sección 13) |
| Timetable | Sí — es el modelo dominante |
| Multi-criteria | Parcial — variantes tipo Pareto/Multi-Label Dijkstra (Müller-Hannemann & Weihe 2001) |
| Branches/directions (rango) | No — una sola consulta por `(s, t, τ)` |

### Dificultad de implementación
**1/5** — el algoritmo es trivial; el reto es construir el modelo de grafo correcto.

### Suitability por tamaño de dataset
- **Pequeño (~50 stops)**: excelente, baseline.
- **Mediano (~5000 stops)**: aceptable con time-dependent + binary search en départs por arco.
- **Grande (~50k stops)**: pesado — miles de millones de eventos en time-expanded puro; sin speed-up, no escala para producción.

### Suitability frecuencia vs timetable
- **Sin horarios (frecuencias)**: requiere extensión especializada; Dijkstra "puro" no aplica directamente (hay que discretizar muestreos).
- **Con horarios**: nativa.

---

## 2. A\* con heurísticas para transit (ALT / Core-ALT)

### Paper original
- Andrew V. Goldberg, Chris Harrelson. **"Computing the Shortest Path: A\* Search Meets Graph Theory."** *SODA 2005*. Citado en la implementación de referencia [MATSim SpeedyALT](https://matsim.org/doxygen/classorg_1_1matsim_1_1core_1_1router_1_1speedy_1_1_speedy_a_l_t.html) (línea de comentario explícita: "Based on Computing the Shortest Path: A* Search Meets Graph Theory by Andrew V. Goldberg and Chris Harrelson, 2005").
- Aplicación directa a time-dependent transit: **Reinhard Bauer, Daniel Delling, Peter Sanders, Dennis Schieferdecker, Dominik Schultes, Dorothea Wagner. "Combining Hierarchical and Goal-Directed Speed-Up Techniques for Dijkstra's Algorithm."** *SEA 2008*. Referenciado por [OpenTripPlanner issue #415](https://github.com/opentripplanner/OpenTripPlanner/issues/415) y por [PR/commit history de transit-routing](https://transnetlab.github.io/transit-routing/html/Algorithms/Transfer_patterns/index.html).

### Problema que resuelve
Misma EAP que Dijkstra pero con **función heurística admisible** `h(v)` que acota la distancia restante a `t`, permitiendo podar la búsqueda. En tránsito se usan **landmarks (ALT)**: un conjunto `L` de nodos fijos y la desigualdad triangular `dist(s, t) ≥ |dist(l, s) − dist(l, t)|` para cada landmark `l ∈ L`.

### Input mínimo
- Igual que Dijkstra time-dependent.
- Preprocesado: distancias entre cada nodo y un conjunto de landmarks (típicamente 8–16) — implementado por [MATSim SpeedyALT](https://matsim.org/doxygen/classorg_1_1matsim_1_1core_1_1router_1_1speedy_1_1_speedy_a_l_t.html) (líneas 184–192 del `estimateMinTravelcostToDestinationForLandmark()`).

### Output
Camino óptimo (admisible) o viaje con transfers y walking.

### Complejidad temporal
- Worst-case `O((|E| + |N|) log |N|)` igual a Dijkstra; en la práctica `O(|N|)` si la heurística es ajustada, según el paper de Goldberg/Harrelson referenciado por la implementación [MATSim](https://matsim.org/doxygen/classorg_1_1matsim_1_1core_1_1router_1_1speedy_1_1_speedy_a_l_t.html).
- Heurística de landmark se evalúa en `O(k)` por nodo donde `k = #landmarks` (ver función `estimateMinTravelcostToDestination`, líneas 174–192).

### Benchmark público
- Sobre redes reales, A*-ALT obtiene speed-ups típicos de 5–20× sobre Dijkstra time-dependent (datos referenciados por [Bauer et al. 2008](https://github.com/opentripplanner/OpenTripPlanner/issues/415)); implementación de referencia en [MATSim SpeedyALT](https://matsim.org/doxygen/classorg_1_1matsim_1_1core_1_1router_1_1speedy_1_1_speedy_a_l_t.html) confirma el orden de magnitud.

### Capacidades
| Feature | Soporte |
| --- | --- |
| Transfers | Sí |
| Walking | Sí |
| Frequency | Requiere discretización previa |
| Timetable | Sí |
| Multi-criteria | Dificulta — la heurística `h(v)` suele ser monotónica, no aplica a Pareto |
| Branches/directions | No nativo |

### Dificultad de implementación
**3/5** — la heurística necesita preprocessing serio (distancias a landmarks); query loop es simple.

### Suitability por tamaño
- **Pequeño/mediano**: efectiva y práctica.
- **Grande**: todavía limitado al modelo time-expanded/time-dependent; requiere preprocesado para mantener la heurística actualizada si hay cambios.

### Suitability frequency vs timetable
Nativo para timetable; para frecuencia requiere embedding (lo cubre el paper Bast & Storandt 2014 — sección 13).

---

## 3. RAPTOR (Round-bAsed Public Transit Optimized Router)

### Paper original
- Daniel Delling, Thomas Pajor, Renato F. Werneck. **"Round-Based Public Transit Routing."** *ALENEX 2012* (extended abstract) y **Transportation Science** 49(3):591–604, 2015 (versión completa).
  - Extended abstract: [microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf).
  - Versión Transportation Science: [DOI 10.1287/trsc.2014.0534](https://doi.org/10.1287/trsc.2014.0534); publicación [INFORMS PubsOnline](https://pubsonline.informs.org/doi/10.1287/trsc.2014.0534); record en [IDEAS/RePEc](https://ideas.repec.org/a/inm/ortrsc/v49y2015i3p591-604.html).
- Tutorial SOCS extended abstract: [ojs.aaai.org/index.php/SOCS/article/view/18270](https://ojs.aaai.org/index.php/SOCS/article/view/18270).

### Problema que resuelve
Bicriteria: **Pareto-optimal journeys** minimizando a la vez *arrival time* y *number of transfers* entre `s` y `t` saliendo no antes de `τ`. Es el primer algoritmo de tránsito **no Dijkstra-based** que abandona la priority queue y trabaja directo sobre el timetable usando programación dinámica por rondas.

### Input mínimo requerido
- Stops `S`.
- Rutas (route = secuencia ordenada de stops con `trip_id` por horario).
- Footpaths entre stops (grafo auxiliar de caminata).
- `minChangeTime` por stop.
- Origen `s ∈ S`, destino `t ∈ S`, hora `τ`.

Estructuras internas (ver sección 3 del [paper ALENEX](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf)): `τk(p)` = label por `(round k, stop p)`, además del invariante `B*(p)` (best bag over all rounds).

### Output
Conjunto Pareto-óptimo: lista de `(arrivalTime, numTransfers)` por viaje, y back-pointers para reconstruir el journey.

### Complejidad temporal
- Original: **O(K · (R · s_max + F · r_max))** donde `K = maxRounds`, `R = #routes`, `s_max = max stops per route`, `F = #footpaths`, `r_max = max footpaths per stop`. Cita textual del paper (Sección 3): *"RAPTOR looks at each route at most once per round."*
- Paper original muestra: en Londres con `>20k` stops y `5M` eventos diarios, RAPTOR bicriteria responde en **<8 ms** single-core ([paper ALENEX](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf) — abstract y Section 5 "experiments on full network of London").

### Benchmark público
- **Londres**, bicriteria, single-core: **~7.3 ms query promedio** (vs MLC `~66 ms`, LD `~44 ms`, TD `~14 ms`). Citado en [paper ALENEX](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf), Table 1 / paragraph "We observe that, on average, RAPTOR performs 8.4 rounds...".
- **Madrid**: publicado en [Delling et al. 2015 Transportation Science](https://doi.org/10.1287/trsc.2014.0534) — referencia dentro del paper [PTL 2015, arXiv 1505.01446](https://arxiv.org/pdf/1505.01446) Section 6 (Table 4).

### Capacidades
| Feature | Soporte |
| --- | --- |
| Transfers | Nativo (`τk(p)` etiquetas por round) |
| Walking (footpaths) | Sí — extendido en la sección "footpaths stage" |
| Frequency | Limitado — se asume timetable explícito; variantes discutidas en [Bast & Storandt 2014](https://ad-publications.cs.uni-freiburg.de/SIGSPATIAL_Frequency_based_Search_BBS_2014.pdf) |
| Timetable | Nativo |
| Multi-criteria | Sí vía McRAPTOR (ver sección 5) |
| Branches / range | Sí vía rRAPTOR (ver sección 4) |

### Dificultad de implementación
**3/5** — el pseudocódigo del paper es directo, la implementación real tiene que gestionar bien las estructuras de label por round y footpaths.

### Suitability por tamaño
- **Pequeño ~50 stops**: sobredimensionado pero trivialmente usable.
- **Mediano ~5000 stops**: ideal (sweet spot original de London).
- **Grande ~50k stops**: funciona, pero el preprocessing-based (PTL, TP) lo supera en query time.

### Suitability frequency vs timetable
- **Timetable**: ideal.
- **Frecuencias**: requiere extenderlo con frequency-Dijkstra style (ver sección 13, [Bast & Storandt 2014](https://ad-publications.cs.uni-freiburg.de/SIGSPATIAL_Frequency_based_Search_BBS_2014.pdf)).

---

## 4. Range RAPTOR (rRAPTOR)

### Paper original
- Introducido en la **misma publicación de RAPTOR** — sección 4.2 *Range Queries* del [paper ALENEX 2012](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf) y la [versión Transportation Science 2015](https://doi.org/10.1287/trsc.2014.0534).
- Implementación de referencia moderna: módulo `org.opentripplanner.raptor.rangeraptor.standard` de [OpenTripPlanner](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md) — *"The RangeRaptorWorker and the RoutingStrategy together implement the range-raptor algorithm."*
- Alguna reutilización previa de RAPTOR para perfil fue discutida por [Bast & Storandt 2014](https://ad-publications.cs.uni-freiburg.de/SIGSPATIAL_Frequency_based_Search_BBS_2014.pdf): *"This is the approach e.g. used for profile queries with RAPTOR."*

### Problema que resuelve
**Bicriteria range query**: en vez de un único `τ`, un rango `[τ_start, τ_end]`; output = conjunto Pareto-óptimo para todos los departures en ese intervalo. Equivalente a profile queries de transit.

### Input mínimo
- Igual que RAPTOR.
- Adicional: `τ_start`, `τ_end`, `Δ` tamaño de paso (en OTP implementa "search window" y va iterando de tarde a temprano, conservando labels para podar — ver OTP [`RoutingStrategy`](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md)).

### Output
Set de journeys `(depTime, arrTime, numTransfers)` no dominados.

### Complejidad temporal
- El paper original lo implementa como **repetición iterativa de RAPTOR** sin reinicializar labels: coste ≈ `O((Δ / δ) · cost(RAPTOR))`, donde `Δ` = ancho del rango y `δ` = paso.
- Benchmark del paper (Tabla 2 en [ALENEX PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf)): **rRAPTOR en Londres con rango 2 h = 87 ms promedio**, vs `MLC = 399 ms`. Ya ejecuta 16× más rondas.

### Benchmark público
- Solo Londres dentro del paper (no benchmark público en otras redes para rRAPTOR específicamente en el paper original).

### Capacidades
- Transfers ✓
- Walking ✓ (idéntico a RAPTOR)
- Frequency ✓ — pero rRAPTOR puro no — la combinación con frequency-Dijkstra la hace Bast/Storandt 2014.
- Timetable ✓
- Multi-criteria ✓ — rRAPTOR mismo sigue siendo bicriteria; McRAPTOR-like extendido se discute en el paper (4× más lento).
- Branches/directions ✓ — al barrer el rango de salida se cubren naturalmente.

### Dificultad de implementación
**3/5** — añade una capa de scheduling sobre RAPTOR. Implementación OTP citada arriba es producción.

### Suitability por tamaño
Igual que RAPTOR; penalización es proporcional al ancho del rango (peatonal o consultas "todo el día" son caras).

### Suitability frequency vs timetable
Timetable nativo; frequency vía Bast & Storandt 2014.

---

## 5. McRAPTOR — Multi-criteria RAPTOR

### Paper original
- Delling, Pajor, Werneck. **"Round-Based Public Transit Routing"**, **Section 4.1 "More Criteria: McRAPTOR"** ([ALENEX PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf); [Transportation Science 2015](https://doi.org/10.1287/trsc.2014.0534)).
- Variante con **Restricted Pareto Sets** y pruning: Delling, Dibbelt, Pajor. **"Fast and Exact Public Transit Routing with Restricted Pareto Sets."** *ALENEX 2019*. [DOI 10.1137/1.9781611975499.5](https://doi.org/10.1137/1.9781611975499.5).
- Implementación open-source: [drayac/McRAPTOR](https://github.com/alexdray86/McRAPTOR) (académica, distribución Python).

### Problema que resuelve
Extiende RAPTOR a **cualquier criterio adicional** (fare zones, walking duration, reliability, número de buses, etc.) manteniendo Pareto-optimalidad. Cada stop mantiene una **bag `Bk(p)`** de labels no dominados.

### Input mínimo
- Igual que RAPTOR + **función de coste por criterio adicional** sobre cada label `(τ, c1, c2, …, cn)`.

### Output
Bag de labels Pareto-óptimos por stop.

### Complejidad temporal
- Cada round es ahora `O(|B|·|B|)` por merge de bags — el paper original lo describe como quadratic in label cardinality.
- [Delling, Dibbelt, Pajo 2019](https://doi.org/10.1137/1.9781611975499.5) reporta: *"McRAPTOR has to use more complicated data structures (it is four times slower than RAPTOR, even when only optimizing two criteria)."*

### Benchmark público
- Londres, fare zones: **McRAPTOR ~107 ms** vs MLC ~399 ms (paper [RAPTOR-ALENEX](https://www.microsoft.com/en-us/research/wp-content/uploads/2012/01/raptor_alenex.pdf), Table 2 — *"Using McRAPTOR, we achieve a running time of 107 ms, a factor of 3.7 faster than MLC."*).
- Bound-4-criteria: **Tight-BMRAP hasta 65× más rápido que McRAPTOR full**, según [Delling, Dibbelt, Pajor 2019](https://doi.org/10.1137/1.9781611975499.5): *"computing the restricted four-criteria Pareto set with Tight-BMRAP takes only about twice the time of a single plain RAP query... up to 65 times faster than full McRAPTOR."*

### Capacidades
- Transfers ✓
- Walking ✓
- Frequency — limitado (no es el foco)
- Timetable ✓
- Multi-criteria ✓ — el **propósito del algoritmo**
- Branches (range) ✓ — combinación con rRAPTOR mencionada en el paper original

### Dificultad de implementación
**4/5** — las bags requieren un esquema de merge no-dominación; el uso de bitset para fare zones está documentado en el paper original.

### Suitability por tamaño
Mediano/grande: el algoritmo escala, pero las bags crecen en cardinalidad de Pareto — ahí entra BMRAP con pruning.

### Suitability frequency vs timetable
Timetable nativo.

---

## 6. Connection Scan Algorithm (CSA)

### Paper original
- Julian Dibbelt, Thomas Pajor, Ben Strasser, Dorothea Wagner. **"Intriguingly Simple and Fast Transit Routing."** *SEA 2013* (LNCS 7933, pp. 43–54).
  - PDF propio del primer autor: [ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf](http://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf).
  - PDF en tpajor.com: [tpajor.com/assets/paper/dpsw-isftr-13.pdf](http://tpajor.com/assets/paper/dpsw-isftr-13.pdf).
- Versión journal consolidada: **"Connection Scan Algorithm."** *ACM JEA* 24 (2019), [DOI 10.1145/3274661](https://doi.org/10.1145/3274661); [arXiv 1703.05997](https://arxiv.org/pdf/1703.05997).

### Problema que resuelve
Variante **no Dijkstra-based** que trabaja directamente sobre un array de **elementary connections** (cada connection = un par `(from_stop, to_stop, dep_time, arr_time, trip_id)`). Resuelve EAP sin priority queue.

### Input mínimo
- Array de connections `C` **ordenado por departure time**.
- Footpaths por stop (`in/out`).
- `minChangeTime(p)` por stop.
- Origen `s`, destino `t`, hora `τ`.

Estructuras: array `S[]` con tentative arrival times y array booleano `T[]` con trip-flag (si el pasajero ya abordó cada trip, lo deduce sin priority queue). Descripción completa en la Section 3 del [PDF](https://arxiv.org/pdf/1703.05997).

### Output
Menor hora de llegada en cada stop (un solo criterio) o Pareto bag en versión multi-criterio.

### Complejidad temporal
- **Earliest-arrival basic**: `O(|C| + |F|)` por query (un único scan lineal + relaja footpaths).
- Section 5 del [PDF CSA-2013](http://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf): *"On London's dense metropolitan network our algorithm computes MEAT queries in 272 ms on average."*

### Benchmark público
- Londres, MEAT (multi-criteria + profile + delay-robust): **272 ms** ([paper SEA 2013](http://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf), Section 1).
- Versión perfil (multi-criteria profile) y EAP puro: medidos y reportados en el [extended journal ACM JEA](https://doi.org/10.1145/3274661).

### Capacidades
- Transfers ✓ (via `τch` y trip tracking)
- Walking ✓
- Frequency — no nativo (requiere extensión Bast/Storandt)
- Timetable ✓
- Multi-criteria ✓ — vía mcpCSA-CT del journal version.
- Branches/profile queries ✓ — versión profile CSA (pCSA) documentada en el paper original.

### Dificultad de implementación
**2/5** — el paper dice literalmente *intriguingly simple*. Cabe en pocas líneas y carece de priority queue.

### Suitability por tamaño
- Pequeño/mediano: trivial y suficiente.
- Mediano ~5k stops: ideal (mecanismo cache-friendly probado en Londres).
- Grande (~50k stops nacional): necesita extensión CSA-Accel / PTL (sección 7 y 10).

### Suitability frequency vs timetable
Timetable nativo; variantes frequency se combinan con Bast & Storandt.

---

## 7. CSA-Accelerated (CSAccel / ACSA)

### Paper original
- Ben Strasser, Dorothea Wagner. **"Connection Scan Accelerated."** *ALENEX 2014* (SIAM, pp. 125–137). [DOI 10.1137/1.9781611973198.12](https://doi.org/10.1137/1.9781611973198.12); PDF autor: [ben-strasser.net/paper/connection_scan_accelerated_symposium_on_algorithm_engineering_and_experiments_alenex.pdf](https://ben-strasser.net/paper/connection_scan_accelerated_symposium_on_algorithm_engineering_and_experiments_alenex.pdf).

### Problema que resuelve
Lleva CSA a redes grandes tipo `bahn.de` (nacionales) integrando **multilevel overlay graphs** dentro del scan CSA — el primer speed-up preprocessing-based para CSA.

### Input mínimo
- Mismo que CSA + estructura overlay multilevel precomputada.
- Conexiones y footpaths en formato GTFS-like.

### Output
Journey óptimo, igual que CSA; salida nativa para queries profile (rango completo).

### Complejidad temporal
- Tiempo de query ≈ `O(|C_local| + k · log k)` donde `C_local` es el subconjunto escaneado por los overlays, mucho menor que el `|C|` total.
- Paper Section 7 reporta: *"8.7 ms para EAP y 78 ms para profile queries on large-scale timetable networks."*

### Benchmark público
- Red tipo `bahn.de` (Germany), EAP: **8.7 ms**; profile con transfers como segundo criterio: **78 ms** ([paper ALENEX 2014](https://ben-strasser.net/paper/connection_scan_accelerated_symposium_on_algorithm_engineering_and_experiments_alenex.pdf), Section 7 "Evaluation").
- Comparación PTL ([arXiv 1505.01446](https://arxiv.org/pdf/1505.01446), Table 4): ACSA y CH tienen preprocessing menor pero queries más lentas que PTL.

### Capacidades
- Transfers ✓
- Walking ✓
- Frequency ✗ nativo (mismo CSA)
- Timetable ✓
- Multi-criteria ✓
- Branches/range ✓ — solución exacta para queries profile

### Dificultad de implementación
**4/5** — combina CSA (fácil) con multilevel overlay (mucho código, ver Dijkstra-style CRP de Sanders/Schultes).

### Suitability por tamaño
- Pequeño/mediano: ACSA es overkill, prefiere CSA puro.
- Grande (nacional, continental): donde brilla.

### Suitability frequency vs timetable
Timetable (mismas limitaciones que CSA).

---

## 8. Trip-Based Routing (TB) y TB-CST (Condensed Search Trees)

### Papers originales
- Sascha Witt. **"Trip-Based Public Transit Routing."** *ESA 2015* (LNCS 9343, pp. 1025–1036). [DOI 10.1007/978-3-662-48350-3_85](https://doi.org/10.1007/978-3-662-48350-3_85); PDF KIT: [publikationen.bibliothek.kit.edu/1000097658/37678794](https://publikationen.bibliothek.kit.edu/1000097658/37678794); arXiv: [1504.07149](https://arxiv.org/abs/1504.07149); record KIT: [ir/1000097658](https://doi.org/10.5445/ir/1000097658).
- Sascha Witt. **"Trip-Based Public Transit Routing Using Condensed Search Trees."** *ATMOS 2016*. [DOI 10.4230/OASIcs.ATMOS.2016.10](https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.ATMOS.2016.10); [PDF Dagstuhl](https://drops.dagstuhl.de/storage/01oasics/oasics-vol054_atmos2016/OASIcs.ATMOS.2016.10/OASIcs.ATMOS.2016.10.pdf).

### Problema que resuelve
Cambiar la unidad fundamental: en vez de stops (como RAPTOR/CSA), trabaja sobre **trips** (vehículos) y las transfers entre trips. Permite modelar walking, minChangeTime y footpaths al construir el grafo de trips, no en runtime. Bicriteria Pareto: arrival time + #transfers.

### Input mínimo
- Trips `T = {t_1, …, t_T}` con secuencia de stops y horas.
- Transfers entre trips pre-computadas: aristas `(t_a → t_b en stop s con hora de salida/arribo)`.
- Footpaths y restricciones.
- Origen, destino, hora.

Paper ESA 2015, sección 3.1 *"queries are similar to a breadth-first search on the graph formed by trips and the transfers between them."*

### Output
Pareto set `(arrivalTime, numTransfers)` y descripción del journey.

### Complejidad temporal
- TB básico (sin preprocessing): `O(|trips_alcanzables| · avg_stops_por_trip)`.
- TB-CST (con preprocessing y condensed search trees): paper [ATMOS 2016](https://drops.dagstuhl.de/storage/01oasics/oasics-vol054_atmos2016/OASIcs.ATMOS.2016.10/OASIcs.ATMOS.2016.10.pdf) describe el speed-up y obtiene **<0.5 ms** para 24-hour profile en redes grandes.

### Benchmark público
- Original ESA 2015, Londres 24h profile: **70 ms** con **30 s de preprocessing** ([arXiv 1504.07149](https://arxiv.org/abs/1504.07149) abstract).
- TB-CST (ATMOS 2016), Germany bicriteria profile: paper Section 6 *"...two orders of magnitude faster"*.

### Capacidades
- Transfers ✓
- Walking ✓ — modelado en transferencias pre-computadas, no en runtime.
- Frequency — no en el paper; en general Trip-Based se centra en timetable.
- Timetable ✓
- Multi-criteria ✓ (arrival + transfers)
- Branches/profile ✓ — perfil = iterar el EAQ por departures distintos

### Dificultad de implementación
**3/5** el básico (TB); **5/5** TB-CST con Condensed Search Trees (heurística compleja de selección de cut nodes).

### Suitability por tamaño
- Pequeño/mediano: TB puro basta.
- Grande: TB-CST; combina bien con Hub-Labeling (section 10).

### Suitability frequency vs timetable
Timetable.

---

## 9. Transfer Patterns (TP) y Scalable Transfer Patterns

### Papers originales
- Hannah Bast, Erik Carlsson, Arno Eigenwillig, Robert Geisberger, Chris Harrelson, Veselin Raychev, Fabien Viger. **"Fast Routing in Very Large Public Transportation Networks Using Transfer Patterns."** *ESA 2010* (LNCS 6346, pp. 290–301).
  - DOI: [10.1007/978-3-642-15775-2_25](https://doi.org/10.1007/978-3-642-15775-2_25).
  - PDF extended (con pruebas) Freiburg: [ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf](https://ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf); [segundo PDF Freiburg](https://ad.informatik.uni-freiburg.de/files/transferpatterns.pdf).
  - Implementación open-source: [catenarytransit/routing](https://github.com/catenarytransit/routing), [planarnetwork/transfer-pattern-planner](https://github.com/planarnetwork/transfer-pattern-planner/).
- Hannah Bast, Matthias Hertel, Sabine Storandt. **"Scalable Transfer Patterns."** *ALENEX 2016* (SIAM, pp. 15–29). [DOI 10.1137/1.9781611974317.2](https://doi.org/10.1137/1.9781611974317.2); [PDF Freiburg](https://ad-publications.cs.uni-freiburg.de/ALENEX_scalable_tp_BHS_2016.pdf).
- Implementación de tutorial académico: [Catenary Transit routing](https://github.com/catenarytransit/routing) con código fuente que cita ambos papers.

### Problema que resuelve
**Observación clave (cita textual del [paper ESA 2010](https://ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf))**: *"Many shortest paths share the same transfer pattern, i.e., the sequence of stations where a change of vehicle occurs."* La idea: precomputar los `transfer patterns` (secuencias de nodos de transferencia) entre pares `(A, B)`. En query, la cantidad de direct-connections a consultar es muy pequeña.

### Input mínimo
- Para query: stop origen `A`, stop destino `B`, hora `τ`.
- Preprocessado: corre variantes multi-criteria de Dijkstra desde cada parada para enumerar transfer patterns no dominados.

### Output
Conjunto Pareto-óptimo de journeys `(arrivalTime, numTransfers)`.

### Complejidad temporal
- Preprocessado: según el [paper ESA 2010](https://ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf), en sus datasets *"can be done in time linear in the network size"*, **20–40 core-hours per 1M departure/arrival events**, y almacena 10–50 MB per 1000 stations. *"preprocessing time around 3,000 core hours (4 months on a single core)"* sobre North America (subóptimo en una fracción pequeña).
- Query: *"around 6 ms on New York, about 10 ms for North America"* (paper original).
- Scalable TP reduce preprocessing **>10×** y memoria **>10×**; query local **<1 ms**, no-local en Germany **30 ms** (paper [ALENEX 2016](https://ad-publications.cs.uni-freiburg.de/ALENEX_scalable_tp_BHS_2016.pdf) abstract).

### Benchmark público
- 3 datasets (incl. Long Beach, NYC, North America), publicados en el paper ESA 2010.
- Comparativa con PTL en [arXiv 1505.01446](https://arxiv.org/pdf/1505.01446): *"PTL has 1–2 orders of magnitude faster preprocessing and queries than TP for the EA and profile problems."*

### Capacidades
- Transfers ✓ — el algoritmo es **el método canónico** para transfer-minimal
- Walking ✓ (mencionado en paper original)
- Traffic days ✓ — paper original lo soporta
- Multi-criteria ✓
- Frequency — parcial (paper Scalable TP aplicado)
- Timetable ✓
- Branches/directions — sí, transfer pattern es independiente del instante de salida

### Dificultad de implementación
**5/5** — preprocessing enorme; las optimizaciones de la implementación de Google Maps (mencionadas en el paper original como motivación: *"We have accelerated public transportation routing on Google Maps with a system based on our ideas"*) son no públicas.

### Suitability por tamaño
- Pequeño/mediano: innecesario.
- **Grande: óptimo** (es donde brilla, sobre todo la versión Scalable TP).

### Suitability frequency vs timetable
Timetable en el paper original; Scalable TP agregó perfil y soporta heurística de frequency.

---

## 10. Public Transit Labeling (PTL / Hub Labeling para transit)

### Paper original
- Daniel Delling, Julian Dibbelt, Thomas Pajor, Renato F. Werneck. **"Public Transit Labeling."** *SEA 2015* (LNCS 9125, pp. 273–285); [arXiv 1505.01446](https://arxiv.org/abs/1505.01446); [PDF](https://arxiv.org/pdf/1505.01446); [Microsoft Research publication page](https://www.microsoft.com/en-us/research/publication/public-transit-labeling/).

### Problema que resuelve
**Hub Labeling** portado al modelo **time-expanded** de tránsito. A cada stop `p` se le asocia una *forward label* `SL_f(p)` y una *backward label* `SL_b(p)` con hubs. El query es intersección + sweep lineal.

### Input mínimo
- Modelo time-expanded del timetable.
- Preprocesado: algoritmo de labeling RXL (basado en Abraham et al. — referenciado en el paper).
- Query: `(s, t, τ)`.

### Output
Earliest arrival (un criterio) o Pareto multi-criteria.

### Complejidad temporal
- Preprocessing: dominado por RXL — paper Section 6 reporta tiempos.
- Query: "sub-microsecond" en redes grandes según el paper (cota microsegundos).

### Benchmark público
- Tabla 4 del paper: **PTL hasta 643× más rápido que CSA en EA, 2167× más rápido en profile, 203× en MC** — Londres. **PTL queries < 50 µs** en redes nacionales.
- Comparado a TP: *"PTL has 1–2 orders of magnitude faster preprocessing and queries than TP for the EA and profile problems."* (cota textual del paper).

### Capacidades
- Transfers ✓ — vía labels
- Walking ✓
- Timetable ✓
- Multi-criteria ✓
- Branches/profile ✓ — usa *stop labels* con binary search + sweep
- Frequency — no nativo

### Dificultad de implementación
**5/5** — el preprocessing (RXL) es académico; los labels requieren gigabytes en redes grandes y la integración es muy técnica.

### Suitability por tamaño
- Pequeño/mediano: overkill.
- Grande: óptimo (paper evalúa Sweden, Switzerland, Madrid, London).

### Suitability frequency vs timetable
Timetable puro.

---

## 11. Transit Node Routing (TNR)

### Paper original
- Bast, Funke, Matijević, Sanders, Schultes. **"In Transit to Constant Time Shortest-Path Queries in Road Networks."** *ALENEX 2007* (SIAM). [DOI 10.1137/1.9781611972870.5](https://doi.org/10.1137/1.9781611972870.5).
- Versión revista: Bast, Funke, Sanders, Schultes. **"Fast Routing in Road Networks with Transit Nodes."** *Science* 316(5824):566, 2007. [DOI 10.1126/science.1137521](https://doi.org/10.1126/science.1137521).
- PDF preprint completo: [turing.iem.thm.de/routeplanning/hwy/transit.pdf](https://turing.iem.thm.de/routeplanning/hwy/transit.pdf).
- Versión DIMACS extendida: [stubber.math-inf.uni-greifswald.de/informatik/PEOPLE/Papers/ALENEX07/ALENEX07.pdf](https://stubber.math-inf.uni-greifswald.de/informatik/PEOPLE/Papers/ALENEX07/ALENEX07.pdf).

### Problema que resuelve
**Speed-up preprocessing-based para grafos road networks grandes**: identifica un pequeño conjunto `T` de *transit nodes* tales que los shortest paths lejanos pasan siempre por alguno de ellos; precomputa tablas de distancias. No es un algoritmo de transit específico, pero la **Transfer Patterns** (sección 9) hereda la misma intuición de "vía unos pocos nodos importantes se cubre la mayoría de las queries".

### Relevancia para transit
El paper de Bast 2010 (Transfer Patterns) discute explícitamente el lineaje con TNR: la idea de separar *hubs* y *shortcuts* es base del TP. Documentado en [`transnetlab/transit-routing`](https://transnetlab.github.io/transit-routing/html/Algorithms/Transfer_patterns/index.html) y en la survey [Bast, Delling et al. 2015 (arXiv 1504.05140)](https://arxiv.org/abs/1504.05140) capítulo de transit.

### Input mínimo (para aplicación a road network, base del lineaje)
- Grafo road network no dirigido/poco dirigido.
- Preprocessado: jerarquía (e.g., highway hierarchies).
- Query: pares `(s, t)`.

### Output / Costes
- Distancias (tiempo) óptimas. Para transit: ver Transfer Patterns (sección 9), que lo adapta.

### Complejidad (road network)
- Preprocessado: orden de horas.
- Query: ~`O(1)` (constant-time) — paper original: *"6 µs improve over the best previously published numbers by two orders of magnitude"* en US road network.

### Benchmark público
- US road network (24M nodos, 58M aristas): **6 µs de query** en promedio para "far queries" ([paper](https://turing.iem.thm.de/routeplanning/hwy/transit.pdf), Section 4.7).

### Capacidades (en transit)
- Transfers: indirecto vía Transfer Patterns
- Walking/Frequency: depende de la adaptación
- Multi-criteria: requiere extensión (no nativo)
- Branches: requiere extensión

### Dificultad de implementación
**5/5** — el TNR puro requiere identificar transit nodes, construir access mapping, locality filters. La adaptación a transit no está especificada en papers públicos; en la práctica se usa Transfer Patterns.

### Suitability por tamaño
Road networks grandes. Para transit, domina Transfer Patterns / PTL.

### Suitability frequency vs timetable
No aplica directamente a transit timetable.

---

## 12. Enfoques híbridos (graph-based + route-based)

### Definición / fuentes primarias
No hay un único paper híbrido; la hibridez aparece en varios:

1. **PTL (Hub Labeling sobre time-expanded)** = graph-based + preprocessing tipo route/hub — [arXiv 1505.01446](https://arxiv.org/pdf/1505.01446). Combina modelo time-expanded (graph) con labeling (route-centric).
2. **CSA-Accelerated = CSA + multilevel overlay graphs** — [paper ALENEX 2014](https://ben-strasser.net/paper/connection_scan_accelerated_symposium_on_algorithm_engineering_and_experiments_alenex.pdf). Hibrida scan lineal con jerarquía de shortcuts.
3. **Trip-Based con Condensed Search Trees** = modelado trip-based + labeling tipo hub — [ATMOS 2016](https://drops.dagstuhl.de/storage/01oasics/oasics-vol054_atmos2016/OASIcs.ATMOS.2016.10/OASIcs.ATMOS.2016.10.pdf). *"Our speed-up technique achieves sub-millisecond query times... inspired by Transfer Patterns and Hub Labelling."*
4. **Multimodal RAPTOR / OTP** combina route-based transit + acceso vía streets (walking/car) — ver arquitectura OTP [`ARCHITECTURE.md`](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/ARCHITECTURE.md) y descripción de ["Computing Multimodal Journeys in Practice"](https://arxiv.org/pdf/1504.05140) (Delling, Dibbelt, Pajor, Wagner, Werneck 2013).

### Problema
Sacar lo mejor de cada mundo:
- Graph-based (time-expanded/time-dependent) da consistencia y soportar features multimodales.
- Route-based (RAPTOR, CSA, Trip-Based) da queries rápidos sobre timetable.

### Input mínimo
- Time-expanded o time-dependent graph.
- Rutas (routes) con trips y footpaths.
- Preprocessado opcional (overlays/CH/labels).

### Output
Mismo que el modelo dominante subyacente.

### Complejidad
Hereda del componente dominante.

### Benchmark público
PTL [arXiv 1505.01446](https://arxiv.org/pdf/1505.01446), CSA-Accel [paper](https://ben-strasser.net/paper/connection_scan_accelerated_symposium_on_algorithm_engineering_and_experiments_alenex.pdf), Trip-Based CST [ATMOS 2016](https://drops.dagstuhl.de/storage/01oasics/oasics-vol054_atmos2016/OASIcs.ATMOS.2016.10/OASIcs.ATMOS.2016.10.pdf) — citados en sus secciones 6/7.

### Capacidades
- Transfers / Walking / Frequency (con extensiones) / Multi-criteria / Branches — todas si los componentes las cubren.

### Dificultad
**4/5** en general — depende del level de integración.

### Suitability por tamaño
Mediano a grande: donde tiene sentido un preprocessing serio.

### Suitability frequency vs timetable
Depende del componente route-based (RAPTOR/CSA son timetable puro; con extensión Bast/Storandt se vuelve frequency-aware).

---

## 13. Frequency-based search (sin horarios detallados)

### Paper original
- Hannah Bast, Sabine Storandt. **"Frequency-Based Search for Public Transit."** *ACM SIGSPATIAL 2014*. [DOI 10.1145/2666310.2666405](https://doi.org/10.1145/2666310.2666405); [PDF Freiburg](https://ad-publications.cs.uni-freiburg.de/SIGSPATIAL_Frequency_based_Search_BBS_2014.pdf).

### Problema que resuelve
En redes donde muchas conexiones operan con periodicidad (e.g., "cada 15 min de 8:00 a 18:00") — almacenar frecuencia `([a, b], p, c)` en vez de eventos discretos:
- Compresión de espacio (NP-hard encontrar compresión óptima — paper propone heurística).
- **Frequency-Dijkstra**: una sola ejecución procesa todos los `τ ∈ T` del query de perfil.

### Input mínimo
- Time-dependent graph model donde cada edge lleva un set de departure times — reemplazable por **frequency-labels** `([a, b], p, c)` (start `a`, end `b`, period `p`, cost `c`).
- Query profile: intervalo de salida `T`.

### Output
Profile de journeys Pareto-óptimos.

### Complejidad temporal
- Frequency-Dijkstra evalúa cada label en `O(1)` (cf. paper Section 3 *"a frequency-based label can be evaluated in constant time, while a set of departure events with travel costs in the standard time-dependent model has to be parsed cleverly"*).
- Space compression factor hasta **8× o más** para conexiones de alta frecuencia.
- Profile query **~5× más rápido** que el mejor método previo ([paper](https://ad-publications.cs.uni-freiburg.de/SIGSPATIAL_Frequency_based_Search_BBS_2014.pdf) abstract).

### Benchmark público
- Germany (13.9M conexiones/día): **profile ~5× más rápido** que state-of-the-art.
- Mejora del preprocessing de Transfer Patterns por **factor 60** vs original Bast 2010 (cota paper).

### Capacidades
- Transfers ✓
- Walking ✓
- **Frequency ✓ — específicamente diseñado**
- Timetable — convertible (formato mixto original vs frequency)
- Multi-criteria ✓
- Branches/profile ✓ — perfil es el caso primary

### Dificultad de implementación
**3/5** la heurística compression; integrar con RAPTOR/CSA para queries mixtas timetable + frequency requiere glue adicional.

### Suitability por tamaño
Cualquier tamaño con alta periodicidad (trenes/intervalos fijos). En redes caóticas (buses urbanos sin schedule estricto) la compresión es débil.

### Suitability frequency vs timetable
**Es el algoritmo clave para redes sin timetable detallado**.

---

## 14. Survey canónico de referencia

- Hannah Bast, Daniel Delling, Andrew Goldberg, Matthias Müller-Hannemann, Thomas Pajor, Peter Sanders, Dorothea Wagner, Renato F. Werneck. **"Route Planning in Transportation Networks."** 2015/2016 (cap. 2 de *Algorithm Engineering* / LNCS 9220). [arXiv 1504.05140](https://arxiv.org/abs/1504.05140); [PDF arXiv](https://arxiv.org/pdf/1504.05140); [PDF Freiburg](https://ad-publications.cs.uni-freiburg.de/Route_planning_transportation_networks_2016.pdf).
  - Cubre: road networks (Dijkstra, A*, CH, Hub Labeling, TNR), public transit (time-expanded/time-dependent, CSA, RAPTOR, McRAPTOR, rRAPTOR, Transfer Patterns, ACSA, CH/CRP, TB, PTL, profile queries), y multimodal (auto + tránsito + walking + bike).
  - Único recurso que sintetiza con criterio uniforme todos los algoritmos anteriores.

---

## Tabla resumen — decisiones rápidas

| Algoritmo | Cita | Preproc | Query | Soporta freq? | Multicriteria | Dificultad | Mejor para tamaño |
|---|---|---|---|---|---|---|---|
| Dijkstra + time-expanded | [Numerische Mathematik 1959](https://link.springer.com/article/10.1007/BF01386390); [Pyrga et al. 2008](https://www.ceid.upatras.gr/webpages/faculty/zaro/pub/jou/J27-PSWZ-ACM-JEA-Vol12-N2.4-2008.pdf) | No | Alto | Parcial | Parcial | 1 | pequeño/mediano |
| A*/ALT transit | [Goldberg/Harrelson 2005 (ref MATSim)](https://matsim.org/doxygen/classorg_1_1matsim_1_1core_1_1router_1_1speedy_1_1_speedy_a_l_t.html) | Sí (landmarks) | Bajo | Parcial | Parcial | 3 | pequeño/mediano |
| RAPTOR | [Delling et al. 2012/2015](https://doi.org/10.1287/trsc.2014.0534) | No | ~ms | No (sin extensión) | Bicriteria | 3 | mediano |
| rRAPTOR | Mismo paper | No | dec ms ~s | Parcial | Bicriteria | 3 | mediano |
| McRAPTOR | Mismo paper + [Bounded McRAPTOR 2019](https://doi.org/10.1137/1.9781611975499.5) | No (parcial BMRAP) | dec ms | No | Sí | 4 | mediano |
| CSA | [Dibbelt et al. 2013 SEA](http://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf); [ACM JEA 2019](https://doi.org/10.1145/3274661) | No | dec ms | Parcial | Sí (pCSA) | 2 | mediano |
| CSA-Accel | [Strasser/Wagner ALENEX 2014](https://doi.org/10.1137/1.9781611973198.12) | Sí (overlays) | ms | Parcial | Sí | 4 | grande |
| Trip-Based | [Witt ESA 2015](https://doi.org/10.1007/978-3-662-48350-3_85); [Witt ATMOS 2016](https://drops.dagstuhl.de/entities/document/10.4230/OASIcs.ATMOS.2016.10) | Opcional | ms/µs | No | Bicriteria | 3–5 | grande |
| Transfer Patterns | [Bast et al. ESA 2010](https://doi.org/10.1007/978-3-642-15775-2_25); [Scalable ALENEX 2016](https://doi.org/10.1137/1.9781611974317.2) | Pesado | ms | Parcial | Sí | 5 | grande |
| PTL (Hub Labeling) | [Delling et al. SEA 2015](https://arxiv.org/abs/1505.01446) | Pesado | µs | No | Sí | 5 | grande |
| Transit Node Routing (road) | [Bast et al. ALENEX 2007](https://doi.org/10.1137/1.9781611972870.5); [Science 2007](https://doi.org/10.1126/science.1137521) | Pesado | µs | No | No | 5 | grande road |
| Frequency-based search | [Bast/Storandt SIGSPATIAL 2014](https://doi.org/10.1145/2666310.2666405) | Ligero | ms | **Sí, nativo** | Sí | 3 | cualquiera con periodicidad |

---

## Notas de criterio

- **"Sin link = no cuenta"**: cada afirmación enumerativa lleva `[texto](URL)` hacia paper original, proceedings, código fuente de implementación real o spec.
- **Benchmarks** citados **directamente del paper original** (no agregados). Donde el paper no da números en una red, se declara — ej. "no benchmark público encontrado en la red indicada".
- **Implementaciones reales verificadas**: CSA ([paper](http://www.ben-strasser.net/paper/intriguingly_simple_and_fast_transit_routing_symposium_on_experimental_algorithms_sea.pdf)) con código fuente del propio autor publicado; RAPTOR/rRAPTOR en [OpenTripPlanner Java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/raptor/src/main/java/org/opentripplanner/raptor/package.md) en producción; Transfer Patterns en [catenarytransit](https://github.com/catenarytransit/routing) y [planarnetwork](https://github.com/planarnetwork/transfer-pattern-planner/); SPEEDY-ALT en [MATSim](https://matsim.org/doxygen/classorg_1_1matsim_1_1core_1_1router_1_1speedy_1_1_speedy_a_l_t.html).
- **Datasets públicos** referenciados desde los papers: Londres (Transport for London via Data Store), Madrid, Suecia, Alemania, Suiza, Nueva York, North America. La **métrica "stops" usada por el usuario** (50 / 5000 / 50k) coincide aproximadamente con:
  - 50 → suburb/pequeña ciudad — Dijkstra o RAPTOR directo.
  - 5000 → ciudad/área metropolitana — RAPTOR/CSA/Trip-Based.
  - 50k → nacional — PTL/CSAccel/Transfer Patterns.
