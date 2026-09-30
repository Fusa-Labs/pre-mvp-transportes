# Resumen de Correcciones y Mejoras — Ramas `feat/fase2-clean` y `feat/fase4-clean`

Documento consolidado de todas las correcciones, refactorizaciones y mejoras de experiencia de usuario aplicadas a la demo interactiva de transporte público (Líneas 65 y 194), a partir de la rama base del PR #5 (`adrian-fase2-A`).

---

## 1. Limpieza de Datos Ficticios (Línea 60)
* **Dataset oficial (`src/data/routes.json`):** Se eliminaron las 1086 líneas de coordenadas que clonaban el corredor de la Línea 65 bajo el identificador ficticio `line-60`.
* **Flota y simulación en vivo (`src/mock/data.ts`, `src/lib/mock/amba-data.ts`):**
  * Eliminadas las unidades sintéticas `701`, `703`, `705` y el color de ramal `#7C3AED`.
  * La flota en vivo inicial vuelve a ser exclusivamente la legítima: `[...vehiculos65, ...vehiculos194]`.
* **Harness de pruebas de ETA (`scripts/qa-eta-boarding.mts`):** Ajustadas las aserciones de paradas (`stop-65-05`, `stop-65-01`, `stop-65-09`) para esperar únicamente las llegadas reales de la Línea 65.
* **Motor de viaje (`trip-planner-service.spec.ts`):** Verificado el Caso 5, volviendo a entregar exactamente las 2 alternativas limpias sin duplicados ficticios.

---

## 2. Infraestructura y Ramas de Trabajo
* **Rama `feat/fase2-clean`:** Rama consolidada y estable desplegada en el puerto `3001` (`http://192.168.2.2:3001/inicio`).
* **Rama `feat/fase4-clean`:** Rama de desarrollo activa desplegada en el puerto `3000` (`http://192.168.2.2:3000/inicio`), sincronizada con GitHub (`origin/feat/fase4-clean`).
* **Soporte LAN móvil en Next.js (`next.config.ts`):** Configurado `allowedDevOrigins: ['192.168.2.2', '192.168.2.2:3000', '192.168.2.2:3001']` y mapeo por `netsh portproxy` en Windows.

---

## 3. Pantalla de Inicio (`/inicio`)

### Cabecera Superior Institucional (Bienvenida a la Red Metropol):
* Eliminados el saludo *"Hola "*, la fecha y el icono suelto de la rosa.
* **Texto de bienvenida:** Frase `"Bienvenido a la Red"` en tipografía delgada y estilizada (`font-normal`, `text-[21px]`).
* **Color adaptativo según el tema:**
  * Modo claro: azul marino institucional exacto (`text-[#1b2a51]`), idéntico al logo.
  * Modo oscuro: blanco puro (`dark:text-white`) con alto contraste sobre fondo negro.
* **Rosa oficial de Metropol:** Componente oficial `MetropolRose variant="full"` (`h-7.5 w-auto`) con pétalos rojos (`#E30613`) y tallo verde (`#228135`), idéntica a la rosa central de la barra inferior.
* **Wordmark "Logo Solo Metropol":** Importado desde Descargas de Windows (`logo solo metropol.png`), optimizado con variante blanca para fondo oscuro (`logo-solo-metropol-white.png`) con escala ampliada a `h-6.5`.

### Historial de Paradas (Aislamiento de la tarjeta piloto limpia):
* **Filtro estricto de tarjetas:** Ocultadas temporalmente las dos tarjetas de la Línea 194 y la tarjeta de la 65 desde Constitución.
* **Única tarjeta activa:** Queda visible **exclusivamente la primera tarjeta oficial de prueba**:  
  **`Línea 65 · Desde: Parque Centenario ➔ Hacia: Barrancas de Belgrano`**  
  Esto garantiza evaluar el flujo 100% pulido sin interferencia de datos secundarios.

### Sección Alertas:
* Agregadas **tres alertas de servicio activas** (2 para la Línea 194 y 1 para la Línea 65) con tarjetas apiladas similares:
  1. *Demora en la línea 194:* "Servicio con demoras por obras en el corredor Panamericana. Tiempos de espera más largos en ambos sentidos." (Hace 2hs).
  2. *Demora en la línea 65:* "Servicio con demoras de 10 a 15 min por congestión en Av. Díaz Vélez hacia Barrancas de Belgrano." (Hace 15min).
  3. *Demora en ramales Zárate y Campana (Línea 194):* "Tránsito lento en peaje Zárate por reducción de calzada. Tiempos de espera más largos en ambos sentidos." (Hace 45min).

---

## 4. Modo Viaje y Experiencia de Navegación (`/mapas`)

### Cápsulas Superiores Gemelas (`ViajeHeader`):
* **Íconos de ubicación con marcas cardinales:** Reemplazados los viejos pins por el ícono **`Crosshair`** (con sus marcas de Norte, Sur, Este y Oeste, idéntico al del cartel de fijar origen en el mapa).
* **Color blanco unificado:** Ambos íconos son blancos puros (`dark:text-white`), erradicando el color verde del origen.
* **Erradicación del botón Swap (`ArrowUpDown`) en Modo Viaje:** En Modo Viaje activo, el botón de invertir origen/destino **no existe en el DOM**, evitando desfasajes de cámara y saltos hacia Constitución. A la derecha solo queda el botón circular **`X` (Salir de Modo Viaje)** centrado en altura (`w-9 h-9`).

### Barra Inferior (`BottomNav`) — Comportamiento Dinámico y Modo Viaje Limpio:
* **Ocultamiento de botones laterales en Modo Viaje:** Cuando `isTripMode` es `true`, los botones de **"Líneas"** e **"Inicio"** se ocultan completamente y el contenedor se transforma en un botón flotante circular centrado.
* **Exclusividad de la Rosa:** Durante el viaje activo, el **único control visible en la parte inferior es la Rosa central de Metropol**, maximizando la visibilidad del mapa y permitiendo alternar cómodamente entre 3D y 2D Panorama.
* **Erradicación del bug de apertura fantasma:** Al no estar el botón en el DOM, no se encolan aperturas de menús. Además, `handleCloseTripMode` y `handleOpenTripMode` resetean incondicionalmente `isLineMenuOpen` a `false`.
* **Reaparición en Modo Exploratorio:** Al tocar la `X` y salir del viaje, la barra inferior se expande con animación suave y reaparecen los botones de "Líneas" e "Inicio".

### Pestaña "Líneas" en Modo Exploratorio — Live Line Diagram Oficial:
* **Erradicación del texto genérico y de la subpestaña Alertas:** Eliminado "Red La Nueva Metropol" y la pestaña redundante de alertas.
* **Selector Integrado de Línea:** Pastillas oficiales compactas `[Línea 65]` (celeste) y `[Línea 194]` (verde) dentro de la cabecera del panel.
* **Conmutador de Sentido con Destino Dinámico:** Botón compacto con icono `ArrowLeftRight` que conmuta fluidamente entre **`Hacia Barrancas de Belgrano`** y **`Hacia Plaza Constitución`**.
* **Distribución Simétrica de Flota (50/50):** 
  * En sentido Ida (`Hacia Barrancas`): se muestran y proyectan en tiempo real los 12 colectivos de ida (unidades 18, 20, 25, 28, 34, 39, 42, 45, 48, 51, 55, 58).
  * En sentido Vuelta (`Hacia Constitución`): se muestran y proyectan los 12 colectivos de vuelta (unidades 62, 65, 71, 74, 78, 82, 85, 89, 92, 95, 98, 101).
* **Arteria Vertical Continua (Live Stringline Diagram):**
  * Una línea vertical continua del color de la línea que une secuencialmente todas las paradas oficiales del sentido activo.
  * Los colectivos en vivo aparecen intercalados en su posición kilométrica relativa exacta (`alongM`) entre parada y parada con pastillas táctiles (`[🚌 Int. X · Y km/h]`).
  * A medida que los colectivos avanzan por telemetría a 1 Hz, se desplazan visualmente en la línea vertical cruzando cada parada en vivo.
  * Al presionar cualquier parada, la cámara vuela a ella en el mapa; al presionar un coche, la cámara lo enfoca y lo sigue en tiempo real.

### Toast de Estado de Viaje (`ArrivalStatusCard`):
* **Forma y tamaño 100% idénticos a las cápsulas:** Reciclada la anatomía de las cápsulas (`rounded-full px-3 py-1.5`, contenedor `max-w-md mx-auto`, ícono `w-5`, botón de cierre `×` a la derecha y espaciador `w-8` para alinearse con los botones laterales).
* **Colores dinámicos:**
  * Al aproximarse a la parada (`ARRIBANDO`): Cápsula en **ámbar cálido** (`bg-amber-500 border-amber-400 text-white`) con ícono de colectivo animado.
  * Al iniciar viaje (`VIAJE INICIADO`): Cápsula en **verde esmeralda** (`bg-emerald-600 border-emerald-500 text-white`) con ícono `CheckCircle2`.
* Contador ininterrumpido de 10 segundos continuos.

### Cartografía y Renderizado de Trazas (`MapCanvas`) — Erradicación Total de Efectos Bloom, Halos y Parpadeos:
* **Eliminación Definitiva del Efecto Bloom y Resplandores:** Se eliminaron de raíz del código las capas `route-halo-a` y `route-halo-b` que ejecutaban un bucle de animación con `line-blur` (6px a 10px) y pulsos de senos/cosenos.
* **Eliminación de Capas de Flujo y Contornos Parpadeantes:** Se suprimieron permanentemente `route-flow-head`, `route-flow-tail`, `route-casing`, `trip-seg-pulse` y `trip-seg-casing`.
* **Trazas 100% Lisas, Nítidas y Continuas:** Tanto en Modo Exploratorio (`route-line`) como en Modo Viaje (`trip-seg-line`), las trazas son líneas vectoriales puras, continuas y sólidas (`line-opacity: 1.0`) con bordes redondeados (`line-join: round`, `line-cap: round`), sin ningún tipo de brillo, contorno ajeno o parpadeo.
* **Optimización de Rendimiento:** Al erradicar los loops de animación `pulseFrame` y los cálculos periódicos de `line-dasharray`, se liberaron ciclos continuos de GPU y CPU.
* **Erradicación del color rojo en la Línea 65:** Suprimido el switch que pintaba de rojo (`#EF4444`) a los colectivos de vuelta. Todos los coches y badges de la Línea 65 son celestes oficiales (`#0EA5E9`).
* **Traza azul opaco previa (`tripRouteShade`):** Derivación matemática universal con `shadeHex(shade.color, -0.42)` que genera un tono azul petróleo elegante para el tramo previo sin colores fijos.
* **Supresión de la línea general en Modo Viaje:** En Modo Viaje se fuerza `effectiveHighlightLines = []` para que nunca se dibuje la traza general de 38 km desde Constitución hasta Barrancas, mostrando exclusivamente la traza de viaje `tripSegments`.

### Convoy de 3 Coches y Flujo Continuo:
* **Renderizado estricto del convoy:** En Modo Viaje solo se muestran las 3 unidades de `boardingOptions` (ej. 62, 58, 55).
* **Inmediatez de demo:** El Coche 62 arranca a ~240m (~50s) de Parque Centenario.
* **Eliminado el reseteo artificial a 2 paradas (`RIDING_STOPS = 2`):** El viaje continúa sin loops falsos hasta que el usuario sale manualmente con la `X`.
* **Botón `Iniciar viaje`:** Renombrado desde "Subirme al próximo" en el timeline de la parada de origen.
* **Cámara de coche en alternativas:** Distancia calibrada a ~100-110 metros (`zoom: 17.1`, `pitch: 52°`), ofreciendo un encuadre amplio y cómodo de la calle.
* **Encuadre estricto de inicio a fin en 2D:** Helper `getTripStartEndBounds` con `minZoom: 13.85` que encuadra exclusivamente Parque Centenario abajo y Barrancas de Belgrano arriba al presionar la Rosa.

---

## 5. Tareas Pendientes (Backlog Inmediato)

1. **Tarea Pendiente 1 — Lógica del botón "Invertir origen y destino" en Modo Exploratorio / Planificador:**  
   * Preservar y pulir la inversión de paradas exclusivamente en el flujo previo de búsqueda y planificación (antes de iniciar la navegación), recalculando las alternativas de ida y vuelta.

## 6. Fase 5 — Rediseño de la Búsqueda Exploratoria (`ExploreSearchSheet`)

### Erradicación del "Falso Buscador" de Exploración:
* Anteriormente, la barra superior con el texto *"¿A dónde vas?"* funcionaba únicamente como un botón rígido que forzaba el inicio del viaje hacia Barrancas de Belgrano de forma abrupta.
* Se transformó en un **Buscador Exploratorio Interactivo y Modular** (`ExploreSearchSheet.tsx`), basado en los patrones estándar de **Transit App, Citymapper y Moovit**, adaptado a la escala de la maqueta sin sobrecargar con APIs de geocodificación pesadas.

### Características del Nuevo `ExploreSearchSheet`:
1. **Atajos Frecuentes de 1 Tap:**
   * `[🏠 Casa]`: Barrancas de Belgrano
   * `[💼 Trabajo]`: Plaza Constitución
   * `[📍 Origen Demo]`: Parque Centenario
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
