# 03 — GTFS (General Transit Feed Specification)

> Investigación sobre el formato GTFS con **fuentes primarias únicamente**.
> Spec oficial: [gtfs.org](https://gtfs.org/documentation/schedule/reference/) — mantenida por **MobilityData** bajo governance del GTFS Schedule community process ([gtfs.org](https://gtfs.org/community/governance/gtfs-schedule-governance/introduction/)).
> Repositorio fuente: [google/transit](https://github.com/google/transit) — `gtfs/spec/en/reference.md` (spec de Schedule) y `gtfs-realtime/spec/en/reference.md` (spec de Realtime).
> Última revisión oficial de Schedule referenciada: **27 abril 2026** ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).
> Validadores: [MobilityData/gtfs-validator](https://github.com/MobilityData/gtfs-validator) (oficial) y [conveyal/gtfs-lib](https://github.com/conveyal/gtfs-lib).
> Búsquedas realizadas: 17 Exa + 1 webfetch (gtfs.org reference).

---

## 0. Convenciones de la spec

- Lenguaje normativo RFC 2119: `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHOULD`, `RECOMMENDED`, `MAY`, `OPTIONAL` ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).
- **Presence** de archivos y campos:
  - `Required` — debe estar presente con valor válido.
  - `Optional` — puede omitirse.
  - `Conditionally Required` — obligatorio bajo condiciones descritas.
  - `Conditionally Forbidden` — prohibido bajo condiciones descritas.
  - `Recommended` — puede omitirse pero es buena práctica.
- **Tipos de campo**: `Color`, `Currency code`, `Currency amount`, `Date` (YYYYMMDD), `Email`, `Enum`, `ID` (UTF-8), `Language code` (BCP 47), `Latitude` (-90..90), `Longitude` (-180..180), `Float`, `Integer`, `Phone number`, `Time` (HH:MM:SS, valores > 24:00:00 permitidos), `Local time`, `Text` (UTF-8), `Timezone` (IANA TZ), `URL`.
- **Primary key**: campo o combinación que identifica una fila.
- **Dataset**: archivos CSV `.txt` (encoding UTF-8, CRLF o LF) empaquetados en un `.zip` al root, sin subcarpetas ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).
- **Field names case-sensitive**. Comillas y comas en valores se escapanan con comillas dobles (RFC 4180).

---

## 1. Presencia de archivos (Schedule)

Tabla oficial de presencia de los 30 archivos definidos por la spec actual ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)):

| Archivo | Presence |
|---|---|
| `agency.txt` | Required |
| `stops.txt` | Conditionally Required (Required salvo si `locations.geojson` define zonas) |
| `routes.txt` | Required |
| `trips.txt` | Required |
| `stop_times.txt` | Required |
| `calendar.txt` | Conditionally Required (Required salvo si todo el servicio está en `calendar_dates.txt`) |
| `calendar_dates.txt` | Conditionally Required (Required si `calendar.txt` se omite) |
| `fare_attributes.txt` | Optional |
| `fare_rules.txt` | Optional |
| `timeframes.txt` | Optional |
| `rider_categories.txt` | Optional |
| `fare_media.txt` | Optional |
| `fare_products.txt` | Optional |
| `fare_leg_rules.txt` | Optional |
| `fare_leg_join_rules.txt` | Optional |
| `fare_transfer_rules.txt` | Optional |
| `areas.txt` | Optional |
| `stop_areas.txt` | Optional |
| `networks.txt` | Conditionally Forbidden (Forbidden si `network_id` existe en `routes.txt`) |
| `route_networks.txt` | Conditionally Forbidden (idem) |
| `shapes.txt` | Optional |
| `frequencies.txt` | Optional |
| `transfers.txt` | Optional |
| `pathways.txt` | Optional |
| `levels.txt` | Conditionally Required (Required si hay ascensores, `pathway_mode=5`) |
| `location_groups.txt` | Optional |
| `location_group_stops.txt` | Optional |
| `locations.geojson` | Optional (RFC 7946) |
| `booking_rules.txt` | Optional |
| `translations.txt` | Optional |
| `feed_info.txt` | Conditionally Required (Required si `translations.txt` está; Recommended otherwise) |
| `attributions.txt` | Optional |

> "Base GTFS" = 7 archivos: `agency`, `stops`, `routes`, `trips`, `stop_times`, `calendar`, `calendar_dates` ([gtfs.org/getting-started/create](https://gtfs.org/getting-started/create/)).

---

## 2. `agency.txt`

**Primary key**: `agency_id`. **Presence**: Required (archivo).

| Field | Type | Presence | Notas |
|---|---|---|---|
| `agency_id` | Unique ID | Conditionally Required | Identifica una marca/agencia. Required si hay varias agencias en el dataset ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `agency_name` | Text | Required | Nombre completo |
| `agency_url` | URL | Required | URL de la agencia |
| `agency_timezone` | Timezone | Required | IANA TZ; todas las agencias de un dataset deben compartir timezone |
| `agency_lang` | Language code (BCP 47) | Optional | Idioma principal |
| `agency_phone` | Phone number | Optional | Admite texto marcable (`503-238-RIDE`) |
| `agency_fare_url` | URL | Optional | Página de compra/info de tarifas |
| `agency_email` | Email | Optional | Contacto de customer service |
| `cemv_support` | Enum | Optional | `0`/vacío = sin info, `1` = cEMV aceptado, `2` = no soportado |

Ejemplo canónico ([gtfs.org/getting-started/example-feed](https://gtfs.org/getting-started/example-feed/)):

```
agency_id,agency_name,agency_url,agency_timezone,agency_phone,agency_lang
FunBus,The Fun Bus,https://www.thefunbus.org,America/Los_Angeles,(310) 555-0222,en
```

---

## 3. `stops.txt`

**Primary key**: `stop_id`. **Presence**: Conditionally Required (Required salvo `locations.geojson` defina zonas on-demand).

| Field | Type | Presence | Notas |
|---|---|---|---|
| `stop_id` | Unique ID | **Required** | Único en todo el dataset (no colisiona con `locations.geojson id` ni `location_groups.location_group_id`) ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `stop_code` | Text | Optional | Código corto público (p.ej. para cartelería o 3-1-1) |
| `stop_name` | Text | Conditionally Required | Required para `location_type=0/1/2`; opcional para `3/4` |
| `tts_stop_name` | Text | Optional | Versión TTS del `stop_name` (abrir abreviaturas, p.ej. "St"→"Street") |
| `stop_desc` | Text | Optional | Descripción útil; no debe duplicar `stop_name` |
| `stop_lat` | Latitude | Conditionally Required | Required para `location_type=0/1/2`; opcional para `3/4` |
| `stop_lon` | Longitude | Conditionally Required | Idem |
| `zone_id` | ID | Optional | Identifica zona tarifaria |
| `stop_url` | URL | Optional | URL distinta de `agency.agency_url` y `routes.route_url` |
| `location_type` | Enum | Optional | `0` Stop/Platform, `1` Station, `2` Entrance/Exit, `3` Generic Node, `4` Boarding Area ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `parent_station` | Foreign ID | Conditionally Required | Required para `location_type=2/3/4`; opcional para `0`; Forbidden para `1` |
| `stop_timezone` | Timezone | Optional | Override del timezone (hereda de agency si vacío) |
| `wheelchair_boarding` | Enum | Optional | `0`/vacío = sin info, `1` accesible, `2` no accesible (semántica distinta para parentless/child/entrance) |
| `level_id` | Foreign ID → `levels.level_id` | Optional | Piso dentro de una estación |
| `platform_code` | Text | Optional | Solo identificador (p.ej. "G", "3") |
| `stop_access` | Enum | Conditionally Forbidden | `0` no acceso directo desde calle (pathways), `1` acceso directo. Forbidden para `location_type=1/2/3/4` o si `parent_station` está vacío |

> **Regla de unicidad de ID**: `stop_id` debe ser único contra `locations.geojson id` y `location_groups.location_group_id` ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).

---

## 4. `routes.txt`

**Primary key**: `route_id`. **Presence**: Required.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `route_id` | Unique ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `agency_id` | Foreign ID → `agency.agency_id` | Conditionally Required | Required si hay varias agencias |
| `route_short_name` | Text | Conditionally Required | ≤12 chars. Required si `route_long_name` está vacío |
| `route_long_name` | Text | Conditionally Required | Required si `route_short_name` está vacío |
| `route_desc` | Text | Optional | Descripción útil |
| `route_type` | Enum | **Required** | Ver tabla de enum abajo |
| `route_url` | URL | Optional | URL de la ruta |
| `route_color` | Color | Optional | Hex sin `#`. Default `FFFFFF` |
| `route_text_color` | Color | Optional | Hex sin `#`. Default `000000`. Contraste con `route_color` |
| `route_sort_order` | Non-negative integer | Optional | Presentación al pasajero |
| `continuous_pickup` | Enum | Conditionally Forbidden | `0` continuo, `1`/vacío no, `2` teléfono, `3` conductor |
| `continuous_drop_off` | Enum | Conditionally Forbidden | Idem para drop-off |
| `network_id` | ID | Conditionally Forbidden | Forbidden si existen `networks.txt` / `route_networks.txt` |
| `cemv_support` | Enum | Optional | Override de `agency.cemv_support` |

**Enum `route_type`** ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)):

| Value | Modo |
|---|---|
| 0 | Tram, Streetcar, Light rail |
| 1 | Subway, Metro |
| 2 | Rail (intercity/long-distance) |
| 3 | **Bus** |
| 4 | Ferry |
| 5 | Cable tram |
| 6 | Aerial lift (gondola) |
| 7 | Funicular |
| 11 | Trolleybus |
| 12 | Monorail |

> Google Transit extiende estos con tipos TPEG adicionales pero la spec oficial los limita a 0–7, 11, 12 ([developers.google.com/transit/gtfs/reference](https://developers.google.com/transit/gtfs/reference)).

---

## 5. `trips.txt`

**Primary key**: `trip_id`. **Presence**: Required.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `route_id` | Foreign ID | **Required** | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `service_id` | Foreign ID → `calendar.service_id` o `calendar_dates.service_id` | **Required** | Define fechas de operación |
| `trip_id` | Unique ID | **Required** | Identifica un viaje |
| `trip_headsign` | Text | Optional | Destino en cartelería del vehículo |
| `trip_short_name` | Text | Optional | Identificador público (p.ej. número de tren); único dentro de un service day |
| `direction_id` | Enum | Optional | `0` outbound, `1` inbound |
| `block_id` | ID | Optional | Agrupa viajes secuenciales del mismo vehículo |
| `shape_id` | Foreign ID → `shapes.shape_id` | Conditionally Required | Required si la ruta tiene pickup/drop-off continuo |
| `wheelchair_accessible` | Enum | Optional | `0`/vacío, `1` sí, `2` no |
| `bikes_allowed` | Enum | Optional | `0`/vacío, `1` sí, `2` no |
| `cars_allowed` | Enum | Optional | Idem |
| `safe_duration_factor` | Float | Optional | Multiplicador para tiempo on-demand |
| `safe_duration_offset` | Float | Optional | Offset (segundos) para tiempo on-demand |

> **`block_id` vs `transfers.txt`**: si se modelan in-seat transfers debe usarse `transfers.txt` con `transfer_type=4`, no `block_id` ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).

---

## 6. `stop_times.txt`

**Primary key**: (`trip_id`, `stop_sequence`). **Presence**: Required.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `trip_id` | Foreign ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `arrival_time` | Time | Conditionally Required | Required para primera y última parada; required si `timepoint=1`; forbidden si hay `*_pickup_drop_off_window` |
| `departure_time` | Time | Conditionally Required | Idem `arrival_time` salvo primera/última |
| `stop_id` | Foreign ID → `stops.stop_id` | Conditionally Required | Forbidden si `location_group_id` o `location_id` están definidos |
| `location_group_id` | Foreign ID | Conditionally Forbidden | On-demand |
| `location_id` | Foreign ID → `locations.geojson id` | Conditionally Forbidden | On-demand |
| `stop_sequence` | Non-negative integer | **Required** | Creciente a lo largo del viaje, no necesita ser consecutivo |
| `stop_headsign` | Text | Optional | Override de `trip_headsign` para paradas específicas |
| `start_pickup_drop_off_window` | Time | Conditionally Required | Required on-demand / ventanas |
| `end_pickup_drop_off_window` | Time | Conditionally Required | Idem |
| `pickup_type` | Enum | Conditionally Forbidden | `0` regular, `1` no pickup, `2` teléfono, `3` conductor |
| `drop_off_type` | Enum | Conditionally Forbidden | Idem |
| `continuous_pickup` | Enum | Conditionally Forbidden | Override de `routes.continuous_pickup` |
| `continuous_drop_off` | Enum | Conditionally Forbidden | Idem |
| `shape_dist_traveled` | Non-negative float | Optional | Distancia acumulada sobre la shape (mismas unidades que `shapes.txt`) |
| `timepoint` | Enum | Optional | `0` aproximado/interpolado, `1` exacto |
| `pickup_booking_rule_id` | Foreign ID → `booking_rules.booking_rule_id` | Optional | |
| `drop_off_booking_rule_id` | Foreign ID | Optional | |

---

## 7. `calendar.txt`

**Primary key**: `service_id`. **Presence**: Conditionally Required.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `service_id` | Unique ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `monday` | Enum | Required | `1` opera, `0` no opera |
| `tuesday` | Enum | Required | Idem |
| `wednesday` | Enum | Required | Idem |
| `thursday` | Enum | Required | Idem |
| `friday` | Enum | Required | Idem |
| `saturday` | Enum | Required | Idem |
| `sunday` | Enum | Required | Idem |
| `start_date` | Date | Required | YYYYMMDD |
| `end_date` | Date | Required | YYYYMMDD, inclusivo |

---

## 8. `calendar_dates.txt`

**Primary key**: (`service_id`, `date`). **Presence**: Conditionally Required (Required si `calendar.txt` se omite).

| Field | Type | Presence | Notas |
|---|---|---|---|
| `service_id` | Foreign ID o ID | Required | FK a `calendar.service_id` si ambos coexisten; ID libre si `calendar.txt` se omite |
| `date` | Date | Required | YYYYMMDD |
| `exception_type` | Enum | Required | `1` = servicio agregado en esa fecha, `2` = servicio removido en esa fecha |

> **Semántica**: `calendar_dates.txt` se aplica **después** de expandir `calendar.txt`. `exception_type=1` puede agregar fechas fuera del rango `start_date..end_date`; `exception_type=2` puede remover fechas dentro del rango ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).

---

## 9. `shapes.txt`

**Primary key**: (`shape_id`, `shape_pt_sequence`). **Presence**: Optional.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `shape_id` | ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `shape_pt_lat` | Latitude | Required | WGS84, -90..90 |
| `shape_pt_lon` | Longitude | Required | WGS84, -180..180 |
| `shape_pt_sequence` | Non-negative integer | Required | Creciente a lo largo de la shape; no necesita ser consecutivo |
| `shape_dist_traveled` | Non-negative float | Optional | Distancia acumulada en mismas unidades que `stop_times.shape_dist_traveled` |

> Best practice: shape no debe alejarse >150 m de las paradas que sirve ([support.google.com/transitpartners/answer/6377398](https://support.google.com/transitpartners/answer/6377398)).

---

## 10. `transfers.txt`

**Primary key**: (`from_stop_id`, `to_stop_id`, `from_trip_id`, `to_trip_id`, `from_route_id`, `to_route_id`). **Presence**: Optional.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `from_stop_id` | Foreign ID | Conditionally Required | Required si `transfer_type` ∈ {vacío,0,1,2,3} |
| `to_stop_id` | Foreign ID | Conditionally Required | Idem |
| `from_route_id` | Foreign ID → `routes.route_id` | Optional | |
| `to_route_id` | Foreign ID | Optional | |
| `from_trip_id` | Foreign ID → `trips.trip_id` | Conditionally Required | Required si `transfer_type` ∈ {4,5} |
| `to_trip_id` | Foreign ID | Conditionally Required | Required si `transfer_type` ∈ {4,5} |
| `transfer_type` | Enum | **Required** | Ver tabla |
| `min_transfer_time` | Non-negative integer (seconds) | Optional | Requerido cuando `transfer_type=2` |

**Enum `transfer_type`** ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)):

| Value | Significado |
|---|---|
| 0 / vacío | Recommended transfer point |
| 1 | Timed transfer — vehículo espera al pasajero |
| 2 | Min transfer time (definido por `min_transfer_time`) |
| 3 | No es posible transferirse |
| 4 | In-seat transfer (mismo vehículo) |
| 5 | In-seat transfer NO permitido (re-board obligatorio) |

> Orden de especificidad para matching: ambos `trip_id` > un `trip_id`+un `route_id` > un `trip_id` > ambos `route_id` > un `route_id` > solo `from_stop_id`+`to_stop_id` ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)).

---

## 11. `pathways.txt`

**Primary key**: `pathway_id`. **Presence**: Optional.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `pathway_id` | Unique ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `from_stop_id` | Foreign ID | Required | Debe ser platform/entrance/generic node/boarding area (no station) |
| `to_stop_id` | Foreign ID | Required | Idem |
| `pathway_mode` | Enum | Required | Ver tabla |
| `is_bidirectional` | Enum | Required | `0` unidireccional, `1` bidireccional. Exit gates NO bidireccionales |
| `length` | Non-negative float (meters) | Optional | Recommended para walkway/fare gate/exit gate |
| `traversal_time` | Positive integer (seconds) | Optional | Recommended para moving sidewalk/escalator/elevator |
| `stair_count` | Non-null integer | Optional | Positivo = sube, negativo = baja. Recommended para stairs (`pathway_mode=2`) |
| `max_slope` | Float | Optional | Ratio de pendiente. Solo para walkway/moving sidewalk |
| `min_width` | Positive float (meters) | Optional | Recommended si <1m |
| `signposted_as` | Text | Optional | Cartelería física |
| `reversed_signposted_as` | Text | Optional | Cartelería en sentido inverso |

**Enum `pathway_mode`** ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)):

| Value | Modo |
|---|---|
| 1 | Walkway |
| 2 | Stairs |
| 3 | Moving sidewalk / travelator |
| 4 | Escalator |
| 5 | **Elevator** (dispara `levels.txt` Conditionally Required) |
| 6 | Fare gate |
| 7 | Exit gate |

---

## 12. `levels.txt`

**Primary key**: `level_id`. **Presence**: Conditionally Required (Required si algún pathway es elevator).

| Field | Type | Presence | Notas |
|---|---|---|---|
| `level_id` | Unique ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `level_index` | Float | Required | `0` = planta baja; positivos arriba, negativos abajo |
| `level_name` | Text | Optional | Nombre visible al pasajero |

---

## 13. `frequencies.txt`

**Primary key**: (`trip_id`, `start_time`). **Presence**: Optional.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `trip_id` | Foreign ID | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `start_time` | Time | Required | Inicio de la ventana con la misma frecuencia |
| `end_time` | Time | Required | Fin de la ventana |
| `headway_secs` | Positive integer | Required | Segundos entre salidas desde la misma parada |
| `exact_times` | Enum | Optional | `0`/vacío = frequency-based, `1` = schedule-based comprimido |

---

## 14. `attributions.txt`

**Primary key**: `attribution_id`. **Presence**: Optional.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `attribution_id` | Unique ID | Optional | Útil para traducciones ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `agency_id` | Foreign ID | Optional | Si se setea, `route_id` y `trip_id` deben estar vacíos |
| `route_id` | Foreign ID | Optional | Si se setea, `agency_id` y `trip_id` deben estar vacíos |
| `trip_id` | Foreign ID | Optional | Si se setea, `agency_id` y `route_id` deben estar vacíos |
| `organization_name` | Text | **Required** | Nombre a atribuir |
| `is_producer` | Enum | Optional | `0`/vacío no, `1` sí |
| `is_operator` | Enum | Optional | Idem |
| `is_authority` | Enum | Optional | Idem |
| `attribution_url` | URL | Optional | |
| `attribution_email` | Email | Optional | |
| `attribution_phone` | Phone number | Optional | |

---

## 15. `feed_info.txt`

**Primary key**: (none — un solo registro). **Presence**: Conditionally Required.

| Field | Type | Presence | Notas |
|---|---|---|---|
| `feed_publisher_name` | Text | Required | ([gtfs.org](https://gtfs.org/documentation/schedule/reference/)) |
| `feed_publisher_url` | URL | Required | |
| `feed_lang` | Language code | Required | `mul` permitido si multilingüe |
| `default_lang` | Language code | Optional | Idioma fallback |
| `feed_start_date` | Date | Recommended | YYYYMMDD |
| `feed_end_date` | Date | Recommended | YYYYMMDD |
| `feed_version` | Text | Recommended | String de versión (p.ej. semver) |
| `feed_contact_email` | Email | Optional | Recomendado uno de email/url |
| `feed_contact_url` | URL | Optional | Recomendado uno de email/url |

---

## 16. Otros archivos (no centrales al alcance)

Definidos pero no cubiertos en profundidad aquí (todos presencia = Optional salvo `networks.txt`/`route_networks.txt` que son Conditionally Forbidden): `fare_attributes.txt`, `fare_rules.txt`, `timeframes.txt`, `rider_categories.txt`, `fare_media.txt`, `fare_products.txt`, `fare_leg_rules.txt`, `fare_leg_join_rules.txt`, `fare_transfer_rules.txt`, `areas.txt`, `stop_areas.txt`, `networks.txt`, `route_networks.txt`, `location_groups.txt`, `location_group_stops.txt`, `locations.geojson`, `booking_rules.txt`, `translations.txt`. Spec completa: [gtfs.org/documentation/schedule/reference](https://gtfs.org/documentation/schedule/reference/).

---

## 17. GTFS Realtime (protobuf)

**Spec oficial**: [gtfs.org/documentation/realtime/reference](https://gtfs.org/documentation/realtime/reference/). **Proto fuente**: [github.com/MobilityData/gtfs-realtime-bindings/blob/master/gtfs-realtime.proto](https://github.com/MobilityData/gtfs-realtime-bindings/blob/master/gtfs-realtime.proto). **Bindings oficiales** mantenidos por MobilityData: Java, Python, Node.js, .NET, Golang, Ruby, PHP, Java/Android ([gtfs.org/documentation/realtime/language-bindings](https://gtfs.org/documentation/realtime/language-bindings/overview/)).

### 17.1 Estructura raíz: `FeedMessage`

```proto
message FeedMessage {
  required FeedHeader header = 1;
  repeated FeedEntity entity = 2;
  extensions 1000 to 1999;
  extensions 9000 to 9999;
}
```

`FeedHeader` incluye `gtfs_realtime_version`, `incrementality` (FULL_DATASET vs DIFFERENTIAL), `timestamp` ([gtfs-realtime.proto](https://github.com/MobilityData/gtfs-realtime-bindings/blob/master/gtfs-realtime.proto)).

### 17.2 `FeedEntity`

Exactamente uno de los siguientes (salvo `is_deleted=true`):

| Field | Tipo | Cardinalidad | Descripción |
|---|---|---|---|
| `id` | string | required | ID único dentro del FeedMessage |
| `is_deleted` | bool | optional | Solo relevante para incrementality DIFFERENTIAL |
| `trip_update` | TripUpdate | optional | Datos de delay por viaje |
| `vehicle` | VehiclePosition | optional | Posición del vehículo |
| `alert` | Alert | optional | Alerta de servicio |
| `shape` | Shape | optional (experimental) | Modificación de shape |
| `stop` | Stop | optional (experimental) | Modificación de stop |
| `trip_modifications` | TripModifications | optional (experimental) | Modificaciones de viaje |

### 17.3 `TripUpdate`

| Field | Tipo | Notas |
|---|---|---|
| `trip` | TripDescriptor | required |
| `stop_time_update` | repeated StopTimeUpdate | Cambios por parada |
| `vehicle` | VehicleDescriptor | optional |
| `timestamp` | uint64 | opcional, UNIX |
| `delay` | int32 | opcional, segundos |
| `trip_properties` | TripProperties | opcional |

`TripDescriptor.schedule_relationship`: `SCHEDULED=0`, `ADDED=1`, `UNSCHEDULED=2`, `CANCELED=3`, `REPLACEMENT=5`, `DUPLICATED=4`. ([google/transit gtfs-realtime/spec/en/reference.md](https://github.com/google/transit/blob/master/gtfs-realtime/spec/en/reference.md)).

### 17.4 `VehiclePosition`

| Field | Tipo | Notas |
|---|---|---|
| `trip` | TripDescriptor | optional |
| `position` | Position | optional (lat/lon, bearing, speed, odometer) |
| `current_stop_sequence` | uint32 | optional |
| `stop_id` | string | optional |
| `current_status` | VehicleStopStatus enum | `INCOMING_AT=0`, `STOPPED_AT=1`, `IN_TRANSIT_TO=2` |
| `timestamp` | uint64 | UNIX seconds |
| `vehicle` | VehicleDescriptor | optional |
| `occupancy_status` | OccupancyStatus enum | `EMPTY..UNKNOWN` |
| `congestion_level` | CongestionLevel enum | |

### 17.5 `Alert`

| Field | Tipo | Notas |
|---|---|---|
| `active_period` | repeated TimeRange | opcional |
| `informed_entity` | repeated EntitySelector | opcional |
| `cause` | Cause enum | `UNKNOWN_CAUSE=1`, `OTHER_CAUSE=2`, `TECHNICAL_PROBLEM=3`, `STRIKE=4`, `DEMONSTRATION=5`, `ACCIDENT=6`, `HOLIDAY=7`, `WEATHER=8`, `MAINTENANCE=9`, `CONSTRUCTION=10`, `POLICE_ACTIVITY=11`, `MEDICAL_EMERGENCY=12` |
| `effect` | Effect enum | `NO_SERVICE=1`, `REDUCED_SERVICE=2`, `SIGNIFICANT_DELAYS=3`, `DETOUR=4`, `ADDITIONAL_SERVICE=5`, `MODIFIED_SERVICE=6`, `OTHER_EFFECT=7`, `UNKNOWN_EFFECT=8`, `STOP_MOVED=9`, `NO_EFFECT=10`, `ACCESSIBILITY_ISSUE=11` |
| `url` | TranslatedString | opcional |
| `header_text` | TranslatedString | opcional |
| `description_text` | TranslatedString | opcional |
| `severity_level` | SeverityLevel enum | `INFO=1`, `WARNING=2`, `SEVERE=3` |

---

## 18. Validadores y herramientas oficiales

### 18.1 MobilityData/gtfs-validator (canónico)

- Repo: [github.com/MobilityData/gtfs-validator](https://github.com/MobilityData/gtfs-validator) — Java, mantenido por MobilityData.
- Es el **validador de referencia** para GTFS Schedule (lo confirma [developers.google.com/transit/gtfs/guides/tools](https://developers.google.com/transit/gtfs/guides/tools) y el sitio oficial [gtfs-validator.mobilitydata.org](https://gtfs-validator.mobilitydata.org/)).
- Web UI: [gtfs-validator.mobilitydata.org](https://gtfs-validator.mobilitydata.org/).
- CLI / Docker / desktop / librería Java.
- Lista oficial de notices: [gtfs-validator.mobilitydata.org/rules.html](https://gtfs-validator.mobilitydata.org/rules.html).
- Categorías de notices: `GTFS Reference`, `GTFS Best Practices`, `Community rules` ([github.com/MobilityData/gtfs-validator](https://github.com/MobilityData/gtfs-validator)).
- Última release al momento: incluye validación de `locations.geojson` (polígonos válidos, malformados, geometrías no soportadas, `missing_required_element`, `unsupported_geo_json_type`, `unsupported_feature_type`, `unsupported_geometry_type`) ([github.com/MobilityData/gtfs-validator/releases](https://github.com/MobilityData/gtfs-validator/releases)).

Reglas clave que aplican (extracto de categorías en [RULES.md](https://github.com/MobilityData/gtfs-validator/blob/master/RULES.md)):

- **Estructura**: archivos en root del ZIP, encoding UTF-8, CRLF/LF, case-sensitive headers, sin tab/newline en valores.
- **Tipos de datos**: latitude ∈ [-90,90], longitude ∈ [-180,180], time HH:MM:SS (H:MM:SS aceptado), date YYYYMMDD, color hex 6 chars sin `#`, currency ISO 4217, timezone IANA.
- **Foreign keys**: cada FK debe existir (`agency_id` en `routes.txt` ↔ `agency.txt`, `route_id` en `trips.txt` ↔ `routes.txt`, `stop_id` en `stop_times.txt` ↔ `stops.txt`, `shape_id` en `trips.txt` ↔ `shapes.txt`, etc.).
- **Lógica de Schedule**:
  - `stop_times` ordenado por `stop_sequence` creciente.
  - `shape_dist_traveled` no decreciente.
  - `transfers.transfer_type` ∈ {0,1,2,3,4,5}.
  - `pathways.pathway_mode` ∈ {1,2,3,4,5,6,7}, exit gates no bidireccionales.
  - Si `routes.network_id` existe, `networks.txt` y `route_networks.txt` están prohibidos.
  - `calendar.txt` + `calendar_dates.txt` cubren ≥30 días de servicio (recomendación).
  - `pickup_type=0/3` prohibido si hay `*_pickup_drop_off_window`.
  - Shapes no se alejan >150 m de paradas (best practice).
- **GeoJSON**: polígonos válidos según OpenGIS Simple Features §6.1.11; tipo `FeatureCollection`; `id` único contra `stops.stop_id` y `location_groups.location_group_id`.

### 18.2 Otras librerías oficiales/canónicas

- **OneBusAway `onebusaway-gtfs-modules`** ([developer.onebusaway.org](https://developer.onebusaway.org/projects/onebusaway-gtfs-modules)) — Java, lectura/escritura/merge/transform con persistencia Hibernate. Usado por OpenTripPlanner.
- **Conveyal `gtfs-lib`** ([github.com/conveyal/gtfs-lib](https://github.com/conveyal/gtfs-lib)) — Java, storage disk-backed para feeds grandes. Comandos CLI: `--load`, `--validate`, `--json`. Reporta `load.json`/`validate.json` con `rowCount`, `errorCount`, `fatalException`, `fileSize` por tabla.

> Nota: MobilityData NO mantiene `gtfs-lib`; el repo canónico es Conveyal. MobilityData sí mantiene el validador ([github.com/MobilityData](https://github.com/MobilityData)).

---

## 19. Conversión GeoJSON/JSON-propio → GTFS

**No hay conversor oficial** publicado por MobilityData para esta tarea específica (confirmado: [github.com/MobilityData](https://github.com/MobilityData)).

Opciones de la comunidad, referenciadas en [developers.google.com/transit/gtfs/guides/tools](https://developers.google.com/transit/gtfs/guides/tools) y npm:

- **`trufi-app/geojson-to-gtfs`** ([npmjs.com/package/geojson-to-gtfs](https://www.npmjs.com/package/geojson-to-gtfs)) — Node.js; convierte `FeatureCollection` GeoJSON en GTFS. Hooks `prepareInput`, `prepareGeojsonFeature`, `prepareOutput`. Genera `agency.txt`, `routes.txt`, `trips.txt`, `stops.txt`, `stop_times.txt` (vacías si no hay timestamps), `shapes.txt`, `frequencies.txt` y `calendar*.txt` con service window derivado.
- **`BlinkTagInc/gtfs-to-geojson`** ([github.com/BlinkTagInc/gtfs-to-geojson](https://github.com/BlinkTagInc/gtfs-to-geojson)) — Node.js; sentido inverso (GTFS → GeoJSON de shapes y stops).
- **`BlinkTagInc/node-gtfs`** ([github.com/BlinkTagInc/node-gtfs](https://github.com/BlinkTagInc/node-gtfs)) — Node.js; importa GTFS a SQLite, query methods incluyendo `getStopsAsGeoJSON()`, `getShapesAsGeoJSON()`, y export de vuelta a CSV GTFS con `gtfs-export`.

Para datasets con polilíneas/coordinates preexistentes (como `routes.json`), el flujo recomendado por la comunidad:

1. Generar `shapes.txt` directo desde `coordenadas[][]` (1 fila por punto, `shape_pt_sequence` incremental).
2. Generar `stops.txt` deduplicando `lat`/`lng` por stop.
3. Generar `trips.txt`/`stop_times.txt` desde `recorridos[].paradas[]` + `coordenadas[]`.
4. Completar `agency.txt`, `routes.txt`, `calendar.txt`/`calendar_dates.txt` (mínimo 30 días recomendados).

---

## 20. Comparación con nuestro dataset (`fusalabs/src/data/routes.json`)

Estructura actual del dataset (`C:/Users/facun/OneDrive/Desktop/fusalabs/src/data/routes.json`, ~12 159 líneas, ~300 KB):

```json
{
  "version": "2.0",
  "updatedAt": "2026-09-11T19:35:00.000Z",
  "descripcion": "...",
  "paradas": { "stop-65-01": { "id", "nombre", "direccion", "lat", "lng", "conexiones" }, ... },
  "lineas": [
    { "id", "numero", "nombre", "empresa", "color", "textColor", "frecuenciaPicoMin", "mensajeEstado",
      "ramales": [
        { "id", "codigo", "nombre", "cabeceraOrigen", "cabeceraDestino", "color",
          "recorridos": [
            { "id", "sentido", "origen", "destino", "descripcion", "distanciaKm",
              "paradas": [ "stop-65-01", ..., "stop-65-09" ],
              "coordenadas": [ [lng, lat], ... ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 20.1 Equivalencias campo a campo

#### `stops.txt`

| GTFS Field | Nuestro campo | Match | Notas de transformación |
|---|---|---|---|
| `stop_id` | `paradas[id]` | ✅ | `stop-65-01` ya es ID válido (UTF-8, único) |
| `stop_name` | `paradas[nombre]` | ✅ | "Plaza Constitución (Cabecera Sur)" |
| `stop_lat` | `paradas[lat]` | ✅ | Ya WGS84 |
| `stop_lon` | `paradas[lng]` | ✅ | Ya WGS84 (orden lng-lat en `coordenadas` también, consistente) |
| `stop_desc` | `paradas[direccion]` | ✅ | "Lima y Av. Brasil (Transbordo)" |
| `location_type` | — | 🟡 derivable | `0` para paradas simples; podríamos modelar estaciones con `location_type=1` (subte/tren) usando `paradas[conexiones]` para crear una jerarquía |
| `parent_station` | — | 🟡 derivable | Crear `stop_id` para cada estación subte/tren (`Plaza Constitución = subte-C + tren-Roca`) y asignar a paradas con `conexiones` |
| `wheelchair_boarding` | — | ❌ | No tenemos dato |
| `zone_id` | — | ❌ | No modelado (relevante solo si hay tarifas por zona) |
| `stop_code` | — | ❌ | Podríamos usar el ID público (p.ej. código CNRT) |
| `stop_url` | — | ❌ | No aplica |

> **`conexiones`**: `subte: ["C"]`, `tren: ["Roca"]`, `metrobus: true` no es directamente traducible a GTFS. Es **metadato extra**. Lo más cercano en GTFS es `parent_station` (jerarquía) o `pathways.txt`/`transfers.txt`. Para la Línea 65, el equivalente más fiel es modelar **estaciones** (`location_type=1`) en `stops.txt` y luego `transfers.txt` conectando la parada con la estación.

#### `routes.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `route_id` | `lineas[id]` | ✅ |
| `route_short_name` | `lineas[numero]` | ✅ (p.ej. "65") |
| `route_long_name` | `lineas[nombre]` | ✅ (p.ej. "Barrancas de Belgrano – Plaza Constitución") |
| `route_type` | — | 🟡 derivable (inferir de modo de transporte; probablemente `3` Bus) |
| `route_color` | `lineas[color]` | ⚠️ nuestro formato es `#RRGGBB`, GTFS es `RRGGBB` (sin `#`); trivial transformación |
| `route_text_color` | `lineas[textColor]` | ⚠️ mismo caso |
| `agency_id` | `lineas[empresa]` | 🟡 hay que crear `agency.txt` con la empresa y referenciar por FK |

> **Decisión arquitectural**: una `linea` nuestra ↔ un `route` GTFS; un `ramal` nuestro ↔ un `route` distinto GTFS (con su propio `route_id` derivado, p.ej. `line-65-troncal`). Esto preserva la granularidad.

#### `trips.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `route_id` | derivado de `lineas[id] + ramales[id]` | 🟡 hay que aplanar la jerarquía |
| `service_id` | — | ⚠️ requerido, no existe; hay que crearlo (mínimo 1 service_id "todos los días") |
| `trip_id` | `recorridos[id]` | ✅ (p.ej. `line-65-ida`) |
| `trip_headsign` | `recorridos[destino]` | ✅ (p.ej. "Barrancas de Belgrano") |
| `direction_id` | `recorridos[sentido]` | 🟡 mapeo directo: `"ida" → 0`, `"vuelta" → 1` |
| `shape_id` | `recorridos[id]` | 🟡 usar el mismo ID para shape (`shape_id = line-65-ida-shape`) |
| `block_id` | — | ❌ no modelado |
| `wheelchair_accessible` / `bikes_allowed` | — | ❌ no modelado |

#### `stop_times.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `trip_id` | `recorridos[id]` | ✅ |
| `stop_id` | `recorridos[paradas][]` | ✅ |
| `stop_sequence` | index en `paradas[]` | ✅ (1-based, incremental) |
| `arrival_time` / `departure_time` | — | ❌ **no tenemos horarios** |
| `shape_dist_traveled` | `recorridos[distanciaKm]` | 🟡 podríamos interpolar proporcionalmente sobre la shape |
| `pickup_type` / `drop_off_type` | — | ❌ no modelado (default `0` aplica) |

> **Gap crítico**: `stop_times.txt` es required, pero sin `arrival_time`/`departure_time` solo es válido si modelamos como **frequency-based** (`frequencies.txt`) o si marcamos `timepoint=0` (interpolados). Para la Línea 65 hay `frecuenciaPicoMin` (5 min), lo que sugiere `frequencies.txt` es el path correcto.

#### `shapes.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `shape_id` | `recorridos[id]` | ✅ |
| `shape_pt_lat` | `coordenadas[][1]` | ✅ (nuestra tupla es `[lng, lat]`, hay que invertir el orden) |
| `shape_pt_lon` | `coordenadas[][0]` | ✅ |
| `shape_pt_sequence` | index 0-based en `coordenadas[]` | ✅ (la spec acepta non-consecutive; consecutivos es lo normal) |
| `shape_dist_traveled` | — derivable | 🟡 calculable desde `distanciaKm` + interpolación Haversine sobre la shape |

#### `transfers.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `from_stop_id` | `paradas[id]` con `conexiones.subte/tren` | 🟡 derivable: cuando dos rutas comparten una parada (mismo `stop_id` en `recorridos[paradas]`), se puede generar `transfer_type=0` (recommended transfer) |
| `to_stop_id` | idem | 🟡 idem |
| `from_route_id` / `to_route_id` | — | 🟡 derivable |
| `transfer_type` | — | 🟡 default `0`; `1` (timed) si los horarios lo permiten |
| `min_transfer_time` | — | ❌ no modelado |

> Lógica concreta: en nuestro dataset, `stop-65-01` (Plaza Constitución) tiene `conexiones.subte=["C"]` y `conexiones.tren=["Roca"]`. Una transferencia desde Línea 65 → Subte C debe aparecer en `transfers.txt` con `from_stop_id=stop-65-01`, `to_stop_id=<stop subte C>`.

#### `calendar.txt` / `calendar_dates.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `service_id` | — | ❌ no existe; hay que inventar al menos uno (p.ej. `weekday`, `weekend`) |
| `monday..sunday` | — | ❌ no modelado |
| `start_date` / `end_date` | `updatedAt` (no es lo mismo) | ❌ no tenemos ventana de operación |
| `exception_type` | — | ❌ no modelado |

> **Gap crítico**: para emitir un GTFS válido sin horarios, una opción pragmática es definir **un único `service_id`** activo todos los días durante un rango (p.ej. 30 días desde hoy). El validador `gtfs-validator` advertirá con notice de "service < 30 days" pero no rompe el feed ([gtfs.org/documentation/schedule/reference](https://gtfs.org/documentation/schedule/reference/)).

#### `agency.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `agency_id` | `lineas[empresa]` | 🟡 hay que deduplicar empresas |
| `agency_name` | `lineas[empresa]` | ✅ |
| `agency_url` | — | ❌ |
| `agency_timezone` | — | 🟡 derivable: `America/Argentina/Buenos_Aires` |
| `agency_lang` | — | 🟡 `es` |

#### `feed_info.txt`

| GTFS Field | Nuestro campo | Match |
|---|---|---|
| `feed_publisher_name` / `feed_publisher_url` | — | ❌ |
| `feed_lang` | — | 🟡 `es` |
| `feed_start_date` / `feed_end_date` | — | ❌ |
| `feed_version` | `version` | 🟡 ("2.0") |
| `feed_contact_email` / `feed_contact_url` | — | ❌ |

#### `attributions.txt`

No hay equivalencia. Aplicaría solo si agregamos el feed a un agregador.

#### Campos que NO tenemos equivalente

- `arrival_time`, `departure_time` (Schedule-based) — fundamental para `stop_times.txt`.
- `block_id`.
- `wheelchair_boarding`, `wheelchair_accessible`, `bikes_allowed`, `cars_allowed`.
- `trip_short_name`.
- `pathways.txt`, `levels.txt` — solo si modelamos estaciones con elevators.
- `frequencies.txt` — pero nuestro `frecuenciaPicoMin` mapea directamente a `headway_secs`.
- `fare_attributes.txt`, `fare_rules.txt` y todo Fares v2 — irrelevante para nuestro scope actual.

### 20.2 Tabla resumen: cobertura

| GTFS | Cobertura en `routes.json` | Acción |
|---|---|---|
| `agency.txt` | 🟡 parcial | Mapear `empresa` → dedupe + completar timezone/lang |
| `stops.txt` | ✅ alta | Solo quitar `#` de colores no aplica; transformar conexiones a jerarquía station/parent |
| `routes.txt` | ✅ alta | Aplanar `lineas`+`ramales` a `route_id` por ramal; quitar `#` de colores |
| `trips.txt` | ✅ alta | `recorridos` ↔ trips casi directo |
| `stop_times.txt` | 🟠 media | Sin horarios → usar `frequencies.txt` o marcar `timepoint=0` |
| `calendar.txt` | ❌ | Crear service_id único operativo 30+ días |
| `calendar_dates.txt` | ❌ | No necesario si `calendar.txt` cubre |
| `shapes.txt` | ✅ alta | Invertir `[lng, lat]` → `(shape_pt_lon, shape_pt_lat)` |
| `transfers.txt` | 🟡 parcial | Derivar de `conexiones` y paradas compartidas |
| `pathways.txt` | ❌ | No modelado (solo si modelamos estaciones internas) |
| `levels.txt` | ❌ | No aplica |
| `frequencies.txt` | 🟡 parcial | Mapear `frecuenciaPicoMin` → `headway_secs` |
| `attributions.txt` | ❌ | No aplica |
| `feed_info.txt` | 🟠 media | Mapear `version` → `feed_version`; completar resto |

### 20.3 Pasos concretos para emitir un GTFS válido desde `routes.json`

1. **Crear `agency.txt`**: deduplicar `lineas[empresa]` y emitir una fila por empresa con timezone `America/Argentina/Buenos_Aires`, lang `es`.
2. **Crear `stops.txt`**: iterar `paradas` 1:1. Para cada `paradas[id]` con `conexiones.subte/tren`, generar adicionalmente una fila `location_type=1` (estación) y poblar `parent_station` apuntando a esa estación.
3. **Crear `routes.txt`**: una fila por `ramal` (más fino que `linea`). `route_id = ramales[id]`, `route_short_name = lineas[numero]` + sufijo, `route_long_name = ramales[nombre]`, `route_type = 3` (Bus), `route_color` sin `#`, `agency_id` FK a `agency.txt`.
4. **Crear `trips.txt`**: 1 fila por `recorrido`. `route_id = ramales[id]`, `service_id = "todos"`, `trip_id = recorridos[id]`, `trip_headsign = recorridos[destino]`, `direction_id = 0` si `sentido="ida"`, `1` si `sentido="vuelta"`, `shape_id = recorridos[id] + "-shape"`.
5. **Crear `stop_times.txt`**: por cada trip, 1 fila por parada en `recorridos[paradas]` con `stop_sequence` incremental. Sin `arrival_time`/`departure_time` (válido solo con `frequencies.txt`). `timepoint = 0` (interpolado).
6. **Crear `shapes.txt`**: por cada recorrido, 1 fila por punto de `coordenadas[]`. Invertir orden de tupla a `(shape_pt_lon, shape_pt_lat)`. `shape_pt_sequence` incremental.
7. **Crear `frequencies.txt`**: 1 fila por trip con `headway_secs = lineas[frecuenciaPicoMin] * 60`, `start_time="04:00:00"`, `end_time="26:00:00"`, `exact_times=0`.
8. **Crear `calendar.txt`**: 1 fila con `service_id="todos"`, todos los días en `1`, `start_date`=hoy, `end_date`=hoy+60d.
9. **Crear `transfers.txt`**: para cada par de paradas que comparten ubicación física (o conexiones), emitir `transfer_type=0`.
10. **Crear `feed_info.txt`**: `feed_publisher_name`, `feed_publisher_url` (URL de FusaLabs), `feed_lang="es"`, `feed_version=version del JSON`, `feed_start_date`/`feed_end_date` matching calendar.
11. **Validar** con [gtfs-validator.mobilitydata.org](https://gtfs-validator.mobilitydata.org/) y resolver notices.

---

## 21. Referencias (todas fuentes primarias)

1. GTFS Schedule Reference — [gtfs.org/documentation/schedule/reference](https://gtfs.org/documentation/schedule/reference/)
2. GTFS Schedule Reference (mirror) — [old.gtfs.org/schedule/reference](https://old.gtfs.org/schedule/reference/)
3. Spec source — [github.com/google/transit/gtfs/spec/en/reference.md](https://github.com/google/transit/blob/master/gtfs/spec/en/reference.md)
4. Base features overview — [gtfs.org/getting-started/features/base](https://gtfs.org/getting-started/features/base/)
5. Base add-ons — [gtfs.org/getting-started/features/base-add-ons](https://gtfs.org/getting-started/features/base-add-ons/)
6. Create a GTFS dataset — [gtfs.org/getting-started/create](https://gtfs.org/getting-started/create/)
7. Example feed — [gtfs.org/getting-started/example-feed](https://gtfs.org/getting-started/example-feed/)
8. Best practices — [gtfs.org/documentation/schedule/schedule-best-practices](https://gtfs.org/documentation/schedule/schedule-best-practices/)
9. Pathways feature — [gtfs.org/getting-started/features/pathways](https://gtfs.org/getting-started/features/pathways/)
10. Frequencies example — [gtfs.org/documentation/schedule/examples/frequencies](https://gtfs.org/documentation/schedule/examples/frequencies/)
11. Attributions example — [gtfs.org/documentation/schedule/examples/attributions](https://gtfs.org/documentation/schedule/examples/attributions/)
12. Feed info example — [gtfs.org/documentation/schedule/examples/feed-info](https://gtfs.org/documentation/schedule/examples/feed-info/)
13. Google Transit Schedule reference & differences — [developers.google.com/transit/gtfs/reference](https://developers.google.com/transit/gtfs/reference)
14. Google Transit testing tools — [developers.google.com/transit/gtfs/guides/tools](https://developers.google.com/transit/gtfs/guides/tools)
15. GTFS Realtime reference — [gtfs.org/documentation/realtime/reference](https://gtfs.org/documentation/realtime/reference/)
16. GTFS Realtime proto — [github.com/MobilityData/gtfs-realtime-bindings/blob/master/gtfs-realtime.proto](https://github.com/MobilityData/gtfs-realtime-bindings/blob/master/gtfs-realtime.proto)
17. GTFS Realtime spec source — [github.com/google/transit/gtfs-realtime/spec/en/reference.md](https://github.com/google/transit/blob/master/gtfs-realtime/spec/en/reference.md)
18. MobilityData/gtfs-validator — [github.com/MobilityData/gtfs-validator](https://github.com/MobilityData/gtfs-validator)
19. Validation rules — [gtfs-validator.mobilitydata.org/rules.html](https://gtfs-validator.mobilitydata.org/rules.html)
20. Validator architecture — [github.com/MobilityData/gtfs-validator/blob/master/docs/ARCHITECTURE.md](https://github.com/MobilityData/gtfs-validator/blob/master/docs/ARCHITECTURE.md)
21. Conveyal gtfs-lib — [github.com/conveyal/gtfs-lib](https://github.com/conveyal/gtfs-lib)
22. OneBusAway gtfs-modules — [developer.onebusaway.org/projects/onebusaway-gtfs-modules](https://developer.onebusaway.org/projects/onebusaway-gtfs-modules)
23. GeoJSON → GTFS — [npmjs.com/package/geojson-to-gtfs](https://www.npmjs.com/package/geojson-to-gtfs)
24. GTFS → GeoJSON — [github.com/BlinkTagInc/gtfs-to-geojson](https://github.com/BlinkTagInc/gtfs-to-geojson)
25. node-gtfs — [github.com/BlinkTagInc/node-gtfs](https://github.com/BlinkTagInc/node-gtfs)