# Bitácora de Saneamiento y Mejoras de Producto (Fases 1 a 5)

Este documento resume las correcciones, refactorizaciones y nuevas features implementadas a lo largo de las Fases 1 a 5. Las intervenciones surgieron de una revisión exhaustiva para subsanar inconsistencias lógicas, fallas de compilación y bloqueos de despliegue originados en pull requests anteriores de las ramas de Adrián y Fabio, consolidando una base técnica estable, modular y lista para producción.

---

### Fase 1 y 2: Saneamiento de Navegación, Barra Inferior y Alertas
* **Corrección de la Barra de Navegación en Modo Viaje:** Se solucionó el solapamiento visual heredado del módulo de navegación previo. Durante el viaje activo, la barra inferior ahora se repliega de forma compacta en un botón flotante centrado con la Rosa de Metropol, ocultando pestañas secundarias que generaban confusión y desbordes en pantalla.
* **Erradicación del Botón de Inversión Errático:** Se removió el control de intercambio de paradas (*swap*) que había quedado activo durante la navegación en la implementación previa, evitando que el usuario invirtiera accidentalmente el recorrido en pleno viaje y desorientara la cámara.
* **Normalización del Feed de Alertas:** Se corrigió el componente de alertas en la pantalla de inicio, que fallaba al compilar o mostraba únicamente una alerta estática; ahora renderiza dinámicamente todas las demoras e incidencias de la red (Panamericana, Av. Díaz Vélez y Zárate).

---

### Fase 3: Calibración Telemática y Continuidad del Convoy
* **Eliminación del Bucle de Navegación Forzado:** Se desmanteló la lógica introducida en las pruebas de Adrián que cortaba artificialmente el viaje tras dos paradas para reiniciar la simulación en un loop constante; ahora el viaje se realiza de forma continua y realista de cabecera a cabecera.
* **Calibración del Convoy de Colectivos:** Se sincronizó la flota de la Línea 65 para mostrar un convoy claro de 3 unidades en la simulación, reduciendo tiempos muertos de espera y garantizando un coche próximo a menos de un minuto del punto de partida.
* **Estabilización de Encuadres de Cámara:** Se recalibraron las transiciones 2D y 3D para evitar los saltos bruscos hacia coordenadas residuales heredadas de versiones previas, manteniendo al pasajero siempre enfocado en su colectivo y parada de descenso.

---

### Fase 4: Diagrama de Hilo en Vivo y Limpieza Cartográfica
* **Nuevo Diagrama de Línea Vertical:** Se reemplazó el modal anterior de transporte —que presentaba pestañas redundantes y fallas de renderizado— por un diagrama vertical continuo donde las paradas y los colectivos en circulación se proyectan en tiempo real según su posición kilométrica real.
* **Corrección Conceptual de Ramales (Línea 194):** Se corrigió una inconsistencia crítica de las primeras versiones donde los colectivos aparecían recorriendo paradas ajenas a su ramal. Se implementó una segregación estricta por ramal (A, B, D, E, F, G, H, I), asegurando que cada coche figure única y exclusivamente en las paradas por donde circula en la calle.
* **Erradicación de Efectos Bloom y Parpadeos en el Mapa:** Se eliminaron las capas de brillo difuso (*bloom*), halos intermitentes y corrientes con desenfoque que habían sido agregadas en la capa de mapa de Fabio, las cuales saturaban la GPU en dispositivos móviles y provocaban parpadeos molestos; las trazas ahora son líneas vectoriales continuas, lisas y sólidas.
* **Minimización Automática del Modal:** El panel de líneas ahora se minimiza automáticamente a menos del 20% de la pantalla al seleccionar un troncal o ramal, resolviendo el problema de la versión previa donde el menú tapaba el 70% del mapa.

---

### Fase 5: Rediseño del Buscador y Flujo Exploratorio
* **Sustitución del Falso Buscador Superior:** Se removió la barra de búsqueda estática introducida en las tareas de Fabio, la cual fingía ser un buscador pero en realidad forzaba un viaje predefinido a ciegas sin permitir buscar nada.
* **Nuevo Buscador Exploratorio Interactivo:** Se integró un panel de búsqueda interactivo con foco automático inspirado en los estándares de Transit App y Citymapper, diseñado a medida para la maqueta:
  * **Atajos Frecuentes de 1 Toque:** Accesos rápidos directos a *Casa*, *Trabajo* y *Origen Demo*.
  * **Puntos Clave y Terminales:** Accesos inmediatos a las principales cabeceras de Metropol (Barrancas, Constitución, Zárate, Escobar, Once, Plaza Italia).
  * **Autocompletado Multimodal:** Filtrado en tiempo real de líneas (al tipear "65" o "194"), paradas oficiales y destinos.
* **Cero Código Espagueti y Limpieza de Deploys:** Se auditó todo el flujo eliminando variables huérfanas y llamadas en cascada que bloqueaban los checks de despliegue, logrando una compilación limpia con cero errores de TypeScript y builds de producción exitosos.

---

### Estado Final Consolidado
Todas las correcciones fueron unificadas e integradas de forma limpia en la rama principal **`feat/fase2-clean`**, eliminando ramas temporales obsoletas y dejando la aplicación 100% estable, fluida y con sus pruebas de compilación y despliegue en verde.
