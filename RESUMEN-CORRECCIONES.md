# RESUMEN HISTÓRICO Y REGISTRO DE CORRECCIONES ARQUITECTÓNICAS (FASES 1 A 5)

Este documento consolida todas las mejoras, decisiones de diseño, erradicación de código espagueti y componentes modulares implementados en el proyecto, unificados de forma definitiva en la rama principal de trabajo **`feat/fase2-clean`**.

---

## 1. Fase 1 y 2 — Estabilización de Navegación y UI Base

### Modificaciones en BottomNav y Modos de Pantalla:
* **Colapso dinámico en Modo Viaje:** Cuando `isTripMode === true`, la barra inferior `BottomNav` transiciona su ancho de `max-w-[340px]` a `w-[64px]`, oculta por completo las pestañas laterales ("Líneas" e "Inicio") y se transforma en un botón flotante circular (FAB) centrado que aloja exclusivamente la **Metropol Rose**.
* **Reaparición en Modo Exploratorio:** Al tocar la `X` y salir del viaje, la barra inferior se expande con animación suave y reaparecen los botones de "Líneas" e "Inicio".
* **Erradicación del botón Swap en Modo Viaje:** En `ViajeHeader.tsx` se eliminó el botón de inversión de cabeceras (`ArrowUpDown`) durante la navegación activa, fijando el botón de cierre `X` en una cápsula centrada y accesible (`w-9 h-9`).

### Alertas de Tránsito Oficiales:
* Se agregaron 3 alertas activas con demoras en Panamericana (Línea 194), Av. Díaz Vélez (Línea 65) y peaje Zárate.
* En `/inicio` se renderizan todas las alertas activas con visualización clara y responsive.

---

## 2. Fase 3 — Calibración de Telemetría y Convoy Continuo

### Convoy de 3 Coches y Flujo Continuo:
* **Renderizado estricto del convoy:** En Modo Viaje solo se muestran las 3 unidades de `boardingOptions` (ej. 62, 58, 55).
* **Inmediatez de demo:** El Coche 62 arranca a ~240m (~50s) de Parque Centenario.
* **Eliminado el reseteo artificial a 2 paradas (`RIDING_STOPS = 2`):** El viaje continúa sin loops falsos hasta que el usuario sale manualmente con la `X`.
* **Botón `Iniciar viaje`:** Renombrado desde "Subirme al próximo" en el timeline de la parada de origen.
* **Cámara de coche en alternativas:** Distancia calibrada a ~100-110 metros (`zoom: 17.1`, `pitch: 52°`), ofreciendo un encuadre amplio y cómodo de la calle.
* **Encuadre estricto de inicio a fin en 2D:** Helper `getTripStartEndBounds` con `minZoom: 13.85` que encuadra exclusivamente Parque Centenario abajo y Barrancas de Belgrano arriba al presionar la Rosa.

---

## 3. Fase 4 — Diagrama de Hilo en Vivo (`LiveLineDiagram`) y Limpieza Cartográfica

### Pestaña "Líneas" en Modo Exploratorio — Live Line Diagram Oficial:
* **Erradicación del texto genérico y de la subpestaña Alertas:** Eliminado "Red La Nueva Metropol" y la pestaña redundante de alertas.
* **Chips de Troncal Puros `[65]` y `[194]`:** En la parte superior erradicada cualquier mención a "línea 65" o "línea 194". Solo existen chips circulares con el número puro (`65` celeste y `194` verde).
* **Chips Circulares con Letras de Ramal (Línea 194):** 
  * Se exponen los 8 ramales oficiales existentes (`[A]`, `[B]`, `[D]`, `[E]`, `[F]`, `[G]`, `[H]`, `[I]`) en un selector horizontal táctil con scroll suave.
  * **Veracidad telemática estricta:** Al elegir un ramal, la arteria vertical muestra **exclusivamente las paradas oficiales de ese ramal específico** y **los colectivos asignados a esa flota** (serie 100 para Zárate, serie 300 para Escobar, etc.), evitando que aparezcan paradas por donde el coche no circula.
* **Minimización Automática al 20%:** Al abrir el panel o seleccionar cualquier troncal/ramal, el modal se minimiza automáticamente a menos del 20% de la pantalla (dejando más del 80% libre para la cartografía y el convoy).
* **Control de Expansión/Colapso con Chevron:** Botón y grip interactivo que permite desplegar el recorrido completo de paradas o replegarlo a demanda con transición fluida.
* **Conmutador de Sentido con Destino Dinámico:** Botón compacto con icono `ArrowLeftRight` que conmuta fluidamente entre **`Hacia Barrancas de Belgrano`** y **`Hacia Plaza Constitución`**.
* **Distribución Simétrica de Flota (50/50):** 
  * Sentido Ida: se proyectan los 12 colectivos de ida.
  * Sentido Vuelta: se proyectan los 12 colectivos de vuelta.

### Cartografía y Renderizado de Trazas (`MapCanvas`) — Erradicación Total de Efectos Bloom y Parpadeos:
* **Eliminación Definitiva del Efecto Bloom y Resplandores:** Se eliminaron de raíz del código las capas `route-halo-a` y `route-halo-b` que ejecutaban un bucle de animación con `line-blur` (6px a 10px) y pulsos de senos/cosenos.
* **Eliminación de Capas de Flujo y Contornos Parpadeantes:** Se suprimieron permanentemente `route-flow-head`, `route-flow-tail`, `route-casing`, `trip-seg-pulse` y `trip-seg-casing`.
* **Trazas 100% Lisas, Nítidas y Continuas:** Tanto en Modo Exploratorio (`route-line`) como en Modo Viaje (`trip-seg-line`), las trazas son líneas vectoriales puras, continuas y sólidas (`line-opacity: 1.0`) con bordes redondeados (`line-join: round`, `line-cap: round`), sin ningún tipo de brillo, contorno ajeno o parpadeo.
* **Optimización de Rendimiento:** Al erradicar los loops de animación `pulseFrame` y los cálculos periódicos de `line-dasharray`, se liberaron ciclos continuos de GPU y CPU.

---

## 4. Fase 5 — Rediseño del Buscador Exploratorio (`ExploreSearchSheet`)

### Erradicación del "Falso Buscador" de Exploración:
* Anteriormente, la barra superior con el texto *"¿A dónde vas?"* funcionaba únicamente como un botón rígido que forzaba el inicio del viaje hacia Barrancas de Belgrano de forma abrupta.
* Se transformó en un **Buscador Exploratorio Interactivo y Modular** (`ExploreSearchSheet.tsx`), basado en los patrones estándar de **Transit App, Citymapper y Moovit**, adaptado a la escala de la maqueta sin sobrecargar con APIs de geocodificación pesadas.

### Características del Nuevo `ExploreSearchSheet`:
1. **Atajos Frecuentes de 1 Tap:**
   * `[Casa]`: Barrancas de Belgrano
   * `[Trabajo]`: Plaza Constitución
   * `[Origen Demo]`: Parque Centenario
   * Al tocar cualquiera de ellos, se define inmediatamente como destino manteniendo la ubicación del usuario como origen y lanzando la navegación fluida.
2. **Terminales y Puntos Clave de la Red Metropol:**
   * Lista directa con accesos a: *Barrancas de Belgrano*, *Plaza Constitución*, *Centro de Transferencia Zárate*, *Estación Escobar*, *Plaza Once* y *Plaza Italia*.
3. **Búsqueda Reactiva Multimodal (Líneas, Paradas y Destinos):**
   * Mientras el usuario escribe:
     * Si escribe *"65"* o *"194"*: sugiere ver el recorrido completo en el *Live Line Diagram*.
     * Si escribe el nombre de una calle/parada (*"Díaz Vélez"*, *"Campana"*): filtra las paradas de la red para enfocarlas en el mapa.
     * Si escribe un destino (*"Zárate"*, *"Once"*): ofrece viajar directamente a esa cabecera.
4. **Historial Reciente de Maqueta:**
   * Sugiere el trayecto recurrente (*Parque Centenario ➔ Barrancas de Belgrano*) en un solo toque.
5. **Arquitectura y Limpieza:**
   * Cero código espagueti: componente 100% aislado con TypeScript estricto.
   * Cero cascading renders y cero variables huérfanas.

---

## 5. Unificación Definitiva y Limpieza de Ramas Git

* **Absorción Completa en `feat/fase2-clean`:** Todas las implementaciones de las Fases 3, 4 y 5 fueron mergeadas mediante fast-forward idéntico dentro de **`feat/fase2-clean`**.
* **Erradicación de Ramas Temporales:**
  * Eliminada `feat/fase3-clean` (local y remota).
  * Eliminada `feat/fase4-clean` (local y remota).
  * Eliminada `feat/fase5-clean` (local y remota).
* **Paridad Absoluta:** La rama activa **`feat/fase2-clean`** contiene el 100% del código estable, compila con 0 errores de TypeScript (`npx tsc --noEmit`) y pasa el build de producción optimizado (`npm run build`).
