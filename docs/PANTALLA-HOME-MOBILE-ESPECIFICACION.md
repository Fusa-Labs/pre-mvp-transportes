# Documentación Técnica de Especificación: Pantalla Principal Mobile (Home)

**Proyecto:** `pre-mvp-transportes`  
**Autor:** el Gentleman (Senior Architect)  
**Estado:** Propuesta Técnica para Revisión del Equipo de Programadores  
**Ubicación:** `docs/PANTALLA-HOME-MOBILE-ESPECIFICACION.md`

---

## 1. Resumen Ejecutivo

El presente documento establece la especificación técnica y la arquitectura de componentes para la nueva **Pantalla Principal Mobile (Home)** de la aplicación `pre-mvp-transportes`. 

Esta pantalla será el punto de entrada oficial a la aplicación en la ruta raíz (`/`). Su propósito es brindar una experiencia de usuario orientada a mobile-first, fluida y modular, sirviendo de concentrador de servicios e información antes de pasar a la vista interactiva del mapa.

---

## 2. Diagrama de Maquetado y Wireframe Visual (ASCII Layout)

```text
+-------------------------------------------------------------+
|                        MOBILE HEADER                        |
|  [Hola, Buenos días]                           [ (🔔) Dot ] |
|  [Lunes, 14 de Septiembre]                                  |
+-------------------------------------------------------------+
|                                                             |
|                   HOME CARD FEED (SLOTS)                    |
|             (Contenedor Central de Tarjetas)                |
|                                                             |
|  +-------------------------------------------------------+  |
|  | [Tarjeta Modular 1]                                   |  |
|  | Componente independiente (ej: Próximos Arribos)       |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | [Tarjeta Modular 2]                                   |  |
|  | Componente independiente (ej: Mis Paradas Favoritas)  |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | [Tarjeta Modular 3]                                   |  |
|  | Componente independiente (ej: Estado de las Líneas)    |  |
|  +-------------------------------------------------------+  |
|                                                             |
+-------------------------------------------------------------+
|                   BOTTOM NAVIGATION BAR                     |
|  +-------------------------------------------------------+  |
|  |  (📋)       (📌)        (( 🌹 ))       (👤)     (🏠)  |  |
|  | Líneas  Tus Paradas   ROSA (Mapa)   Perfil   Inicio  |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 3. Arquitectura de Navegación y Rutas

- **Patrón de Navegación:** Single Page Application (SPA) basada en estados de tabs activos en la ruta raíz (`/`).
- **Estado de Navegación Global:** `activeTab: 'home' | 'lineas' | 'paradas' | 'mapa' | 'perfil'`.
- **Vista por Defecto (`/`):** Al ingresar a la aplicación se renderiza la vista `Home`.
- **Persistencia del Mapa:** La experiencia del mapa en vivo (`MapCanvas`) se mantiene montada o inicializada en diferido según el tab activo para garantizar transiciones de 60fps al presionar la Rosa Central.

---

## 4. Especificación del Header Superior

### 4.1 Bloque Izquierdo: Saludo Dinámico y Fecha
- **Saludo Dinámico:** Función que calcula el período del día basándose en la hora del dispositivo cliente:
  - `06:00 a 12:59` $\rightarrow$ *"Buenos días"*
  - `13:00 a 19:59` $\rightarrow$ *"Buenas tardes"*
  - `20:00 a 05:59` $\rightarrow$ *"Buenas noches"*
  *(Soporta concatenación con nombre de usuario si existe sesión activa: ej. "¡Buenas tardes, Marcos!").*
- **Fecha Localizada:** Formateada mediante `Intl.DateTimeFormat` en español argentino:
  - Ej: `Lunes, 14 de Septiembre`.

### 4.2 Bloque Derecho: Centro de Notificaciones
- **Ícono de Campana:** Botón táctil min. 44×44px con badge/dot indicador en tono activo si existen alertas no leídas.
- **Acción:** Al presionar, dispara el estado `isNotificationOpen = true`, desplegando un componente `NotificationDrawer` (panel flotante/BottomSheet deslizante desde la derecha o inferior) con el listado de desvíos, cortes de servicio y novedades.

---

## 5. Esquema de Modularización: Contenedor Central (`HomeCardFeed`)

Para garantizar que cada tarjeta sea **100% independiente** y de fácil extensión, la zona central utilizará una arquitectura basada en **Slots / Registry Pattern**.

### 5.1 Principios de Modularización
1. **Desacoplamiento Estricto:** Cada tarjeta vive en su propio archivo dentro de `src/components/home/cards/` y administra su propio estado interno o peticiones de datos.
2. **Registro Dinámico (`CardRegistry`):** El contenedor principal `HomeCardFeed` recibe o mapea un arreglo de identificadores de tarjetas habilitadas:

```typescript
// Contrato de configuración del Feed
export type HomeCardId = 
  | 'favorite-stops'
  | 'line-status'
  | 'recent-trips'
  | 'service-alerts';

export interface HomeCardProps {
  id: HomeCardId;
  title?: string;
  className?: string;
}
```

3. **Independencia de Renderizado:** Si una tarjeta falla o no posee datos, renderiza un estado vacío (`null` o *skeleton loader*) sin afectar al resto del feed ni al maquetado general.

---

## 6. Especificación de la Bottom Navigation Bar

La barra de navegación inferior es un dock flotante ergonométricamente optimizado para interacción con el pulgar (*Mobile Thumb Zone*).

### 6.1 Disposición Exacta (Izquierda a Derecha)

| Posición | Nombre | Ícono Sugerido | Identificador de Tab | Función / Acción |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Líneas** | `ListFilter` / `Bus` | `'lineas'` | Despliega el selector y buscador de líneas de colectivo. |
| **2** | **Tus Paradas** | `MapPin` / `Bookmark` | `'paradas'` | Abre el panel de paradas guardadas y frecuentes. |
| **3 (Centro)** | **La Rosa (Logo)** | `Flower2` / `LogoRosa` | `'mapa'` | **Acción Principal:** Redirecciona / activa inmediatamente la pantalla del **Mapa interactivo WebGL**. |
| **4** | **Perfil** | `User` / `UserCircle` | `'perfil'` | Accede a la configuración del usuario y preferencias. |
| **5** | **Inicio** | `Home` | `'home'` | Vuelve a la pantalla principal del Home. |

### 6.2 Jerarquía del Botón Central (La Rosa)
- El botón de **La Rosa** se ubica exactamente en el centro de la barra.
- Cuenta con un tratamiento de **Floating Action Button (FAB)** circular que sobresale ligeramente del límite superior del dock para darle prominencia visual inmediata como la acción primaria de acceso al mapa.

---

## 7. Árbol de Componentes React e Interfaces TypeScript

### 7.1 Árbol de Componentes Sugerido

```text
src/
├── app/
│   └── page.tsx                         <-- Coordinador SPA de Tabs
├── components/
│   ├── home/
│   │   ├── HomeScreen.tsx               <-- Wrapper de la Pantalla Home
│   │   ├── HomeHeader.tsx               <-- Header (Saludo, Fecha, Notificaciones)
│   │   ├── NotificationDrawer.tsx       <-- Panel deslizante de alertas
│   │   └── feed/
│   │       ├── HomeCardFeed.tsx         <-- Contenedor modular por slots
│   │       └── cards/                   <-- Tarjetas 100% independientes
│   │           ├── BaseHomeCard.tsx     <-- Wrapper contenedor de tarjeta
│   │           └── [NuevasTarjetas].tsx
│   └── navigation/
│       └── BottomNavBar.tsx             <-- Dock inferior con 5 accesos + Rosa
```

### 7.2 Interfaces de Contrato TypeScript

```typescript
// src/types/home-navigation.ts

export type NavigationTab = 'lineas' | 'paradas' | 'mapa' | 'perfil' | 'home';

export interface BottomNavBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export interface HomeHeaderProps {
  userName?: string;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
}

export interface BaseCardProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}
```

---

## 8. Checklist de Implementación para el Equipo de Programadores

- [ ] **Fase 1: Enrutador y Layout Base**
  - [ ] Crear el estado `activeTab` en `page.tsx` para alternar entre `HomeScreen` y `MapCanvas`.
  - [ ] Construir el componente `BottomNavBar` respetando el orden estricto de los 5 botones.
  - [ ] Asignar el evento `onClick` del botón de **La Rosa** para activar el tab `'mapa'`.

- [ ] **Fase 2: Header Superior y Notificaciones**
  - [ ] Implementar la función de cálculo de saludo por franja horaria en `HomeHeader`.
  - [ ] Formatear la fecha en español con `Intl.DateTimeFormat`.
  - [ ] Crear el estado y maquetado básico de `NotificationDrawer`.

- [ ] **Fase 3: Contenedor Modular `HomeCardFeed`**
  - [ ] Implementar `HomeCardFeed.tsx` listo para recibir slots de tarjetas independientes.
  - [ ] Crear la tarjeta base `BaseHomeCard` con manejo de estados vacíos y bordes limpios.
