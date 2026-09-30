# Resumen de Correcciones y Mejoras — Ramas `feat/fase2-clean` y `feat/fase3-clean`

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
* **Rama `feat/fase2-clean`:** Creada y preservada como checkpoint estable histórico en el commit `6272686` (`origin/feat/fase2-clean`), desplegada en paralelo en el puerto `3001` con árbol hardlinkeado de `node_modules` para evitar panics de Turbopack.
* **Rama `feat/fase3-clean`:** Rama de desarrollo activa (`origin/feat/fase3-clean`), desplegada en el puerto `3000` accesible desde LAN en `http://192.168.2.2:3000/inicio`.
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

### Toast de Estado de Viaje (`ArrivalStatusCard`):
* **Forma y tamaño 100% idénticos a las cápsulas:** Reciclada la anatomía de las cápsulas (`rounded-full px-3 py-1.5`, contenedor `max-w-md mx-auto`, ícono `w-5`, botón de cierre `×` a la derecha y espaciador `w-8` para alinearse con los botones laterales).
* **Colores dinámicos:**
  * Al aproximarse a la parada (`ARRIBANDO`): Cápsula en **ámbar cálido** (`bg-amber-500 border-amber-400 text-white`) con ícono de colectivo animado.
  * Al iniciar viaje (`VIAJE INICIADO`): Cápsula en **verde esmeralda** (`bg-emerald-600 border-emerald-500 text-white`) con ícono `CheckCircle2`.
* Contador ininterrumpido de 10 segundos continuos.

### Cartografía y Renderizado de Trazas (`MapCanvas`):
* **Erradicación de contornos blancos (casing):** Capa `route-casing` y `trip-seg-casing` fijadas con opacidad 0. Todas las líneas del mapa son líneas limpias y sólidas sin rebordes blancos.
* **Erradicación del color rojo en la Línea 65:** Suprimido el switch que pintaba de rojo (`#EF4444`) a los colectivos de vuelta. Todos los coches y badges de la Línea 65 son celestes oficiales (`#0EA5E9`).
* **Traza azul opaco previa (`tripRouteShade`):** Derivación matemática universal con `shadeHex(shade.color, -0.42)` que genera un tono azul petróleo elegante para el tramo previo sin colores fijos.
* **Supresión de la línea general en Modo Viaje:** En Modo Viaje se fuerza `effectiveHighlightLines = []` para que nunca se dibuje la traza general de 38 km desde Constitución hasta Barrancas, mostrando exclusivamente la traza de viaje `tripSegments`.

### Convoy de 3 Coches y Flujo Continuo:
* **Renderizado estricto del convoy:** En Modo Viaje solo se muestran las 3 unidades de `boardingOptions` (ej. 62, 58, 55).
* **Inmediatez de demo:** El Coche 62 arranca a ~240m (~50s) de Parque Centenario.
* **Eliminado el reseteo artificial a 2 paradas (`RIDING_STOPS = 2`):** El viaje continúa sin loops falsos hasta que el usuario sale manualmente con la `X`.
* **Botón `Iniciar viaje`:** Renombrado desde "Subirme al próximo" en el timeline de la parada de origen.
* **Cámara de coche en alternativas:** Distancia calibrada a ~100-110 metros (`zoom: 17.1`, `pitch: 52°`), ofreciendo un encuadre amplio y cómodo de la calle.

### Interacción y Máquina de Estados de la Rosa (`BottomNav`):
* **Erradicado el contorno naranja:** Aplicadas clases `outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none [-webkit-tap-highlight-color:transparent]`.
* **Blindaje contra recargas:** `event.preventDefault()` incondicional en `/mapas` y eliminación de la trampa del doble tap.
* **Máquina de estados:**
  * Si la cámara se descoloca por arrastre manual: un tap recentra al coche/parada.
  * Si está siguiendo al coche: un tap se eleva a Panorama 2D ceñido entre Parque Centenario y Barrancas (`minZoom: 13.85`).
  * Si está en Panorama 2D: un tap vuelve a bajar a 3D detrás del coche.

---

## 5. Tareas Pendientes (Backlog Inmediato)

Las siguientes tareas fueron identificadas para su resolución prioritaria:

1. **Tarea Pendiente 1 — Lógica del botón "Invertir origen y destino":**  
   * **Ubicación:** Botón circular con ícono `ArrowUpDown`, situado en la sección superior de `/mapas` en la columna lateral de acciones, justo al lado de la cápsula de origen.
   * **Objetivo:** Corregir y completar la lógica de inversión para que al tocarlo se intercambien los puntos de origen y destino del viaje, recalculando automáticamente la ruta, el sentido de circulación (ida/vuelta), las paradas de referencia y la reasignación de flota correspondiente sin romper el estado activo de navegación.

2. **Tarea Pendiente 2 — Lógica completa de la pestaña "Líneas":**  
   * **Ubicación:** Pestaña "Líneas" situada en la `BottomNav` (a la izquierda de la Rosa central).
   * **Objetivo:** Corregir integralmente la lógica de apertura, filtrado por línea/ramal, sincronización con el mapa, selección de unidades y cierre del selector de líneas, asegurando que su interacción sea predecible, no interfiera con el Modo Viaje y permita explorar cualquier línea del catálogo sin desconfigurar la aplicación.
