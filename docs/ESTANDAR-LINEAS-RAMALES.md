# Estándar de Modelado e Ingesta de Líneas y Ramales (v2.1)
## Guía de Arquitectura de Datos, Calibración de Paradas (0.0m Error), Polaridad Operativa y Pipeline de Integración

---

## 1. Filosofía y Fundamentos de Arquitectura (Concepts > Code)

El transporte público del AMBA (Área Metropolitana de Buenos Aires) **no puede representarse con un modelo plano**. Tratar a una línea de colectivo como un simple array de coordenadas `[lng, lat][]` es un error de diseño fundamental por las siguientes realidades operativas, legales y físicas:

1. **Jerarquía Dimensional:** Una **Línea** (concesión provincial o nacional, ej. Línea 194 o Línea 65) no recorre un único camino. Se ramifica en múltiples **Ramales** (sub-líneas operativas con código propio, ej. *Ramal A Común*, *Ramal D Expreso*, *Ramal E Reconvertido*), y cada ramal posee variantes de **Sentido** (*Ida* y *Vuelta*) con itinerarios de calles asimétricos debido al sentido de circulación urbano.
2. **Desacoplamiento Espacial de Paradas (Relación N:M):** Los refugios y postes de parada existen físicamente en la calle de manera independiente a las líneas que los usan. Por ejemplo, en los carriles centrales del Metrobus Cabildo o Maipú, una misma dársena física alberga paradas de la Línea 65, Línea 194, Línea 60, Línea 152, etc. Si duplicáramos las paradas dentro de cada ruta, romperíamos la integridad relacional, el cálculo de transbordos intermodales y la consistencia de coordenadas.
3. **Calibración al Eje de Calzada (Error 0.0m):** Para que los algoritmos de proyección cinemática (`alongM`), seguimiento de flota (`route-progress`) y renderizado GPU 60fps en MapLibre funcionen sin saltos visuales ni colectivos "flotando en techos de casas", la coordenada `[lng, lat]` de cada parada debe estar matemáticamente proyectada sobre el vector de la polilínea vial con desvío ortogonal cero.
4. **Polaridad Operativa y Sentido Comercial (Norte ➔ Sur vs. Sur ➔ Norte):**  
   En líneas de media y larga distancia del AMBA (como la 194 hacia Escobar, Campana y Zárate), **la cabecera operativa y los talleres principales se encuentran en Provincia (Norte)**. Los servicios rápidos y expresos nacieron comercialmente para el flujo laboral matutino de hora pico (**Zárate/Escobar ➔ Capital Federal, de Norte a Sur**). **Nunca se debe forzar ciegamente que todos los ramales salgan de Capital**: la dirección de las polilíneas debe reflejar fielmente la polaridad del KML oficial y los cuadros de horarios de la CNRT para que los colectivos y flechas circulen en el sentido correcto.
5. **Geometría Compartida vs. Régimen de Paradas (La trampa del KML plano):**  
   Dos ramales pueden circular físicamente por la misma autopista (ej. RN 9 Panamericana), pero pertenecer a **categorías regulatorias totalmente distintas**:
   * **Servicio Expreso Tradicional (ej. Ramal D):** Para en los puentes y cruces de autopista (Márquez, Ruta 202, Ruta 197, Ford, Maschwitz, etc.) según su seccionado tarifario (12 paradas).
   * **Servicio Expreso Reconvertido / ex-Diferencial (ej. Ramal E, Res. ST N° 27/2012):** Posee **Régimen de Máxima Restricción de Paradas**; la CNRT le prohíbe parar en cruces intermedios de autopista y solo realiza paradas directas punto a punto (Once, Saavedra, Escobar, Campana, Zárate: 5 paradas).  
   *Regla:* **La geometría no define el servicio; el Seccionado Oficial de la CNRT define las paradas.**

---

## 2. Esquema Oficial de `routes.json` (v2.1)

El archivo `src/data/routes.json` es la **Única Fuente de la Verdad (SSOT)** cartográfica y operativa del sistema.

### Estructura de Raíz

```json
{
  "version": "2.1.0",
  "updatedAt": "2026-09-11T19:30:00.000Z",
  "descripcion": "Dataset Maestro de Red de Transporte AMBA - Líneas, Ramales, Recorridos y Paradas Calibradas al Eje de Calzada con Bicromía Direccional",
  "paradas": {
    "<stop-id>": { ... }
  },
  "lineas": [
    { ... }
  ]
}
```

---

### 2.1. Diccionario Normalizado de Paradas (`paradas`)

Mapa indexado por clave alfanumérica única (`Record<string, ParadaDefinition>`).

```json
"paradas": {
  "stop-194-zarate-transferencia": {
    "id": "stop-194-zarate-transferencia",
    "nombre": "Centro de Transferencia de Zárate",
    "direccion": "Av. Anta y De la Torre, Zárate",
    "lat": -34.097175,
    "lng": -59.037046,
    "conexiones": {
      "tren": ["Mitre (Victoria - Capilla / Zárate)"],
      "metrobus": false
    }
  },
  "stop-194-puente-saavedra": {
    "id": "stop-194-puente-saavedra",
    "nombre": "Puente Saavedra",
    "direccion": "Av. Cabildo y Av. General Paz",
    "lat": -34.538691,
    "lng": -58.474660,
    "conexiones": {
      "metrobus": true,
      "subte": []
    }
  }
}
```

---

### 2.2. Definición de Ramales y Bicromía Direccional

Dentro de cada línea, los ramales definen tanto la identidad de la variante como los colores direccionales por recorrido:

```json
{
  "id": "ramal-194-b",
  "codigo": "B",
  "nombre": "Once ⇄ Escobar (Común x Boulogne)",
  "cabeceraOrigen": "Plaza Miserere (Once)",
  "cabeceraDestino": "Terminal de Escobar",
  "color": "#A855F7",
  "textColor": "#FFFFFF",
  "recorridos": [
    {
      "id": "line-194-b-ida",
      "sentido": "ida",
      "origen": "Plaza Miserere (Once)",
      "destino": "Terminal de Escobar",
      "descripcion": "Sentido Norte por Av. Santa Fe, Cabildo y Boulogne",
      "distanciaKm": 54.2,
      "color": "#9333EA",
      "paradas": [ "stop-194-once", "...", "stop-194-escobar-estacion" ],
      "coordenadas": [ [-58.407392, -34.611364], ... ]
    },
    {
      "id": "line-194-b-vuelta",
      "sentido": "vuelta",
      "origen": "Terminal de Escobar",
      "destino": "Plaza Miserere (Once)",
      "descripcion": "Sentido Sur hacia Once por Colectora y Av. Cabildo",
      "distanciaKm": 54.8,
      "color": "#EA580C",
      "paradas": [ "stop-194-escobar-estacion", "...", "stop-194-once" ],
      "coordenadas": [ [-58.795759, -34.350204], ... ]
    }
  ]
}
```

---

## 3. Protocolo de Ingesta: Los 4 Pilares de la "Biblia Oficial"

Al incorporar una nueva línea a partir de su documentación técnica oficial en `docs/lineas/<numero>/`, se deben cruzar rigurosamente las siguientes fuentes primarias:

```
                  ┌────────────────────────────────────────┐
                  │ 1. Vector KML / GeoJSON Oficial        │
                  │    - Trazas geográficas viales         │
                  │    - Polaridad de origen/destino real  │
                  └───────────────────┬────────────────────┘
                                      │
 ┌──────────────────────────────────┐ │ ┌──────────────────────────────────┐
 │ 2. Cuadro Tarifario (T<linea>)   │ │ │ 3. Resolución Legal (<linea>.pdf)│
 │    - Secciones tarifarias (km)   ├─┼─┤    - Itinerario de calles y avs. │
 │    - Kilometrajes oficiales CNRT │ │ │    - Restricción de paradas      │
 └──────────────────────────────────┘ │ └──────────────────────────────────┘
                                      │
                  ┌───────────────────┴────────────────────┐
                  │ 4. Horarios y Frecuencias (Hi<linea>)  │
                  │    - Frecuencias pico y valle          │
                  │    - Seccionados autorizados por ramal │
                  │    - Parque móvil asignado             │
                  └───────────────────┬────────────────────┘
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 5. Snapping Ortogonal + Offset Calzada │
                  │    (Error 0.0m & Anti Z-Fighting)      │
                  └───────────────────┬────────────────────┘
                                      ▼
                  ┌────────────────────────────────────────┐
                  │           routes.json (v2.1)           │
                  └────────────────────────────────────────┘
```

### Reglas Críticas de Extracción:

1. **Validación de Paradas por Seccionado Oficial (Pilar 4):**
   * Buscar en `Hi<linea>.pdf` la sección **"SECCIONADOS TARIFARIOS"** de cada ramal.
   * El seccionado indica taxativamente **en qué intersecciones puede parar el colectivo**.
   * Si un servicio dice *"Con Restricción de Paradas"* (como el Ramal E de la 194), **NO colocar las paradas intermedias de autopista**; solo incluir las cabeceras autorizadas.
2. **Determinación de Polaridad Geográfica (Pilar 1 y 4):**
   * Verificar el título de la capa en el KML y las tablas de horario: ej. si dice `D - Zarate Once Ida EXPRESO`, el sentido de ida es **Zárate ➔ Once (Norte a Sur)**. 
   * La primera coordenada debe ser la terminal de Zárate y la última la de Once.
3. **Bicromía Direccional Obligatoria (Pilar 1):**
   * **Nunca utilizar colores vecinos de la misma gama para Ida y Vuelta** (ej. dos tonos de violeta).
   * **Ida**: Color de identidad del ramal (Cyan, Púrpura, Azul, Verde).
   * **Vuelta**: Color complementario de alto contraste. Se establece **`#EA580C` (Naranja Intenso)** como color estándar de retorno para el sistema AMBA, o un tono contrastado a $\ge 120^\circ$ en el círculo cromático.

---

## 4. Renderizado Cartográfico y Solución de Z-Fighting (MapLibre GL)

### 4.1. Calibración al Eje de Calzada (Snapping 0.0m)
Toda parada se proyecta ortogonalmente sobre el segmento más cercano de la polilínea:
$$t = \text{clamp}\left(\frac{(P - C_i) \cdot (C_{i+1} - C_i)}{\|C_{i+1} - C_i\|^2}, 0, 1\right)$$
$$P_{\text{snapped}} = C_i + t \cdot (C_{i+1} - C_i)$$
Desvío resultante: exactamente **0.000 metros**.

### 4.2. Desplazamiento `line-offset` por Sentido de Circulación
Cuando un ramal bidireccional (como el Ramal B o Ramal A) corre por la misma avenida o autopista, la traza de vuelta tapa a la de ida en el buffer WebGL si ambas comparten coordenadas centrales. 

Para resolverlo, en `MapCanvas.tsx` se aplica un `line-offset` positivo dinámico interpolado por nivel de zoom:
```ts
'line-offset': [
  'interpolate', ['linear'], ['zoom'],
  10, ['match', ['get', 'direction'], 'ida', 1.2, 'vuelta', 1.2, 0],
  14, ['match', ['get', 'direction'], 'ida', 2.2, 'vuelta', 2.2, 0],
  18, ['match', ['get', 'direction'], 'ida', 3.8, 'vuelta', 3.8, 0]
]
```
> **Principio Vial:** En Argentina se conduce por el carril derecho. Al aplicar un offset positivo a vectores que viajan en sentidos opuestos, la traza de Ida se desplaza a su derecha y la de Vuelta a su derecha, renderizándose en **dos líneas paralelas impecables sin solapamiento**.

---

## 5. Estándar de Nomenclatura en UI Shell (Badges y Selector)

Para evitar que múltiples ramales con la misma cabecera colapsen en etiquetas ambiguas (como el problema de que todos decían `"Zárate"` o `"Escobar"`), se adopta la siguiente convención estricta:

1. **Selector Plegado:** Muestra únicamente la **Letra** del ramal en un badge circular de 28px con el color del servicio (ej. `[ A ]`, `[ B ]`, `[ D ]`).
2. **Selector Desplegado / Seleccionado:** Muestra la píldora expandida con la estructura:
   $$\text{[Letra]}\quad \text{Origen}\ [\rightleftarrows\ |\ \rightarrow]\ \text{Destino}\ (\text{Modalidad})$$
   * **Bidireccionales:** `Once ⇄ Zárate (Común)` / `Once ⇄ Escobar (Común)`
   * **Unidireccionales Expresos:** `Zárate ➔ Once (Expreso)` / `Zárate ➔ Once (Reconv. E)` / `Escobar ➔ Pza. Italia` / `Zárate ➔ Retiro (Dif.)`
3. **Panel Inferior (BottomSheetPanel):** Muestra el nombre completo institucional: ej. `Línea 194 · Ramal D · Zárate ➔ Once (Expreso RN 9)`.

---

## 6. Mapeo de Flota GPS en Vivo por Serie Numérica (`live.ts`)

En la simulación en tiempo real, las unidades activas deben asociarse al ramal correcto según los rangos de internos tradicionales de la empresa:

```typescript
export function getRamalForUnit(lineId: string, unitId: string): string {
  if (lineId === 'line-65') return 'ramal-65-troncal';
  if (lineId === 'line-194') {
    const num = parseInt(unitId, 10);
    if (num >= 100 && num < 200) return 'ramal-194-a'; // Común Zárate
    if (num >= 200 && num < 300) return 'ramal-194-h'; // Expreso Escobar
    if (num >= 300 && num < 400) return 'ramal-194-b'; // Común Escobar
    if (num >= 400 && num < 450) return 'ramal-194-d'; // Expreso Zárate RN 9
    if (num >= 450 && num < 470) return 'ramal-194-e'; // Reconvertido E
    if (num >= 470 && num < 500) return 'ramal-194-g'; // Reconvertido G
    if (num >= 500 && num < 600) return 'ramal-194-f'; // Plaza Italia
    if (num >= 600 && num < 700) return 'ramal-194-i'; // Retiro Diferencial
    return 'ramal-194-h';
  }
  return '';
}
```
Esto garantiza que cada colectivo avance físicamente sobre la polilínea y paradas que le corresponden por contrato.

---

## 7. Protocolo de Calidad y Criterios de Aceptación (QA)

Antes de dar por aprobada una línea o ramal:
1. **Regla de Oro:** **Nunca ejecutar `npm run build` o `next build`**. Validar únicamente con `npx tsc --noEmit`.
2. **Cero Coordenadas Invertidas:** GeoJSON exige estrictamente `[longitud, latitud]` con longitud negativa $\sim -58$ y latitud $\sim -34$.
3. **Cero Paradas Huérfanas:** Cada ID listado en `recorridos[].paradas` debe existir en el objeto raíz `paradas`.
4. **Verificación de Sentido:** Confirmar que el primer punto de coordenadas coincida con la cabecera origen y el último con la de destino.
5. **Verificación de Contraste:** En ramales bidireccionales, corroborar visualmente que Ida y Vuelta posean colores contrastados y separación paralela con `line-offset`.
