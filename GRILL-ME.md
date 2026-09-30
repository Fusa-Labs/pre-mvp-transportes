# Grill Me Results

Generated: 2026-09-30T04:04:16.923Z

## Plan

Es que no sé por dónde empezar, ya que esta barra superior existe tanto por dentro como por fuera del modo viaje. Y nosotros actualmente estamos tratando todo lo relacionado al modo viaje. Así que no estoy seguro si las modificaciones que tenemos o que yo te puedo proponer hacer respecto a esta barra superior las debemos aplicar en general o solamente en el modo viaje. Por ejemplo, estructura de esta barra superior, texto que aparece en esta barra superior y cosas así. Incluso tamaño o ubicación en la zona superior de dicha barra. ¿Vos qué opinás? Gracias.

## Shared Understanding

Acuerdo para el rediseño superior de Modo Viaje: sistema de dos cápsulas separadas (Origen con banderita verde + GPS / Destino con banderita a cuadros + GPS), flecha de inversión de sentido y preservación de conexiones peatonales.

## Questions and Answers

### 1. ¿Dónde preferís enfocar las modificaciones de la barra superior?

**Recommended answer:** 1. Exclusivo para Modo Viaje (Recomendado)

**User answer:** 1. Exclusivo para Modo Viaje (Recomendado)

**Status:** resolved

**Notes:** El rediseño se circunscribe estrictamente a la experiencia del Modo Viaje ('ViajeHeader'), dejando el mapa libre exterior intacto.

### 2. Estando en Modo Viaje, ¿qué estructura visual te parece más clara y cómoda para la parte superior?

**Recommended answer:** 1. Cápsula compacta con botón de salida (← Origen → Destino) (Recomendado)

**User answer:** Me interesa la opción 2 pero con modificaciones y estas son que sean dos cápsulas separadas en donde la cápsula superior tenga como ícono la banderita verde y el nombre de la parada, desde donde se inicia. Y en la cápsula de abajo, separada de la de arriba, que diga el nombre de la parada final. Y a su izquierda, la banderita blanca y negra de llegada. Dentro de cada cápsula, a la derecha del texto de las paradas, un ícono de GPS que se utilizará para posicionar un team específico para que el modo viaje registre el inicio y el fin de este recorrido que obviamente si no es sobre la parada de inicio o sobre la parada hacia donde voy conecte a ese pin con una línea recta hacia cada parada, haciendo entender que ese recorrido se hará a pie. ¿Me explico? Y luego la flechita doble hacia arriba y hacia abajo que intercambiará la parada de inicio con la parada final. Y por ende los textos también se intercambiarán. Si estaba abajo, una parada y presiona esa flechita, aparecerá en la cápsula de arriba y la de arriba aparecerá en la cápsula de abajo. Armate una lista de tareas para no perder el scope. Gracias.

**Status:** resolved

**Notes:** Diseño de dos cápsulas flotantes desacopladas: superior con banderita verde + parada origen + GPS; inferior con banderita a cuadros + parada destino + GPS; flecha doble para invertir sentidos y trazado peatonal de conexión a pie si el GPS no está en la parada física.

## Agreed Decisions

- Aislar las modificaciones de la cabecera superior exclusivamente al Modo Viaje ('ViajeHeader'), sin modificar la barra de búsqueda del mapa libre.
- Diseñar la cabecera de Modo Viaje con dos cápsulas redondeadas independientes:
- Cápsula Superior (Origen): Banderita verde a la izquierda, nombre de la parada de inicio en el centro, botón de GPS a la derecha.
- Cápsula Inferior (Destino): Banderita a cuadros de meta a la izquierda, nombre de la parada de destino en el centro, botón de GPS a la derecha.
- Incorporar el botón de flecha bidireccional (ArrowUpDown) que invierte instantáneamente el origen y el destino con recálculo dinámico del recorrido.
- Conservar y conectar el sistema de ruteo peatonal (piernas 'walk') cuando el pin del GPS se sitúe fuera de la parada física de ascenso o descenso.

## Open Risks

- Asegurarse de que el botón de cerrar/salir del modo viaje (X) siga teniendo un lugar intuitivo o accesible (por ejemplo a la derecha de la botonera o en el encabezado general).

## Next Decision Needed

Armar la lista de tareas en `todo` y comenzar la implementación de la nueva estructura de dos cápsulas en `ViajeHeader.tsx`.
