/**
 * Design Tokens y configuración temática oficial para la maqueta de transportes AMBA
 * Sigue las especificaciones de docs/RECORRIDOS-LINEAS.md y docs/skill-maqueta-oficial.txt
 */

export const tokens = {
  // Paleta corporativa Metropol / AMBA
  brand: {
    primary: "#f59e0b",
    primaryHover: "#d97706",
    surface: "#ffffff",
    surfaceDark: "#18181b",
    border: "#e2e8f0",
    borderDark: "#27272a",
  },

  // Colores oficiales de flota por línea (según docs/RECORRIDOS-LINEAS.md)
  fleetColors: [
    "#1D4ED8", // Índice 0: Azul     -> Línea 200
    "#FEA619", // Índice 1: Ámbar    -> Línea 210
    "#006B2C", // Índice 2: Verde    -> Línea 215
    "#7C3AED", // Índice 3: Violeta  -> Línea 220
    "#0EA5E9", // Índice 4: Cyan     -> Línea 225
  ] as const,

  // Contraste de texto sobre color de línea
  lineOnColor: {
    "#1D4ED8": "#FFFFFF",
    "#FEA619": "#1E293B",
    "#006B2C": "#FFFFFF",
    "#7C3AED": "#FFFFFF",
    "#0EA5E9": "#FFFFFF",
    "#F59E0B": "#000000",
  } as const,

  // Estados del servicio
  status: {
    normal: {
      label: "Normal",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    demoras: {
      label: "Demoras",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.1)",
    },
    interrumpido: {
      label: "Interrumpido",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.1)",
    },
  },

  // Ocupación de coches
  occupancy: {
    baja: {
      label: "Baja",
      color: "#10b981",
    },
    media: {
      label: "Media",
      color: "#f59e0b",
    },
    alta: {
      label: "Alta",
      color: "#ef4444",
    },
  },

  // Viewport y layout móvil
  layout: {
    headerZIndex: 30,
    bottomSheetZIndex: 40,
    mapControlsZIndex: 20,
    collapsedSheetHeight: 290,
    expandedSheetMaxHeight: "75vh",
  },
} as const;
