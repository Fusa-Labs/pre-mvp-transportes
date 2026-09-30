# Resumen de Correcciones y Mejoras — Rama `feat/fase2-clean`

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

## 2. Infraestructura y Nueva Rama de Trabajo
* **Rama `feat/fase2-clean`:** Creada directamente desde el último commit de `adrian-fase2-A` y sincronizada en GitHub (`origin/feat/fase2-clean`).
* **Soporte LAN móvil en Next.js (`next.config.ts`):** Configurado `allowedDevOrigins: ['192.168.2.2', '192.168.2.2:3000']` para permitir la prueba fluida en celulares sobre la red Wi-Fi sin bloqueos de HMR ni fuentes.

---

## 3. Pantalla de Inicio (`/inicio`)

### Cabecera Superior Institucional (Bienvenida a la Red Metropol):
* Eliminados el saludo *"Hola 👋"*, la fecha y el icono suelto de la rosa.
* **Texto de bienvenida:** Frase `"Bienvenido a la Red"` en tipografía delgada y estilizada (`font-normal`, `text-[21px]`).
* **Color adaptativo según el tema:**
  * Modo claro: azul marino institucional exacto (`text-[#1b2a51]`), idéntico al logo.
  * Modo oscuro: blanco puro (`dark:text-white`) con alto contraste sobre fondo negro.
* **Rosa oficial de Metropol:** Componente oficial `MetropolRose variant="full"` (`h-7.5 w-auto`) con pétalos rojos (`#E30613`) y tallo verde (`#228135`), idéntica a la rosa central de la barra inferior.
* **Wordmark "Logo Solo Metropol":** Importado desde Descargas de Windows (`logo solo metropol.png`), recortado de padding transparente y optimizado con variante blanca para fondo oscuro (`logo-solo-metropol-white.png`) con escala ampliada a `h-6.5`.

### Historial de Paradas (Tarjetas compactas y ordenadas):
* **Columna izquierda:** Burbuja de línea oficial (`LineBadge`, 65 o 194).
* **Columna central:** Trayecto claro en dos líneas:
  * `Desde: [Parada de origen]`
  * `Hacia: [Parada de destino]`
* **Columna derecha (Badges apilados):**
  * Badge de arribo en vivo: `Llega en X min` / `En parada` con pulso verde.
  * Badge de retraso: `X min de retraso` con alerta ámbar titilante.
* Formato compacto (`px-3.5 py-2.5`, sin líneas divisorias internas innecesarias).
* **Hook modular de demoras (`src/hooks/use-intermittent-delay.ts`):** Simulación desacoplada que calcula y rota demoras entre 2 y 9 minutos de forma controlada cada 8 segundos, sin ensuciar la vista ni generar problemas de hidratación en React.

### Sección Alertas:
* Eliminados los botones *"Ver"* y *"Ver todas"*.
* Tarjeta 100% estática e informativa sin modales emergentes.
* Agregado badge informativo: `"Hace 2hs"`.

### Bottom Navigation Bar:
* Eliminada la animación de pulso y resplandor violeta en el botón de la rosa (`rutaba-rose-glow`, `rutaba-rose-btn`).
* Corregido el conflicto en `globals.css` donde `.rutaba-rose-trip-morph` sobrescribía el `-translate-x-1/2` de Tailwind, garantizando un centrado perfecto inamovible en `/inicio`, `/mapas` y modo viaje.

---

## 4. Barra de Búsqueda — Enfoque de Maqueta y Diagnóstico UX

### Síntesis de la Investigación (EXA) y Diagnóstico de UX

Tras analizar los patrones de Material Design 3, los estudios de caso de apps de transporte (Transit App, NextStop, Omnie) y las metodologías de prototipado de alta fidelidad para presentaciones ante inversores y clientes (Selleo / Atomic Object), la conclusión clave es unánime:

> El mayor riesgo en una demo ante stakeholders es el input libre: si el cliente teclea la esquina de su casa o una calle arbitraria y la app no responde o muestra "0 resultados", la maqueta da sensación de "rota" en lugar de "en desarrollo".
>
> En prototipos de alta fidelidad donde el backend de geocodificación global está fuera del alcance, la práctica estándar es mantener la presencia visual de la barra (para preservar el realismo del producto final) pero blindar la interacción, guiando al evaluador hacia las rutas y paradas donde la experiencia está 100% pulida y garantizada.

### ¿Cómo funciona la barra de búsqueda ahora en la maqueta?

1. **Aspecto visual 100% realista:**  
   * Mantiene el contenedor redondeado, el placeholder coloquial **`"Buscá tu parada"`** y el botón circular con la **lupa** a la derecha (reemplazando la flecha hacia arriba).
   * El input está configurado en modo protegido (`readOnly`) para que en celulares **no abra el teclado virtual** innecesariamente.

2. **Interacción con aviso flotante (Toast de Maqueta):**  
   * Al tocar cualquier parte de la barra o la lupa, se despliega suavemente un **toast flotante** con efecto *glassmorphism* justo debajo:
     * **Título:** *"Búsqueda completa de direcciones disponible en el lanzamiento final"*
     * **Mensaje:** *"Para probar esta maqueta interactiva, seleccioná uno de los recorridos simulados en el **Historial de paradas** debajo."*
     * Incluye un botón **`X`** para cerrarlo al instante, y además **desaparece solo tras 4.5 segundos**.

3. **Beneficio para la presentación con clientes / stakeholders:**  
   * Protege la demo: nadie se queda frustrado tipeando una dirección que la maqueta no tiene mapeada.
   * Deja en claro que la búsqueda global de direcciones es una feature del producto final, mientras guía al usuario con naturalidad hacia los viajes que sí están 100% interactivos y simulados en vivo.

---

## 5. Modo Viaje — Modal Minimizado (`/mapas`)
* **Apertura colapsada por defecto:** Al tocar una tarjeta del Historial, el modal arranca minimizado a solo 68px de altura, permitiendo al usuario apreciar el mapa y la unidad en 3D de inmediato.
* **Barra minimizada:**
  * Estructura: `[ 65 ] Coche 62 [● Arribando / Llega en X min]    Recorrido  ↑`
  * Burbuja de línea 100% circular (`w-6 h-6 rounded-full`).
  * Eliminada la barra vertical separadora.
  * Ocultas las pestañas y el botón de cierre `X` en vista colapsada.
* **Ergonomía:** Despliegue táctil con tap en toda la barra, en la flecha o mediante gesto de deslizamiento (swipe hacia arriba).

---

## 6. Modo Viaje — Modal Desplegado y Pestañas
* **Cabecera superior sincronizada:**
  * Muestra la identidad completa del colectivo activo: `[ 65 ] Coche 62 [● Arribando]` a la izquierda.
  * Eliminado el texto redundante `"X alternativas"`.
  * Eliminados la flecha hacia abajo y el botón `X` para mantener limpia la zona superior (el cierre/colapso se realiza con el grip hacia abajo).
* **Pestaña "Recorrido" (Predeterminada al abrir):**
  * Renombrada desde *"Pasos"* a **`Recorrido`**, ubicada como **primera pestaña** a la izquierda.
  * Reestructurada como **Línea de Tiempo Continua (Linear Timeline)** inspirada en Google Maps y Moovit:
    * **Nodo de Subida:** Banderita verde vectorial + `Subir en: [Parada de origen]`.
    * **Tramo Central:** Línea vertical con el color oficial de la línea, tarjeta estilizada y compacta con burbuja de línea, ramal, `~X min de viaje` y cantidad de paradas fijas.
    * **Nodo de Bajada:** Banderita a cuadros de meta vectorial + `Bajar en: [Parada de destino]`.
  * Eliminados textos redundantes triplicados y falsos pasos de caminata al bajar del colectivo.
  * Eliminado el enlace redundante *"Ver otras alternativas"* al pie de la lista.
* **Pestaña "Otras alternativas":**
  * Ubicada como segunda pestaña a la derecha.
  * Lista de colectivos en camino con burbujas circulares y badges de estado unificados.
  * Eliminada por completo la tarjeta resumen duplicada (`~10 min directo · Línea 65...`).
  * Semántica posicional estricta: solo el segundo coche lleva la etiqueta `"· siguiente"` (Coche 1 = `"· más próximo"`, Coche 3+ = limpio sin repeticiones).
  * Selección reactiva: al tocar cualquier coche de la lista, el encabezado superior y la cámara del mapa se sincronizan instantáneamente.
  * Altura contenida: el modal se ajusta a su contenido (`max-h-[320px]`), eliminando espacios vacíos y liberando la vista del mapa.

---

## 7. Navegación de Cámara 3D y Señalización en el Mapa
* **Interacción desde la subpestaña Recorrido:**
  * Tap en *"Subir en"*: la cámara vuela suavemente en 3D (`pitch: 58`, `zoom: 16.5`) a la parada de origen.
  * Tap en *"Bajar en"*: la cámara vuela suavemente en 3D (`pitch: 58`, `zoom: 16.5`) a la parada de destino.
  * Tap en la tarjeta central del colectivo: encuadra el recorrido completo en pantalla (`fitBounds`).
* **Señalización cartográfica limpia:**
  * Descartadas las banderas sobre el mapa para evitar superposiciones y saturación visual.
  * Señalización con nodos circulares nítidos (verde para origen, rojo para destino) y nombres de paradas ubicados limpiamente arriba con halo blanco. Las banderitas vectoriales se conservan como hitos visuales dentro del modal de Recorrido.
* **Limpieza de controles cartográficos:**
  * Ocultado el botón flotante de capas (`LineSelectorBar`) al ingresar en Modo Viaje (`!isTripMode`).
  * Eliminado por completo el botón lateral de la flecha circular (`RotateCcw` / recentrar en Metropol) en todas las vistas de `/mapas`.

---

## 8. Transformación de ArrivalStatusCard en Alerta Superior Efímera (Heads-Up Alert)

### Justificación de Investigación UX

Tras consultar la documentación oficial de Google Navigation SDK, las guías de Android Auto, los estudios de interacción de Citymapper (iOS 16 Lock Screen Navigation / Dynamic Island) y los análisis de eficiencia de Google Maps:

 1. La regla de oro de la navegación (Single Source of Truth):
    Google Navigation SDK y Android Auto establecen que la información de tiempo y estado del vehículo debe concentrarse en un solo
    contenedor inferior persistente (Travel Estimate Card / Bottom Sheet). Tener tarjetas fijas arriba y abajo al mismo tiempo genera el
    efecto sándwich, satura el campo visual y reduce la visibilidad de la trayectoria del mapa en más de un 40%.
 2. El rol exclusivo de las alertas superiores (Heads-Up Alerts):
    Las guías de Android Auto señalan explícitamente: "Don't use floating alerts to show primary navigation information... Use alerts
    only for non-distracting, event-based notifications". Es decir, las tarjetas superiores no deben ser fijas: su verdadero valor
    reside en actuar como alertas momentáneas que aparecen únicamente ante un evento crítico (por ejemplo, cuando el vehículo está
    entrando a la parada o al iniciar el trayecto) y luego se retiran solas.

### Detalle de Implementación
* Desactivada la persistencia del toast durante la navegación regular.
* Se activa únicamente de forma transitoria ante eventos clave del viaje:
  * **Alerta de arribo a parada:** Al llegar a la parada y pasar al estado crítico de arribo (`¡Atención en parada! ARRIBANDO · Línea X`).
  * **Alerta de viaje iniciado:** Cuando el coche empieza su viaje desde la parada, desplegando un toast de color verde esmeralda con el texto `'Viaje iniciado'` y `'Línea X · Coche Y'`.
* Auto-cierre aumentado a 10 segundos (en vez de 6 segundos) o mediante botón de cruz manual (sin cancelar el viaje).
* Limpieza de controles cartográficos previa: botón de capas oculto en Modo Viaje y botón de flecha circular RotateCcw eliminado.

---

## 9. Rediseño Superior de Modo Viaje (`ViajeHeader`) — Dos Cápsulas Simétricas e Informativas
* **Layout de Dos Cápsulas Separadas:**
  * **Cápsula 1 (Superior / Origen):** Banderita verde vectorial a la izquierda + Nombre de la parada de inicio en el centro + Botón de fijar pin en el mapa a la derecha.
  * **Cápsula 2 (Inferior / Destino):** Banderita a cuadros blanca y negra a la izquierda + Nombre de la parada final en el centro + Mismo botón de fijar pin en el mapa a la derecha.
* **Naturaleza 100% Informativa:**
  * Las cápsulas no admiten entrada de texto ni despliegan teclado en dispositivos móviles. Reflejan estrictamente el trayecto seleccionado desde el Historial de paradas de Inicio.
* **Simetría Visual:**
  * Ambos botones de fijar punto en el mapa utilizan exactamente el mismo ícono (`MapPin`).
  * Se removió el botón duplicado de detección GPS de la cápsula de origen para lograr balance visual perfecto.
* **Botón de Inversión de Sentido (`ArrowUpDown`):**
  * Situado en la botonera lateral. Con un solo tap intercambia el origen con el destino (tanto en texto como en coordenadas geográficas), recalculando el viaje en sentido opuesto de forma reactiva.
* **Conexión de Ruteo Peatonal:**
  * Si el usuario sitúa un pin fuera de la parada física, el motor calcula y visualiza automáticamente las piernas a pie (`accessWalk` y `egressWalk`) con líneas punteadas y tiempos estimados de caminata.

---

## 10. Optimización de Rendimiento y Carga de MapLibre en `/mapas`
* **Limpieza de Source Maps Inexistentes:**
  * Eliminadas las directivas de depuración `sourceMappingURL` en los archivos compilados de `public/maplibre/*.mjs`.
  * Se eliminaron los requests 404 recurrentes que tardaban entre 2 y 5 segundos bloqueando los hilos de red en el servidor de desarrollo, restaurando la fluidez y velocidad de carga del mapa.
* **Filtrado Estricto de Paradas de Recorrido (`route-stops`):**
  * Sincronizadas las capas `route-stops` y `route-stops-label` bajo la regla `HIDE_ALL_ROUTES` para que no se muestren paradas fijas de rutas de fondo a menos que el usuario seleccione explícitamente una línea desde el selector de capas.

---

## 11. Corrección de Consola y Estabilidad Next.js 16 (React 19)
* **Fix Script Tag en `src/app/layout.tsx`:** Reemplazado `<Script strategy="beforeInteractive">` dentro de `<head>` por un tag `<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />` estándar de React 19, erradicando el error de consola de cliente.
* **Configuración de `metadataBase`:** Resuelta la advertencia de resolución de URLs relativas para OpenGraph.
* **Verificación de calidad:** Build de producción 100% verde (`next build`), suite de pruebas del planificador de viaje (`trip-planner-service.spec.ts`) y asistente de intents pasando con 0 errores.
