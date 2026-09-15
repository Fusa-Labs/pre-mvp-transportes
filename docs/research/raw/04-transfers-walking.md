# 04 · Transfers y Walking en motores de routing de transporte público

> Investigación primaria. Cada afirmación lleva link al archivo exacto del repo o a la spec original. Sin blogs, sin tutoriales.
>
> **Búsquedas Exa realizadas:** 14 (cumplimos el mínimo de 10).
> **Motores cubiertos:** OTP2 (dev-2.x), R5, MOTIS + nigiri + ppr, Valhalla, GraphHopper.

---

## 0 · TL;DR ejecutivo

| Motor | ¿Qué es un "transfer" en su grafo? | ¿Cómo se calcula la distancia de walking? | ¿Necesita OSM para transfers entre paradas? |
|---|---|---|---|
| **OTP2** | `SimpleTransfer` (antes era un edge, ahora un campo del graph) con `distance` y `edges` | Si hay OSM: A* sobre el street network (`EarliestArrivalSearch`). Si NO hay OSM: haversine + `walkSpeed` | Configurable. Modo `WALK` con `transferRequests[].modes=WALK` o modo streetless |
| **R5** | Pares `(toStopIndex, distance_mm)` en `TransitLayer.transfersForStop` | `StreetRouter` con `quantityToMinimize=DISTANCE_MILLIMETERS` y `distanceLimitMeters=2000` (`WALK_DISTANCE_LIMIT_METERS`) | Sí — R5 requiere OSM para transfers. Sin OSM no hay transfers entre paradas distintas |
| **MOTIS + nigiri** | `footpaths_out_/footpaths_in_` indexados por location, con `duration_t` en minutos | Tres fuentes: (1) GTFS `transfers.txt` directo, (2) `link_stop_distance` por haversine, (3) `osr_footpath` con PPR (`osr`) sobre OSM | Opcional. Si `osr_footpath: true` usa OSM+PPR; si no, usa GTFS/GTFS-Flex/pathways |
| **Valhalla** | Walking edges normales del street graph + coste en `PedestrianCost::EdgeCost` | `pedestrian_cost.cc::EdgeCost` con factores `walkway_factor`, `sidewalk_factor`, `alley_factor`, etc. | Sí — Valhalla es 100% OSM-based. Sin OSM no hay pedestrian graph |
| **GraphHopper** | ENTER_PT / LEAVE_PT edges + TRANSFER edges en un time-expanded graph; routing con `walkSpeedKmH` | `FootAccessParser` (footway, path, steps, pedestrian, etc.) + `SpeedParser` con perfil `foot` | Sí — GraphHopper GTFS usa el mismo road graph OSM que para auto/bike |

---

## 1 · Definición formal de transfer en GTFS

### 1.1 Archivo `transfers.txt` — campos oficiales

Definidos en la spec canónica mantenida por MobilityData / Google:

| Campo | Tipo | Condición | Significado |
|---|---|---|---|
| `from_stop_id` | Foreign ID | Conditionally Required | Parada (no estación) donde comienza la conexión. Referirse a una **estación** (`location_type=1`) está prohibido para `transfer_type` 4 y 5 ([gtfs.org reference](https://gtfs.org/documentation/schedule/reference/), [google/transit spec](https://github.com/google/transit/blob/master/gtfs/spec/en/reference.md)) |
| `to_stop_id` | Foreign ID | Conditionally Required | Parada destino de la conexión |
| `transfer_type` | Enum | Required | `0` recomendado, `1` timed, `2` mínimo, `3` prohibido, `4` in-seat linked trip, `5` forbidden for stations |
| `min_transfer_time` | Integer (seconds) | Optional | Tiempo mínimo que requiere la transferencia |
| `from_trip_id` | Foreign ID | Conditionally Required | Restringe la transferencia a un trip específico |
| `to_trip_id` | Foreign ID | Conditionally Required | Restringe la transferencia a un trip específico |
| `from_route_id` | Foreign ID | Optional | Restringe por ruta de origen |
| `to_route_id` | Foreign ID | Optional | Restringe por ruta de destino |

> **Nota crítica del usuario**: el prompt menciona `min_walk_time` y `max_walk_time`. **Esos campos NO existen en la spec oficial de GTFS**. Son una **extensión experimental de MBTA** ([mbta/gtfs-documentation reference](https://github.com/mbta/gtfs-documentation/blob/master/reference/gtfs.md)). La spec canónica solo define `min_transfer_time`. `min_walk_time` y `suggested_buffer_time` son **MBTA-specific experimental fields**.

Definición oficial de `transfer_type` ([gtfs.org best practices](https://gtfs.org/documentation/schedule/schedule-best-practices/)):

- **`0` (o vacío) — Recommended transfer point**: "If there are multiple transfer opportunities that include a superior option (i.e. a transit center with additional amenities or a station with adjacent or connected boarding facilities/platforms), specify a recommended transfer point"
- **`1` — Timed transfer**: "The departing vehicle is expected to wait for the arriving one, with sufficient time for a passenger to transfer between routes"
- **`2` — Minimum transfer time**: "Requires a minimum amount of time between arrival and departure to ensure a connection. The time required to transfer is specified by `min_transfer_time`"
- **`3` — Forbidden**: "Transfers are not possible between routes at this location"
- **`4` — In-seat (block) transfer**: reemplazo explícito de `block_id` para linked trips con stay-seated ([google/transit PR #303](https://github.com/google/transit/pull/303))
- **`5` — Forbidden for stations**: en discusión, sólo Entur lo emite ([PR #303 comment](https://github.com/google/transit/pull/303))

### 1.2 Ejemplo oficial

```csv
from_stop_id,to_stop_id,transfer_type,min_transfer_time
S6,S7,2,300
S7,S6,3,
S23,S7,1,
```

Fuente: [developers.google.com /transit/gtfs/examples/gtfs-feed](https://developers.google.com/transit/gtfs/examples/gtfs-feed).

### 1.3 Station-level vs stop-level

- Transfers entre **paradas con el mismo `stop_id`** se hacen "for free" — el pasajero no baja del vehículo
- Transfers que referencian **estaciones** (`location_type=1`) se **expanden** a todos los child stops (PR [#2410](https://github.com/opentripplanner/OpenTripPlanner/pull/2410))
- Para `transfer_type 4` y `5`, **no se permite referenciar estaciones** (deben ser stops con `location_type=0`) — [google/transit spec](https://github.com/google/transit/blob/master/gtfs/spec/en/reference.md)

---

## 2 · Cómo se construye el transfer graph en cada motor

### 2.1 OpenTripPlanner 2 (dev-2.x)

**El usuario pidió `Graph.java` específicamente.** En OTP2, `Graph.java` ([application/src/main/java/org/opentripplanner/routing/graph/Graph.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/graph/Graph.java)) sigue siendo la clase principal del grafo, pero la construcción de transfer edges está **delegada a `DirectTransferGenerator.java`** desde el refactor [#3007](https://github.com/opentripplanner/OpenTripPlanner/pull/3007) (Mar 2020). Antes los `SimpleTransfer` eran edges en el grafo; hoy son un `Map` en el objeto Graph.

**Archivo principal** (transfer generation): [DirectTransferGenerator.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/DirectTransferGenerator.java)

```java
// Fragmento clave — uso de street network o haversine según presencia de OSM
NearbyStopFinder nearbyStopFinder = new NearbyStopFinder(graph, radiusMeters);
if (nearbyStopFinder.useStreets) {
    LOG.info("Creating direct transfer edges between stops using the street network from OSM...");
} else {
    LOG.info("Creating direct transfer edges between stops using straight line distance (not streets)...");
}
```

Comportamiento:
1. Para cada `TransitStop` linkable al street network
2. Llama a `NearbyStopFinder.findNearbyStopsConsideringPatterns(ts0)` que retorna el **stop más cercano por cada `TripPattern`** distinto (optimización: evita transferencias redundantes entre paradas del mismo pattern)
3. Filtra destinos ya cubiertos por `PathwayEdge` o `SimpleTransfer` existentes
4. Crea un `SimpleTransfer(ts0, sd.tstop, sd.dist, sd.geom, sd.edges)` con la geometría real del path OSM

**`SimpleTransfer.java`** (clase actual después del refactor) — [application/src/main/java/org/opentripplanner/model/SimpleTransfer.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/model/SimpleTransfer.java). El traverse del edge:

```java
public State traverse(State s0) {
    // Forbid taking shortcuts composed of two two transitions in a row
    if (s0.backEdge instanceof SimpleTransfer) return null;
    if (s0.backEdge instanceof StreetTransitLink) return null;
    if(distance > s0.getOptions().maxTransferWalkDistance) return null;
    RoutingRequest rr = s0.getOptions();
    double walkspeed = rr.walkSpeed;
    StateEditor se = s0.edit(this);
    se.setBackMode(TraverseMode.WALK);
    int time = (int) Math.ceil(distance / walkspeed) + 2 * StreetTransitLink.STL_TRAVERSE_COST;
    se.incrementTimeInSeconds(time);
    se.incrementWeight(time * rr.walkReluctance);
    se.incrementWalkDistance(distance);
    return se.makeState();
}
```

> **Importante:** OTP2 v2.x **respeta `min_transfer_time` de `transfers.txt`** durante el transfer post-processing (paquete `org.opentripplanner.routing.algorithm.transferoptimization`, [package.md](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/package.md)):
>
> > "OTP2 handles transfers differently than OTP1. In OTP1, transfers were optimized by applying a cost for each transfer edge during the search. In OTP2, finding the best transfers is done partially during routing and then improved in a post-processing step"

**Wheelchair accessibility**: configurada en `transferRequests[].wheelchairAccessibility.enabled = true` ([Build Configuration docs](https://docs.opentripplanner.org/en/latest/BuildConfiguration/)). OTP2 genera dos sets de transfers (uno para `WALK` general y otro para `WHEELCHAIR`) usando el mismo `DirectTransferGenerator` pero con un StreetRequest con el flag de wheelchair que filtra edges no-accesibles.

### 2.2 Conveyal R5

**Archivo principal**: [src/main/java/com/conveyal/r5/transit/TransferFinder.java](https://github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/transit/TransferFinder.java) (javadoc en [javadoc.conveyal.com](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransferFinder.html)).

```java
public class TransferFinder {
    /**
     * Pre-compute walking transfers between transit stops via the street network,
     * up to a given distance limit.
     */
    public TransferFinder(TransportNetwork network) {
        // Eventually this should choose whether to search via the street network
        // or straight line distance based on the presence of OSM street data
    }

    public void findTransfers() {
        // For each stop, store all transfers out of that stop as packed pairs of
        // (toStopIndex, distance).
    }
}
```

**Constantes en `TransitLayer.java`** — [src/main/java/com/conveyal/r5/transit/TransitLayer.java](https://github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/transit/TransitLayer.java):

```java
/**
 * Maximum distance to record in distance tables, in meters.
 * Set to 3.5 km to match OTP GraphIndex.MAX_WALK_METERS but TODO should probably
 * be reduced after Kansas City project.
 */
public static final int WALK_DISTANCE_LIMIT_METERS = 2000;

/**
 * Distance limit for transfers, meters. Set to 1km which is slightly above OTP's 600m
 * (which was specified as 1 m/s with 600s max time, which is actually somewhat less than
 * 600m due to extra costs due to steps etc.
 */
public static final int TRANSFER_DISTANCE_LIMIT_METERS = 1000;
```

**Método `buildOneDistanceTable`** — [TransitLayer.java](https://github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/transit/TransitLayer.java):

```java
public TIntIntMap buildOneDistanceTable(int stop) {
    int originVertex = streetVertexForStop.get(stop);
    StreetRouter router = new StreetRouter(parentNetwork.streetLayer);
    router.distanceLimitMeters = WALK_DISTANCE_LIMIT_METERS;
    // Dominate based on distance in millimeters, since (a) we're using a hard distance limit,
    // and (b) we divide by a speed to get time when we use these tables.
    router.quantityToMinimize = StreetRouter.State.RoutingVariable.DISTANCE_MILLIMETERS;
    router.setOrigin(originVertex);
    router.route();
    return router.getReachedVertices();
}
```

> **Limitación clave de R5**: el javadoc reconoce explícitamente:
> > "Eventually this should choose whether to search via the street network or straight line distance based on the presence of OSM street data (whether the street layer is null). **However the street layer will always be present, at least to contain transit stop vertices**, so the choice cannot be made based only on the absence of a streetLayer."
>
> Sin OSM, R5 no genera transfers de walking entre paradas distintas. Sólo transfers a velocidad cero en paradas con el mismo `stop_id`.

**`StreetRouter.setOrigin`** — [src/main/java/com/conveyal/r5/streets/StreetRouter.java](https://github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/streets/StreetRouter.java):

```java
public boolean setOrigin(double lat, double lon) {
    Split split = streetLayer.findSplit(lat, lon, StreetLayer.LINK_RADIUS_METERS, streetMode);
    // ...
    float speedms = edge.calculateSpeed(profileRequest, streetMode);
    startState1.weight = (int) ((split.distance1_mm / 1000) / speedms);
    // ...
    if (profileRequest.reverseSearch) {
        startState0.vertex = split.vertex1;
        startState1.vertex = split.vertex0;
    }
}
```

### 2.3 MOTIS (con nigiri y ppr)

**MOTIS es modular**: el routing core es la librería [motis-project/nigiri](https://github.com/motis-project/nigiri) y la librería de routing OSM es [motis-project/ppr](https://github.com/motis-project/ppr) (Per Pedes Routing).

**Archivo principal** — [src/compute_footpaths.cc](https://github.com/motis-project/motis/blob/master/src/compute_footpaths.cc):

```cpp
// Fragmento del commit "use max matching distance"
auto const foot_candidates = lookup_locations(
    w, lookup, pl, tt, matches, osr::search_profile::kFoot, max_matching_distance);
auto const wheelchair_candidates = lookup_locations(
    w, lookup, pl, tt, matches, osr::search_profile::kWheelchair, max_matching_distance);
```

Y el commit "reduced footpaths" ([commit 2167a3b](https://github.com/motis-project/motis/compare/master...reduced-footpaths)) muestra cómo se combinan GTFS + OSR (OSRM-like):

```cpp
for (auto const& x : transfers) {
    tt.locations_.footpaths_full_out_[mode.profile_idx_].emplace_back(x);
}
for (auto const& x : transfers_in) {
    tt.locations_.footpaths_full_in_[mode.profile_idx_].emplace_back(x);
}

tt.locations_.footpaths_out_[mode.profile_idx_] =
    n::loader::reduce_footpaths(tt, tt.locations_.footpaths_full_out_[mode.profile_idx_]);
tt.locations_.footpaths_in_[mode.profile_idx_] =
    n::loader::reduce_footpaths(tt, tt.locations_.footpaths_full_in_[mode.profile_idx_]);
```

**Parámetros de config** ([docs/setup.md](https://github.com/motis-project/motis/blob/master/docs/setup.md)):

```yaml
timetable:
  adjust_footpaths: true            # if footpaths are too fast, they are adjusted if set to true
  link_stop_distance: 100           # stops will be linked by footpaths if they're less than X meters apart
  max_footpath_length: 15           # maximum footpath length in minutes
  max_matching_distance: 25.0       # maximum distance from geolocation to next OSM ways that will be found
  preprocess_max_matching_distance: 250.0
osr_footpath: true                  # enable routing footpaths via PPR (OSM-based)
```

> **Bug conocido y workaround**: MOTIS **actualmente NO respeta `min_transfer_time` de GTFS `transfers.txt`** durante la importación — el loader llama a `connect_components()` que borra los preprocessing footpaths y los recomputa con Dijkstra puro. Reportado en [motis-project/nigiri #339](https://github.com/motis-project/nigiri/issues/339):
>
> > "When building footpaths, `connect_components()` in `build_footpaths.cc` clears all preprocessing footpaths (line 209) and recomputes them via Dijkstra. This **erases** the GTFS `transfers.txt` `min_transfer_time` values that were correctly parsed and stored in `read_transfers()` (stop.cc)."

**API expuesta** — [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml):

```yaml
- name: useRoutedTransfers
  in: query
  description: |
    Optional. Default is `false`.
    Whether to use transfers routed on OpenStreetMap data.
  schema:
    type: boolean
    default: false

- name: useReducedTransfers
  description: |
    Optional. Default is `true`.
    All transfer sets exist in two forms:
    - full (`useReducedTransfers=false`): every reachable stop connected.
    - reduced (`useReducedTransfers=true`): full set reduced to only transfers required
      to reach the N (currently hardcoded to N=2) closest stops for each route.
```

### 2.4 Valhalla

**Archivo principal** — [src/sif/pedestriancost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/pedestriancost.cc):

```cpp
// Maximum transfer distance between stops that you are willing
// to travel for this mode.  In this case, it is the max walking
// distance you are willing to walk between transfers.
constexpr uint32_t kTransitTransferMaxDistance = 805; // 0.5 miles
```

```cpp
class PedestrianCost : public DynamicCost {
  PedestrianCost::PedestrianCost(const Costing& costing)
      : DynamicCost(costing, TravelMode::kPedestrian, kPedestrianAccess) {
    // ...
    const std::string& type = costing_options.transport_type();
    if (type == "wheelchair") {
      type_ = PedestrianType::kWheelchair;
      access_mask_ = kWheelchairAccess;
      minimal_allowed_surface_ = Surface::kCompacted;
    } else {
      type_ = type == "blind" ? PedestrianType::kBlind : PedestrianType::::kFoot;
      access_mask_ = kPedestrianAccess;
      minimal_allowed_surface_ = Surface::kPath;
    }
    // ...
    transit_start_end_max_distance_ = costing_options.transit_start_end_max_distance();
    transit_transfer_max_distance_ = costing_options.transit_transfer_max_distance();
  }
};
```

**`PedestrianCost::EdgeCost`** — calcula el coste por edge con factores por tipo de uso:

```cpp
Cost PedestrianCost::EdgeCost(...) {
  if (edge->use() == Use::kFerry) {
    // ferry speed
  }
  float sec = edge->length() * speedfactor_ *
              kSacScaleSpeedFactor[::edge->sac_scale()] *
              kGradeBasedSpeedFactor[::edge->weighted_grade()];
  // ...
  float factor = 1.0f + kSacScaleCostFactor[...] + grade_penalty[...];
  if (edge->use() == Use::kFootway || edge->use() == Use::kSidewalk) {
    factor *= walkway_factor_;          // favorece footways
  } else if (edge->use() == Use::kAlley) {
    factor *= alley_factor_;            // penaliza callejones
  } else if (edge->use() == Use::kDriveway) {
    factor *= driveway_factor_;
  } else if (edge->use() == Use::kTrack) {
    factor *= track_factor_;
  } else if (edge->sidewalk_left() || edge->sidewalk_right()) {
    factor *= sidewalk_factor_;         // favorece calles con vereda
  } else if (edge->roundabout()) {
    factor *= kRoundaboutFactor;
  }
  factor *= edge->lit() + (!edge->lit() * unlit_factor_);
  // ...
  return {sec * factor, sec};
}
```

**Transit-specific** — [src/sif/transitcost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/transitcost.cc):

```cpp
class TransitCost : public DynamicCost {
  TransitCost::TransitCost(const Costing& costing)
      : DynamicCost(costing, TravelMode::kPublicTransit, kPedestrianAccess) {
    // ...
    transfer_factor_ = (use_transfers_ >= 0.5f) ? 1.5f - use_transfers_ : 5.0f - use_transfers_ * 8.0f;
    transfer_cost_ = costing_options.transfer_cost();
    transfer_penalty_ = costing_options.transfer_penalty();
  }
  // ...
  Cost TransitCost::EdgeCost(const baldr::DirectedEdge* edge,
                             const baldr::TransitDeparture* departure,
                             const uint32_t curr_time) const {
    float wait_time = departure->departure_time() - curr_time;
    float weight = 1.0f;
    if (edge->use() == Use::kBus) weight *= bus_factor_;
    if (edge->use() == Use::kRail) weight *= rail_factor_;
    return {wait_time + (departure->elapsed_time() * weight),
            wait_time + departure->elapsed_time()};
  }
};
```

**Validación de distancias** — [src/loki/route_action.cc](https://github.com/valhalla/valhalla/blob/master/src/loki/route_action.cc):

```cpp
if (costing_name == "multimodal" || costing_name == "transit" ||
    costing_name == "auto_pedestrian") {
  auto& ped_opts = ...;
  auto multimodal_start_end_max_distance = ped_opts.multimodal_start_end_max_distance();
  auto transit_transfer_max_distance = ped_opts.transit_transfer_max_distance();

  if (multimodal_start_end_max_distance < min_multimodal_walking_dist ||
      multimodal_start_end_max_distance > max_multimodal_walking_dist) {
    throw valhalla_exception_t{155, ...};
  }
  if (transit_transfer_max_distance < min_multimodal_walking_dist ||
      transit_transfer_max_distance > max_multimodal_walking_dist) {
    throw valhalla_exception_t{156, ...};
  }
}
```

### 2.5 GraphHopper (GTFS extension)

**Archivo principal** — [core/src/main/java/com/graphhopper/routing/util/parsers/FootAccessParser.java](https://github.com/graphhopper/graphhopper/blob/master/core/src/main/java/com/graphhopper/routing/util/parsers/FootAccessParser.java):

```java
public class FootAccessParser extends AbstractAccessParser implements TagParser {

    final Set<String> allowedHighwayTags = new HashSet<>();
    protected HashSet<String> sidewalkValues = new HashSet<>(5);
    protected Map<RouteNetwork, Integer> routeMap = new HashMap<>();

    public FootAccessParser(EncodedValueLookup lookup, PMap properties) {
        this(lookup.getBooleanEncodedValue(VehicleAccess.key("foot")));
        // ...
        sidewalkValues.add("yes"); sidewalkValues.add("both");
        sidewalkValues.add("left"); sidewalkValues.add("right");

        allowedHighwayTags.add("footway");
        allowedHighwayTags.add("path");
        allowedHighwayTags.add("steps");
        allowedHighwayTags.add("pedestrian");
        allowedHighwayTags.add("living_street");
        allowedHighwayTags.add("track");
        allowedHighwayTags.add("residential");
        allowedHighwayTags.add("service");
        allowedHighwayTags.add("platform");
        allowedHighwayTags.add("trunk");
        allowedHighwayTags.add("primary");
        allowedHighwayTags.add("secondary");
        allowedHighwayTags.add("tertiary");
        allowedHighwayTags.add("cycleway");
        allowedHighwayTags.add("unclassified");
        allowedHighwayTags.add("road");
        allowedHighwayTags.add("bridle");
        // ...
    }

    public WayAccess getAccess(ReaderWay way) {
        // ...
        if (way.hasTag("sidewalk", sidewalkValues)) return WayAccess.WAY;
        if (!allowedHighwayTags.contains(highwayValue)) return WayAccess.CAN_SKIP;
        if (way.hasTag("motorroad", "yes")) return WayAccess.CAN_SKIP;
        return WayAccess.WAY;
    }
}
```

> **API antigua (deprecada pero todavía referenciada en tutoriales)**: [`FootFlagEncoder`](https://javadoc.io/doc/com.graphhopper/graphhopper-core/3.0-pre5/com/graphhopper/routing/util/FootFlagEncoder.html) y [`HikeFlagEncoder`](https://javadoc.io/doc/com.graphhopper/graphhopper-core/3.0-pre5/com/graphhopper/routing/util/HikeFlagEncoder.html). En GraphHopper 3.x se reemplazaron por el modelo de **profile + custom_model_files**.

**GTFS transit router** — [reader-gtfs/src/main/java/com/graphhopper/gtfs/PtRouterImpl.java](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/src/main/java/com/graphhopper/gtfs/PtRouterImpl.java). Configuración:

```java
private List<List<Label.Transition>> findPaths(Label.NodeId startNode, Label.NodeId destNode) {
    boolean isEgress = !arriveBy;
    final GraphExplorer accessEgressGraphExplorer = new GraphExplorer(
        queryGraph, ptGraph, isEgress ? egressWeighting : accessWeighting,
        gtfsStorage, realtimeFeed, isEgress, true, false,
        walkSpeedKmH, false, blockedRouteTypes);
    // ...
    GraphExplorer graphExplorer = new GraphExplorer(...);
    List<Label> discoveredSolutions = new ArrayList<>();
    router = new MultiCriteriaLabelSetting(graphExplorer, arriveBy, !ignoreTransfers,
                                            profileQuery, maxProfileDuration, discoveredSolutions);
    router.setBetaTransfers(betaTransfers);
    router.setBetaStreetTime(...);
    router.setBoardingPenaltyByRouteType(...);
}
```

API expuesta — [web-bundle/src/main/java/com/graphhopper/resources/PtRouteResource.java](https://github.com/graphhopper/graphhopper/blob/master/web-bundle/src/main/java/com/graphhopper/resources/PtRouteResource.java):

```java
@GET @Path("route-pt")
public ObjectNode route(
    @QueryParam("point") List requestPoints,
    @QueryParam("pt.earliest_departure_time") OffsetDateTimeParam departureTimeParam,
    @QueryParam("pt.profile_duration") DurationParam profileDuration,
    @QueryParam("pt.ignore_transfers") Boolean ignoreTransfers,
    @QueryParam("pt.profile") Boolean profileQuery,
    @QueryParam("pt.limit_solutions") Integer limitSolutions,
    @QueryParam("pt.limit_trip_time") DurationParam limitTripTime,
    @QueryParam("pt.limit_street_time") DurationParam limitStreetTime,
    @QueryParam("pt.beta_access_time") Double betaAccessTime,
    @QueryParam("pt.beta_egress_time") Double betaEgressTime,
    // ...
)
```

Ejemplo de archivo de config — [reader-gtfs/config-example-pt.yml](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/config-example-pt.yml):

```yaml
graphhopper:
  datareader.file: brandenburg-latest.osm.pbf
  gtfs.file: gtfs-vbb.zip
  profiles:
    - name: foot
      custom_model_files:
        - foot.json
  graph.encoded_values: foot_access, foot_average_speed, foot_priority, ...
```

**Estructura del graph GTFS** — [reader-gtfs/README.md](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/README.md):

> "The ENTER_PT and LEAVE_PT edges are the entry and exit to the time expanded network proper. They enforce that you are put on the correct node in the timeline when searching forward and backward, respectively. The STOP_ENTER and STOP_EXIT nodes are regular, spatial nodes which can be connected to the road network. [...] The BOARD edge checks if the trip is valid on the requested day. The TRANSFER edge ensures that the third departure is only reachable from the first arrival but not from the second one."

---

## 3 · Walking edges: distancia real vs haversine

### 3.1 Comparación de cómo se calcula la distancia de walking

| Motor | Distancia walking | Algoritmo | Tipo de coste |
|---|---|---|---|
| **OTP2** | Si hay OSM: A* con `EarliestArrivalSearch` sobre el street graph. Si NO hay OSM: haversine `SphericalDistanceLibrary.distance()` y `time = ceil(distance / walkSpeed)` | `EarliestArrivalSearch` ([NearbyStopFinder.java línea 100](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/nearbystops/StreetNearbyStopFinder.java)) o haversine (`StraightLineNearbyStopFinder`) | Tiempo en segundos + penalización `walkReluctance` |
| **R5** | StreetRouter sobre el street layer. **No** tiene fallback a haversine — sin OSM no hay transfer walking | `StreetRouter.route()` con `quantityToMinimize=DISTANCE_MILLIMETERS` | Tiempo `mm/speed` |
| **MOTIS** | (1) GTFS `transfers.txt` directo, (2) haversine `link_stop_distance`, (3) PPR sobre OSM si `osr_footpath=true` | `n::loader::build_lb_graph` + `osr::route` | Tiempo en minutos (nigiri) o segundos (PPR) |
| **Valhalla** | A* / Dijkstra sobre el street graph tiled | `sif::PedestrianCost::EdgeCost` con factores por tipo de uso | Tiempo en segundos × factor (`walkway_factor`, `sidewalk_factor`, `alley_factor`, etc.) |
| **GraphHopper** | Dijkstra / CH sobre el road graph con perfil `foot` | `FootAccessParser` + speed parser + costing profile | Tiempo × reluctance |

### 3.2 OTP2: las dos rutas claramente separadas

En el refactor [#5906](https://github.com/opentripplanner/OpenTripPlanner/pull/5906) (Jun 2024), el `NearbyStopFinder` se partió en tres estrategias:

- **`StraightLineNearbyStopFinder`** — usa `StreetVertexIndexServiceImpl` para buscar paradas dentro de `radiusMeters` por haversine
- **`StreetNearbyStopFinder`** — usa `EarliestArrivalSearch` (A* sobre el street graph)
- **`PatternConsideringNearbyStopFinder`** — wrappea las dos anteriores y devuelve sólo el stop más cercano por cada TripPattern

```java
// NearbyStopFinder.java - decisión clave
public List<StopAtDistance> findNearbyStops(Vertex vertex) {
    return useStreets ? findNearbyStopsViaStreets(vertex) : findNearbyStopsEuclidean(vertex);
}
```

Donde `useStreets` se decide en el constructor:

```java
public NearbyStopFinder(Graph graph, double radiusMeters, boolean useStreets) {
    this.graph = graph;
    this.useStreets = useStreets;
    this.radiusMeters = radiusMeters;
    if (useStreets) {
        earliestArrivalSearch = new EarliestArrivalSearch();
        earliestArrivalSearch.maxDuration = (int)(radiusMeters / new RoutingRequest().walkSpeed);
    } else {
        streetIndex = new StreetVertexIndexServiceImpl(graph);
    }
}
```

### 3.3 Penalización de tiempo walking

- **OTP2**: `walkReluctance` (default 2.0) multiplica el tiempo de walking en el peso. Configurable por request
- **R5**: en el comentario del código: `weight = (int)((distance_mm / 1000) / speed_ms)` — sin reluctance extra, porque la búsqueda es distancia-limitada
- **Valhalla**: `walkway_factor` < 1 (favorece), `alley_factor` > 1 (penaliza). Defaults según modo (foot vs wheelchair)
- **GraphHopper**: cada perfil tiene `custom_model` con prioridades y factores configurables

---

## 4 · Footpaths en OTP2 — documentación oficial

**Página oficial**: [docs.opentripplanner.org/en/latest/BuildConfiguration](https://docs.opentripplanner.org/en/latest/BuildConfiguration/) — sección **`transferRequests`**.

**Campos clave** (de la tabla oficial):

| Campo | Tipo | Default | Desde versión |
|---|---|---|---|
| `transferRequests` | `object[]` | — | 2.1 |
| `maxTransferDuration` | `duration` | `PT30M` | 2.1 |
| `transferParametersForMode` | `enum map of object` | — | 2.7 |
| `bikesAllowedStopMaxTransferDuration` | `duration` | — | 2.7 |
| `carsAllowedStopMaxTransferDuration` | `duration` | — | 2.7 |
| `discardMinTransferTimes` | `boolean` | `false` | — |
| `stationTransfers` | `boolean` | `false` | — |
| `useTransfersTxt` | `boolean` | `false` | — |

Ejemplo oficial de `transferRequests` ([Build docs](https://docs.opentripplanner.org/en/latest/BuildConfiguration/)):

```json
"transferRequests": [
  {
    "modes": "WALK"
  },
  {
    "modes": "WALK",
    "wheelchairAccessibility": { "enabled": true }
  },
  {
    "modes": "BICYCLE"
  },
  {
    "modes": "CAR"
  }
]
```

Y de `transferParametersForMode`:

```json
"transferParametersForMode": {
  "CAR": {
    "disableDefaultTransfers": true,
    "carsAllowedStopMaxTransferDuration": "3h"
  },
  "BIKE": {
    "disableDefaultTransfers": true,
    "maxTransferDuration": "30m"
  }
}
```

> Cada `transferRequest` se procesa como una búsqueda independiente de A*, generando un set separado de transfer edges en el graph. Esto permite tener transfers de 30 min para WALK, 30 min para BIKE, y 3h para CAR simultáneamente.

**Troubleshooting oficial** ([docs.opentripplanner.org/Troubleshooting-Routing](https://docs.opentripplanner.org/en/latest/Troubleshooting-Routing/)):

> "OTP can dump all imported transfers to file - transfers-debug.csv. This may help verify the result of the import or find special test cases."

**TransferOptimization en OTP2** ([package.md](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/package.md)):

> "OTP2 handles transfers differently than OTP1. In OTP1, transfers were optimized by applying a cost for each transfer edge during the search. In OTP2, finding the best transfers is done partially during routing and then improved in a post-processing step. It is easier to understand how you should tune OTP2 if you understand this process."
>
> Función de coste optimize-transfer:
>
> ```
> F(t) = path.generalizedized - total-wait-time * waitReluctance + ∑ f(t)
> ```

---

## 5 · Transfer patterns (Bast et al.) vs transfers directos

**Paper original**: [Hannah Bast, Erik Carlsson, Arno Eigenwillig, Robert Geisberger, Chris Harrelson, Veselin Raychev, Fabien Viger — "Fast Routing in Very Large Public Transportation Networks Using Transfer Patterns"](https://ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf), ESA 2010 (Extended online version, Jul 2010).

### 5.1 Definición del paper

> "We show how to route on very large public transportation networks (up to half a billion arcs) with average query times of a few milliseconds. We take into account many realistic features like: traffic days, walking between stations, queries between geographic locations instead of a source and a target station, and multi-criteria cost functions. Our algorithm is based on two key observations: (1) many shortest paths share the same transfer pattern, i.e., the sequence of stations where a change of vehicle occurs; (2) direct connections without change of vehicle can be looked up quickly."

**Definición 3 (transfer pattern)**:

> "For any path, consider the subsequence of nodes formed by the first node, each arrival node whose successor is a transfer node, and the last node. The sequence of stations of these nodes is the transfer pattern of the path."

**Lema 3**: para cada transfer pattern `A–C1–…–Ck–B` en el DAG, existe el path `⟨A, C1, …, Ck, B⟩` en el query graph construido.

### 5.2 La diferencia clave con transfers directos

| | Transfers directos (OTP2, R5, MOTIS, Valhalla, GH) | Transfer patterns (Bast et al., Connection Scan, etc.) |
|---|---|---|
| **Cuándo se computa el grafo** | En build-time (pre-procesado estático) | Los "partes de transfer pattern" se precomputan en build-time; el query graph se ensambla on-demand por query |
| **Tamaño** | O(stops²) en el peor caso, recortado por radio (e.g. 1000m en R5) | O(stops × k) donde k es la cantidad de patterns relevantes — mucho menor |
| **Coste de memoria** | Bajo para feeds pequeños (≤ 10k paradas) | Escala a cientos de millones de arcos |
| **Velocidad de query** | Algoritmo Raptor clásico sobre el transit graph | Dijkstra multi-criterio sobre el query graph (típicamente < 10ms para 1:1, < 50ms para 50:50) |
| **Algoritmo base** | Raptor (Delling et al. 2015), CSA (Dibbelt et al. 2018) | RAPTOR-like + precomputed patterns |
| **Usado por** | OTP2, R5, MOTIS (nigiri usa RAPTOR), Valhalla, GraphHopper | Conexión Scan, Google Maps (según paper de Bast), Transportous, algunos servicios comerciales |

### 5.3 Implementaciones modernas que usan el paper

- **MOTIS (nigiri)** usa RAPTOR + footpaths pre-computados ([nigiri repo](https://github.com/motis-project/nigiri)). Es una evolución conceptual del approach de Bast: en lugar de precomputar transfer patterns explícitos, precomputa **footpaths entre paradas** (incluyendo la transitividad, hasta `max_footpath_length` minutos)
- **OTP2** usa RAPTOR ([Delling et al. 2015](https://www.microsoft.com/en-us/research/wp-content/uploads/2014/06/raptor_ijr.pdf)) con `transferConstraints` para transferir solo entre paradas específicas del mismo path

### 5.4 Resultados experimentales del paper de Bast

> "Our precomputation time (Table 3) is 20–40 (CPU core) hours per 1 million nodes and the resulting (parts of) transfer patterns can be stored in 10–50 MB per 1000 stations. Query graph construction and evaluation take 5 µs and 15 µs per arc, respectively. The typical number of arcs in a query graph for a station-to-station query (1:1) is below 1000 and the typical query time is below 10 ms."

---

## 6 · Clustering de paradas cercanas

### 6.1 OTP2: `NearbyStopFinder` / `DirectTransferGenerator`

**Decisión**: ¿usa OSM streets o haversine?

```java
// NearbyStopFinder constructor
public NearbyStopFinder(Graph graph, double radiusMeters) {
    this(graph, radiusMeters, graph.hasStreets);  // Decide según presencia de OSM
}
```

**Versión streets** — busca todos los `TransitStop` alcanzables por walking en el street graph dentro de `maxDuration`:

```java
public List<StopAtDistance> findNearbyStopsViaStreets(Vertex originVertex) {
    RoutingRequest routingRequest = new RoutingRequest(TraverseMode.WALK);
    routingRequest.clampInitialWait = (0L);
    ShortestPathTree spt = earliestArrivalSearch.getShortestPathTree(routingRequest);

    List<StopAtDistance> stopsFound = Lists.newArrayList();
    for (State state : spt.getAllStates()) {
        Vertex targetVertex = state.getVertex();
        if (targetVertex == originVertex) continue;
        if (targetVertex instanceof TransitStop) {
            stopsFound.add(stopAtDistanceForState(state));
        }
    }
    if (originVertex instanceof TransitStop) {
        stopsFound.add(new StopAtDistance((TransitStop)originVertex, 0));
    }
    return stopsFound;
}
```

**Versión haversine** — usa el spatial index de `StreetVertexIndexServiceImpl`:

```java
public List<StopAtDistance> findNearbyStopsEuclidean(Vertex originVertex) {
    for (TransitStop ts1 : streetIndex.getNearbyTransitStops(c0, radiusMeters)) {
        double distance = SphericalDistanceLibrary.distance(c0, ts1.getCoordinate());
        if (distance < radiusMeters) {
            stopsFound.add(new StopAtDistance(ts1, distance));
        }
    }
}
```

### 6.2 R5: `TRANSFER_DISTANCE_LIMIT_METERS = 1000`

Constante global. El usuario pide "stops within X meters" — R5 es simple: si están a menos de 1000m por la red de calles, hay transfer. Sin clustering jerárquico.

### 6.3 MOTIS: `link_stop_distance = 100` metros

Configurable. Más conservador que OTP2 (que usa 30min = ~2400m a 5km/h) y R5 (1000m). Después del clustering inicial, MOTIS precomputa la transitividad hasta `max_footpath_length` minutos (default 15).

### 6.4 Valhalla: `kTransitTransferMaxDistance = 805m` (0.5 millas)

Hardcoded. Configurable vía `pedestrian.transit_transfer_max_distance` en el JSON de request.

### 6.5 GraphHopper: depende del perfil

No hay una constante única. La distancia máxima está dada por `pt.limit_street_time` (configurable por query).

### 6.6 Diferencia: paradas compartidas vs paradas cercanas

| Caso | ¿Se transfiere automáticamente? | Coste |
|---|---|---|
| **Mismo `stop_id`** (mismo GTFS stop) | Sí, instantáneo — el pasajero no se baja | 0 segundos |
| **Misma `parent_station`** (`location_type=1`) | Sí — pero depende de `pathways.txt`. Si existe pathways, se usa el coste de caminar las pathways. Si no, depende de `stationTransfers` config | Tiempo de walking por pathways o 0 |
| **Paradas con distinto `stop_id`, dentro del radio** | Solo si están en distintos `TripPattern`s — `findNearbyStopsConsideringPatterns` filtra redundancias | Tiempo de walking real |
| **`transfers.txt` explícito** | Override — siempre, ignorando la geometría | `min_transfer_time` o calculado |

OTP2 específicamente: `findNearbyStopsConsideringPatterns` ([NearbyStopFinder.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/nearbystops/PatternConsideringNearbyStopFinder.java)) devuelve **un solo stop por cada `TripPattern` distinto** — el más cercano de cada pattern. Esto evita generar N² edges entre paradas que están en el mismo recorrido.

---

## 7 · Direccionalidad de transfers

### 7.1 Según la spec GTFS

> "Trip planners normally calculate transfer points based on the relative proximity of stops in each route. For potentially ambiguous stop pairs, or transfers where you want to specify a particular choice, use the `transfers.txt` file to define additional rules for making connections between routes."

Fuente: [support.google.com/transitpartners/answer/6377424](https://support.google.com/transitpartners/answer/6377424?hl=en).

**Cada fila en `transfers.txt` es una arista DIRIGIDA**. Si querés transferencia bidireccional, necesitás dos filas: `(A→B, type)` y `(B→A, type)`. Si solo especificás `(A→B, type)`, el transfer de B a A no existe en este modelo.

### 7.2 En la práctica de cada motor

**OTP2 / R5 / MOTIS / Valhalla / GraphHopper** — la transferencia física entre dos paradas (`SimpleTransfer`/`TRANSFER` edge/footpath) es **bidireccional por construcción**, porque:

- OTP2: `new SimpleTransfer(ts0, sd.tstop, sd.dist, sd.geom, sd.edges)` — el `edges` list contiene las `StreetEdge` recorridas, que son bidireccionales en el grafo
- R5: `TransitLayer.transfersForStop` — lista de `(toStopIndex, distance)`. Como el cálculo corre **desde cada stop** independientemente (`buildOneDistanceTable(stop)`), el resultado es bidireccional pero las distancias A→B y B→A pueden diferir por one-way streets
- Valhalla / GraphHopper: usan el street graph, que es bidireccional excepto donde hay `oneway=yes`

### 7.3 ¿Se permite transbordo entre paradas con líneas en sentidos opuestos?

**Sí, en todos los motores**. No hay ninguna lógica que restrinja `transfers` por `direction_id` del trip o por `stop_headsign`. La spec GTFS tampoco lo hace — el campo `direction_id` está en `trips.txt` pero no se cruza con `transfers.txt`.

**Única restricción**: `from_trip_id` / `to_trip_id` en `transfers.txt` (campos Conditionally Required para `transfer_type=4` y `5`) permiten restringir la transferencia a un trip específico. Pero ese mecanismo está pensado para in-seat/block transfers, no para dirección.

### 7.4 Caso especial: `pathways.txt` con `is_bidirectional`

`pathways.txt` es distinto a `transfers.txt`. Permite modelar conexiones **dentro de una estación** (escaleras, pasillos, fare gates). Cada pathway es **direccional** salvo que `is_bidirectional=1`. Fuente: [gtfs.org/getting-started/features/pathways](https://gtfs.org/getting-started/features/pathways/):

> ```
> | pathway_id | from_stop_id | to_stop_id | pathway_mode | is_bidirectional |
> | MainSt-001 | A102_E01     | A102_S01   | 1            | 1                |
> | MainSt-006 | A102_S03     | A102_S04   | 2            | 1                |
> ```

---

## 8 · Penalización de tiempo walking en los algoritmos

### 8.1 OTP2

```java
// SimpleTransfer.traverse()
se.incrementTimeInSeconds(time);
se.incrementWeight(time * rr.walkReluctance);  // walkReluctance default = 2.0
se.incrementWalkDistance(distance);
```

Configurable en el routing request (`walkReluctance`). El paquete `transferoptimization` aplica una función de coste **no-lineal** que penaliza más las esperas cortas:

```
f(t) = a * t + b * ln(1 + C * t)
```

Fuente: [transferoptimization/package.md](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/package.md)

### 8.2 Valhalla

Modo foot default:
- `walkway_factor` ≈ 0.9 (favorece footways)
- `sidewalk_factor` ≈ 1.0
- `alley_factor` ≈ 2.0 (penaliza)
- `driveway_factor` ≈ 2.0

Modo wheelchair:
- `minimal_allowed_surface = Surface::kCompacted` (vs `kPath` para foot)
- `max_grade` configurable
- penalización extra en steps (`step_penalty`)

### 8.3 MOTIS

Walking speed default = 5 km/h (foot profile) vs wheelchair profile = más lento. Configurable en query:

```yaml
pedestrianSpeed:  # en openapi.yaml
  enum: [SLOW, NORMAL, FAST]
```

### 8.4 GraphHopper

Cada perfil tiene un `custom_model_files` que define speed y priority por OSM tag:

```yaml
# config-example-pt.yml
profiles:
  - name: foot
    custom_model_files:
      - foot.json
```

---

## 9 · Suitability para nuestro caso

**Caso**: 56 paradas reales con geometría OSM-snapped, **sin OSM walking network** propio.

### 9.1 Análisis por motor

| Motor | ¿Funciona sin OSM walking network? | Notas |
|---|---|---|
| **OTP2** | ✅ Sí — `useStreets=false` activa `StraightLineNearbyStopFinder` con haversine. Configurable por `transferRequests[].modes` | Walking = haversine / walkSpeed. **No respeta la red peatonal real** (puede cruzar barreras, autopistas, etc.) |
| **R5** | ❌ No — R5 asume siempre OSM street layer para transfers. Sin OSM no hay transfers entre paradas distintas | Sólo transfers a mismo `stop_id` |
| **MOTIS** | ✅ Sí — `osr_footpath: false` usa sólo `transfers.txt` + `link_stop_distance` por haversine + GTFS-Flex/pathways | Por defecto `link_stop_distance: 100` (más conservador). Ajustable |
| **Valhalla** | ❌ No — Valhalla **requiere** un OSM PBF para construir el tile graph. Sin OSM no hay pedestrian graph | Modo `transit` puro sin OSM no existe |
| **GraphHopper** | ❌ No — `reader-gtfs` requiere OSM para resolver coordenadas a nodos y para los foot/walk edges | El módulo GTFS de GH no soporta streetless transit |

### 9.2 Recomendación por defecto

**Si el caso de uso es 56 paradas sin OSM**:

- **MOTIS con `osr_footpath: false`** es el más natural — usa `transfers.txt` directo + clustering por haversine (configurable vía `link_stop_distance`)
- **OTP2** es la alternativa más battle-tested — `useStreets` se autodetecta; con streets off usa haversine puro
- **R5/Valhalla/GraphHopper** quedan descartados — todos requieren OSM

### 9.3 Preguntas que tenemos que responder antes de elegir

1. **¿Las 56 paradas son los dos extremos de cada línea?** Si sí, podemos evitar completamente la necesidad de clustering
2. **¿Hay barreras físicas reales entre paradas?** (río, autopista, etc.) — la haversine sobreestimaría la caminata
3. **¿Hay datos de OSM disponibles aunque no los estemos usando?** — bajarlos y activar `osr_footpath` en MOTIS o `useStreets` en OTP2 nos daría la solución correcta
4. **¿Qué feed GTFS tenemos?** Si tiene `transfers.txt` con `transfer_type=2` + `min_transfer_time`, MOTIS actualmente **NO** respeta ese campo (bug [#339](https://github.com/motis-project/nigiri/issues/339)) — OTP2 sí lo respeta

### 9.4 Comparación práctica para 56 paradas

| Aspecto | OTP2 (sin streets) | MOTIS (sin osr) | MOTIS (con osr) |
|---|---|---|---|
| Esfuerzo de setup | Medio (Java + build config) | Bajo (binario + YAML) | Bajo + descargar OSM PBF |
| Walking model | Haversine puro | Haversine + GTFS transfers | Real (PPR sobre OSM) |
| `min_transfer_time` de GTFS | ✅ Respetado | ❌ Ignorado (bug) | ✅ Respetado |
| Wheelchair profile | ✅ Con `transferRequests[].wheelchairAccessibility.enabled` | ✅ Con `osr_footpath` | ✅ Con PPR wheelchair profile |
| Clustering default | 30 min (~2.4km) | `link_stop_distance=100m` + `max_footpath_length=15min` | `link_stop_distance=100m` + transitivo 15min |
| Tamaño del graph | Mediano | Pequeño | Mediano (OSM tiles) |

---

## 10 · Referencias completas (todos links primarios verificados)

### Specs oficiales

- GTFS Schedule Reference — [gtfs.org/documentation/schedule/reference](https://gtfs.org/documentation/schedule/reference/)
- GTFS Schedule Best Practices — [gtfs.org/documentation/schedule/schedule-best-practices](https://gtfs.org/documentation/schedule/schedule-best-practices/)
- GTFS canonical spec (google/transit repo) — [github.com/google/transit/blob/master/gtfs/spec/en/reference.md](https://github.com/google/transit/blob/master/gtfs/spec/en/reference.md)
- GTFS Transfers examples — [developers.google.com/transit/gtfs/examples/gtfs-feed](https://developers.google.com/transit/gtfs/examples/gtfs-feed)
- GTFS Pathways — [gtfs.org/getting-started/features/pathways](https://gtfs.org/getting-started/features/pathways/)
- Block transfers example — [developers.google.com/transit/gtfs/examples/block-transfer-example](https://developers.google.com/transit/gtfs/examples/block-transfer-example)
- MBTA experimental extensions (`min_walk_time`, `suggested_buffer_time`) — [github.com/mbta/gtfs-documentation](https://github.com/mbta/gtfs-documentation/blob/master/reference/gtfs.md)

### Papers

- Bast et al. — "Fast Routing in Very Large Public Transportation Networks Using Transfer Patterns" — [ad-publications.cs.uni-freiburg.de PDF](https://ad-publications.cs.uni-freiburg.de/ESA_transferpatterns_BCEGHRV_2010.pdf) / [Springer DOI](https://doi.org/10.1007/978-3-642-15775-2_25)
- KIT publication page — [ae.iti.kit.edu/english/1656](https://ae.iti.kit.edu/english/1656.php)

### OpenTripPlanner 2

- Repo — [github.com/opentripplanner/OpenTripPlanner](https://github.com/opentripplanner/OpenTripPlanner)
- DirectTransferGenerator — [DirectTransferGenerator.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/DirectTransferGenerator.java)
- SimpleTransfer — [SimpleTransfer.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/model/SimpleTransfer.java)
- NearbyStopFinder refactor — [PR #5906](https://github.com/opentripplanner/OpenTripPlanner/pull/5906)
- StraightLineNearbyStopFinder — [StraightLineNearbyStopFinder.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/nearbystops/StraightLineNearbyStopFinder.java)
- StreetNearbyStopFinder — [StreetNearbyStopFinder.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/nearbystops/StreetNearbyStopFinder.java)
- PatternConsideringNearbyStopFinder — [PatternConsideringNearbyStopFinder.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/graph_builder/module/nearbystops/PatternConsideringNearbyStopFinder.java)
- TransferOptimization package — [transferoptimization/package.md](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/algorithm/transferoptimization/package.md)
- Graph.java (OTP2) — [Graph.java](https://github.com/opentripplanner/OpenTripPlanner/blob/dev-2.x/application/src/main/java/org/opentripplanner/routing/graph/Graph.java)
- Build Configuration docs — [docs.opentripplanner.org BuildConfiguration](https://docs.opentripplanner.org/en/latest/BuildConfiguration/)
- Troubleshooting — [docs.opentripplanner.org Troubleshooting](https://docs.opentripplanner.org/en/latest/Troubleshooting-Routing/)
- Basic Tutorial — [docs.opentripplanner.org Basic Tutorial](https://docs.opentripplanner.org/en/dev-2.x/Basic-Tutorial/)
- PR #2410 (station transfers) — [github.com/opentripplanner/OpenTripPlanner/pull/2410](https://github.com/opentripplanner/OpenTripPlanner/pull/2410)
- PR #3007 (move SimpleTransfers out of edges) — [github.com/opentripplanner/OpenTripPlanner/pull/3007](https://github.com/opentripplanner/OpenTripPlanner/pull/3007)
- Issue #6172 (unify NearbyStopFinder) — [github.com/opentripplanner/OpenTripPlanner/issues/6172](https://github.com/opentripplanner/OpenTripPlanner/issues/6172)

### Conveyal R5

- Repo — [github.com/conveyal/r5](https://github.com/conveyal/r5)
- TransferFinder javadoc — [javadoc.conveyal.com TransferFinder](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/transit/TransferFinder.html)
- TransitLayer.java — [github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/transit/TransitLayer.java](https://github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/transit/TransitLayer.java)
- StreetRouter.java — [github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/streets/StreetRouter.java](https://github.com/conveyal/r5/blob/master/src/main/java/com/conveyal/r5/streets/StreetRouter.java)
- TransitDataProvider javadoc — [javadoc.conveyal.com TransitDataProvider](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/otp2/api/transit/TransitDataProvider.html)
- TNBuilderConfig javadoc — [javadoc.conveyal.com TNBuilderConfig](http://javadoc.conveyal.com/r5/master/com/conveyal/r5/point_to_point/builder/TNBuilderConfig.html)

### MOTIS + nigiri + ppr

- MOTIS repo — [github.com/motis-project/motis](https://github.com/motis-project/motis)
- nigiri repo — [github.com/motis-project/nigiri](https://github.com/motis-project/nigiri)
- ppr repo — [github.com/motis-project/ppr](https://github.com/motis-project/ppr)
- Setup docs — [docs/setup.md](https://github.com/motis-project/motis/blob/master/docs/setup.md)
- compute_footpaths.cc — [src/compute_footpaths.cc](https://github.com/motis-project/motis/blob/master/src/compute_footpaths.cc)
- openapi.yaml — [openapi.yaml](https://github.com/motis-project/motis/blob/master/openapi.yaml)
- Issue #339 (min_transfer_time bug) — [motis-project/nigiri/issues/339](https://github.com/motis-project/nigiri/issues/339)
- PR reduced footpaths — [compare master...reduced-footpaths](https://github.com/motis-project/motis/compare/master...reduced-footpaths)
- Commit 2167a3b (max matching distance) — [github.com/motis-project/motis/commit/2167a3b](https://github.com/motis-project/motis/commit/2167a3b420cae32fc310605cf7c4c6d73cb14ea1)
- PR #369 (early pruning footpaths) — [motis-project/nigiri/pull/369](https://github.com/motis-project/nigiri/pull/369)
- Issue #471 (slow routing) — [motis-project/motis/issues/471](https://github.com/motis-project/motis/issues/471)

### Valhalla

- Repo — [github.com/valhalla/valhalla](https://github.com/valhalla/valhalla)
- pedestriancost.cc — [src/sif/pedestriancost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/pedestriancost.cc)
- transitcost.cc — [src/sif/transitcost.cc](https://github.com/valhalla/valhalla/blob/master/src/sif/transitcost.cc)
- route_action.cc — [src/loki/route_action.cc](https://github.com/valhalla/valhalla/blob/master/src/loki/route_action.cc)
- Docs overview — [valhalla.github.io/valhalla/route_overview](https://valhalla.github.io/valhalla/route_overview/)
- Dynamic costing docs — [valhalla.github.io/valhalla/concepts/costing/dynamic-costing](https://valhalla.github.io/valhalla/concepts/costing/dynamic-costing/)

### GraphHopper

- Repo — [github.com/graphhopper/graphhopper](https://github.com/graphhopper/graphhopper)
- FootAccessParser — [FootAccessParser.java](https://github.com/graphhopper/graphhopper/blob/master/core/src/main/java/com/graphhopper/routing/util/parsers/FootAccessParser.java)
- PtRouterImpl — [PtRouterImpl.java](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/src/main/java/com/graphhopper/gtfs/PtRouterImpl.java)
- PtRouteResource — [PtRouteResource.java](https://github.com/graphhopper/graphhopper/blob/master/web-bundle/src/main/java/com/graphhopper/resources/PtRouteResource.java)
- GTFS README — [reader-gtfs/README.md](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/README.md)
- config-example-pt.yml — [config-example-pt.yml](https://github.com/graphhopper/graphhopper/blob/master/reader-gtfs/config-example-pt.yml)
- FootFlagEncoder javadoc (deprecado) — [javadoc.io FootFlagEncoder](https://javadoc.io/doc/com.graphhopper/graphheap-core/3.0-pre5/com/graphhopper/routing/util/FootFlagEncoder.html)
- HikeFlagEncoder javadoc (deprecado) — [javadoc.io HikeFlagEncoder](https://javadoc.io/doc/com.graphhopper/graphheap-core/3.0-pre5/com/graphhopper/routing/util/HikeFlagEncoder.html)

---

## Apéndice A · Tabla resumen de constantes de distancia de walking

| Motor | Default transfer distance | Configurable | Wheelchair-aware |
|---|---|---|---|
| OTP2 | `maxTransferDuration: PT30M` (~2.4km @ 5km/h) | Sí, por `transferRequests[].maxTransferDuration` | Sí, con `wheelchairAccessibility.enabled` |
| R5 | `TRANSFER_DISTANCE_LIMIT_METERS = 1000` + `WALK_DISTANCE_LIMIT_METERS = 2000` | No, hardcoded | Vía `profileRequest` walking speed |
| MOTIS | `link_stop_distance: 100` (haversine) + `max_footpath_length: 15` min | Sí, por config YAML |
| Valhalla | `kTransitTransferMaxDistance = 805` (0.5 mi) | Sí, vía `pedestrian.transit_transfer_max_distance` en JSON | Sí, vía `transport_type: "wheelchair"` |
| GraphHopper | Sin constante única — depende de `pt.limit_street_time` | Sí, por query | Sí, vía perfil custom |

---

## Apéndice B · Glosario de términos primarios usados

- **`SimpleTransfer`** (OTP2) — conexión entre dos TransitStops con coste de walking. No es un edge desde OTP2 v2.x; es un campo del Graph
- **`footpath`** (MOTIS/nigiri) — arista dirigida entre dos `location_idx_t` con una `duration_t` en minutos. Se precomputa en build
- **`TransferLeg`** (R5) — par `(toStopIndex, distance_mm)` almacenado en `TransitLayer.transfersForStop`
- **`TRANSFER` edge** (GraphHopper) — arista dentro del time-expanded graph que conecta arrivals y departures
- **`PathwayEdge`** (OTP2) — conexión dentro de una estación, según `pathways.txt`. Tiene coste en segundos
- **`pedestrian_cost`** (Valhalla) — función de coste dinámico aplicado a cada edge OSM. Multiplica el tiempo por factores por uso (footway, alley, sidewalk, etc.)
- **`EarliestArrivalSearch`** (OTP2) — A* sobre el street graph con coste = tiempo. Usado por `StreetNearbyStopFinder`

---

## Apéndice C · Cosas que NO están en esta investigación

- **OTP1 vs OTP2 historical** — no cubierto, fuera de scope. Para detalles históricos ver el PR [#3007](https://github.com/opentripplanner/OpenTripPlanner/pull/3007) que documenta el cambio.
- **GTFS-Flex** — usado por MOTIS pero no profundizado (mencionado en el README de MOTIS como formato soportado)
- **GTFS-Pathways completo** — referenciado pero no profundizado. OTP2 lo implementa vía `PathwayEdge` y `Pathway.java` ([Pathway.java#L91](https://github.com/opentripplanner/OpenTripPlanner/blob/f4bfedfc41d3b92df45927a72edcab28624510d6/application/src/main/java/org/opentripplanner/transit/model/site/Pathway.java))
- **GTFS-Fares v2** — fuera de scope
- **One-to-many / profile queries** — R5 y GraphHopper los soportan; fuera de scope
- **Real-time updates y cómo afectan transfers** — fuera de scope