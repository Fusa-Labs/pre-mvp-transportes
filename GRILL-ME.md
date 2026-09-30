# Grill Me Results

Generated: 2026-09-30T18:29:37.919Z

## Plan

Espera, mi duda es la siguiente. Esta línea de la que estás hablando, cuyo inicio es la primer parada y final es la última, entiendo que corresponde a un ramal o un grupo de ramales en específico. Porque recordá que hay dos sentidos dentro de una misma línea. Generalmente, hay veces que tienen un solo sentido, pero analicemos desde el punto de vista de que la línea 65 tiene un sentido de ida y un sentido de vuelta. ¿Cómo vamos a diferenciar esto en esta pestaña de líneas? Utiliza dos queries de EXA para investigar en internet sobre cómo se solucionó este tema. No piques código todavía.

## Shared Understanding

Definición completa del selector de sentido y distribución de flota para la pestaña Líneas en Modo Exploratorio. Botón compacto con texto dinámico de cabecera, selector de línea integrado y balance 50/50 de flota activa por sentido en el diagrama vertical y en el mapa.

## Questions and Answers

### 1. ¿Cómo debería diferenciarse el sentido de ida y vuelta de la Línea 65 en la pestaña Líneas? (Recomendado: Selector segmentado de 2 cabeceras arriba del diagrama: '[ Hacia Barrancas ]' y '[ Hacia Constitución ]').

**Recommended answer:** Selector segmentado de 2 cabeceras arriba del diagrama (Recomendado)

**User answer:** Me gusta la opción 2, que es un botón compacto, siempre y cuando al lado de dicho botón siempre aparezca el texto con el sentido seleccionado. Por ejemplo, que de manera predeterminada aparezca hacia Barrancas y si selecciono cambiar sentido, que en vez de que diga hacia Barrancas, diga hacia Constitución.

**Status:** resolved

**Notes:** Botón compacto de conmutación de sentido con texto dinámico al lado: 'Hacia Barrancas de Belgrano' por defecto, y al tocarlo conmuta a 'Hacia Plaza Constitución'.

### 2. ¿Dónde prefiere el usuario seleccionar entre la Línea 65 y la Línea 194 cuando abre esta pestaña? (Recomendado: Selector integrado de líneas dentro del propio panel para tener todo en un solo lugar).

**Recommended answer:** Selector de líneas integrado dentro del panel [65 | 194] (Recomendado)

**User answer:** Selector de líneas integrado dentro del panel [65 | 194] (Recomendado)

**Status:** resolved

**Notes:** Selector integrado de líneas en pastillas [65 | 194] dentro del encabezado del panel.

### 3. Dado que la simulación calibrada de demo está corriendo hacia Barrancas: ¿cómo mostramos los coches en el sentido opuesto (hacia Constitución)? (Recomendado: Sentido activo con coches en vivo; sentido opuesto con paradas y frecuencia programada).

**Recommended answer:** Sentido activo con coches en vivo; sentido opuesto con paradas y frecuencia (Recomendado)

**User answer:** Para este caso no estamos hablando del modo viaje, por ende no estamos presenciando el convoy, sino que estamos presenciando el 100% de los coches de dicha línea, tanto de ida como de vuelta. Así que en la arteria vertical, dentro de la pestaña de líneas, se deberían ver todos los colectivos Obviamente, si estoy en el modo de un sentido, que solamente se muestren los colectivos que van en ese sentido y si cambio de sentido que solamente se muestren los colectivos que van en el otro sentido. ¿Se entiende? Supongo que para un sentido avanzan el 50% de las unidades y en el otro sentido avanzan el otro 50% de las unidades restantes No estoy seguro de esta proporción pero mi intuición me dice eso ¿Vos qué opinás?

**Status:** resolved

**Notes:** Distribución simétrica de flota 50/50: en Modo Exploratorio de Líneas se muestra la flota completa de la línea dividida por sentido (12 unidades hacia Barrancas y 12 unidades hacia Constitución para la Línea 65), filtrando el diagrama y el mapa según el sentido activo seleccionado.

## Agreed Decisions

- Selector de Sentido con botón compacto y texto dinámico: en la cabecera del diagrama se ubica un botón compacto de conmutación (icono de flechas opuestas / cambio de sentido) acompañado del texto claro y dinámico del destino: 'Hacia Barrancas de Belgrano' por defecto. Al presionarlo, conmuta a 'Hacia Plaza Constitución', invirtiendo la secuencia de paradas y la dirección de la traza.
- Selector de Línea integrado en el panel: pastillas directas [65 | 194] en el panel para alternar rápidamente entre ambas líneas.
- Balance simétrico de flota 50/50: en Modo Exploratorio se visualiza la flota completa de la línea dividida por sentido de circulación (12 unidades hacia Barrancas y 12 unidades hacia Constitución para la Línea 65). El Live Line Diagram vertical y el mapa renderizan exclusivamente los coches que avanzan en el sentido seleccionado, reflejando su avance telemático en tiempo real sin saturar la vista.

## Open Risks

- Sincronización fluida del mapa (traza de ida vs traza de vuelta) al conmutar el sentido en el panel sin desfasar la cámara.

## Next Decision Needed

Planificar e implementar la modularización del componente LiveLineDiagram y la lógica de conmutación de sentido 50/50 en feat/fase4-clean.
