# La Nueva Metropol — Flota, Líneas y Branding

> Datos extraídos de `metropol.com.ar` (scrapeo `scripts/scrape-metropol.mjs`) y complementados con el manual de usuario interno.  
> **NDA vigente** — datos placeholder en mock; fuentes reales en `src/data/metropol.json`.

---

## 1. La Empresa

| Dato | Valor |
|------|-------|
| **Nombre comercial** | La Nueva Metropol |
| **Fundación** | 1996 |
| **Rubro** | Transporte público de pasajeros (colectivos) |
| **Cobertura** | Área Metropolitana Buenos Aires (AMBA) |
| **Sede** | Buenos Aires, Argentina |

### Estadísticas Clave

| Métrica | Valor |
|---------|-------|
| **Líneas AMBA** | 26 |
| **Unidades en flota** | 1.500+ |
| **Pasajeros transportados (anual)** | 230 millones+ |

### Certificaciones

| Certificación | Alcance |
|---------------|---------|
| **IRAM 3810** | Sistema de Gestión de la Seguridad Vial |
| **ISO 9001** | Sistema de Gestión de Calidad |
| **ISO 14001** | Sistema de Gestión Ambiental |
| **UITP** (2022) | Asociación Internacional de Transporte Público |

---

## 2. Líneas en `metropol.json`

El archivo `src/data/metropol.json` contiene **todas las líneas** scrappeadas de la web oficial. Cada línea incluye:

```jsonc
{
  "wpId": "157",               // ID de WordPress (scraping)
  "number": "65",              // Número de línea
  "name": "Línea 65",          // Nombre completo
  "image": "/images/metropol/lineas/linea-65.jpeg",  // Foto local
  "imageCredit": "https://www.metropol.com.ar/...",   // URL original
  "recorridos": [
    {
      "label": "Recorrido",    // Nombre del recorrido
      "summary": "...",        // Resumen de ida
      "details": [             // Descripción textual completa
        "Ida a Barrancas de Belgrano: ...",
        "Regreso a Plaza Constitución: ..."
      ],
      "paradas": [             // Paradas nombradas
        "Estación Constitución",
        "Plaza Constitución",
        ...
      ],
      "mapUrl": "https://..."  // Google Maps embebido
    }
  ]
}
```

### Ejemplo: Línea 65

- **Recorrido**: Plaza Constitución ↔ Barrancas de Belgrano
- **Dirección ida**: Av. Caseros → Av. Corrientes → Av. Cabildo → Juramento
- **Dirección vuelta**: Juramento → Av. Cabildo → Av. Federico Lacroze → Av. Rivadavia
- **Paradas destacadas**: Estación Constitución, Hospital Garraham, Hospital Muñiz, Hospital Italiano, Av. Corrientes y Scalabrini Ortiz, Barrio Chino Estación, Barrancas de Belgrano
- **Mapa embebido**: Google Maps My Maps

### Ejemplo: Línea 136

- **Recorrido**: Primera Junta (CABA) ↔ Navarro (Pcia. Buenos Aires)
- **Largo**: Cruza General Paz, pasa por Estación Ramos Mejía, Estación Liniers, Estación Flores, Estación Once
- **Paradas destacadas**: Estación Navarro, Estación Ituzaingó, Estación Castelar, Rivadavia y Rawson (Terminal), Estación Ramos Mejía, Estación Flores, Hospital Ramos Mejía

> Hay **26 líneas** en total en el JSON — solo dos detalladas arriba. El archivo completo está en `src/data/metropol.json` (~2950 líneas de JSON).

---

## 3. Flota Mock (RutaBA)

Las 5 líneas mock del proyecto (placeholder hasta liberar NDA):

| Línea | Nombre | Color Hex | Dirección | Frecuencia |
|-------|--------|-----------|-----------|------------|
| **200** | Centro – Sur | `#1D4ED8` (Azul) | Sur | 15 min |
| **210** | Centro – Oeste | `#FEA619` (Ámbar) | Oeste | 10 min |
| **215** | Zona Norte | `#006B2C` (Verde) | Norte | 20 min |
| **220** | Norte – Sur Express | `#7C3AED` (Violeta) | Norte-Sur | 12 min |
| **225** | Oeste – Centro | `#0EA5E9` (Cyan) | Oeste-Centro | 18 min |

### Unidades

- **Unidades por línea**: 8 (mock)
- **Unidades totales en simulación**: 40 (8 × 5)
- **Capacidad**: 60 pasajeros por unidad
- **Velocidad GPS simulada**: 11 km/h base + 7 km/h de varianza
- **Tick de simulación**: 1 Hz

### Simulación GPS (`src/mock/live.ts`)

- Cada unidad sigue su polyline de `routes.json`
- Velocidad calculada: `baseSpeed (11) + (Math.random() * variance (7))`
- Movimiento: interpola entre vértices del polyline
- Extrapolación: cuando no hay señal, proyecta dirección actual
- Las paradas se respetan (velocidad ≈ 0 en paradas)

---

## 4. Branding en la App

### MetropolLogo (`src/components/brand/metropol-logo.tsx`)

**Componente React** que renderiza el logo oficial de La Nueva Metropol como SVG inline.

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `variant` | `'full' \| 'mono'` | Full: colores oficiales. Mono: `currentColor` |
| `className` | `string` | Clases CSS adicionales |

**ViewBox**: `0 0 719.16 178.87`

### MetropolRose (componente standalone)

Versión recortada solo con la rosa (sin wordmark).  
**ViewBox**: `0 0 82 178.87`

### Paleta Oficial

| Color | Hex | Uso |
|-------|-----|-----|
| **Navy** | `#1D2B4F` | Wordmark / texto del logo |
| **Rojo** | `#E30613` | Pétalos de la rosa |
| **Verde** | `#228135` | Hojas de la rosa |

### Fleet Colors (tokens de diseño)

| Color | Hex | Línea |
|-------|-----|-------|
| Azul | `#1D4ED8` | 200 |
| Ámbar | `#FEA619` | 210 |
| Verde | `#006B2C` | 215 |
| Violeta | `#7C3AED` | 220 |
| Cyan | `#0EA5E9` | 225 |

---

## 5. Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `src/data/metropol.json` | Líneas, recorridos, fotos de flota (scrappeado de metropol.com.ar) |
| `src/components/brand/metropol-logo.tsx` | Componentes SVG: MetropolLogo + MetropolRose |
| `src/components/brand/fleet-carousel.tsx` | Carrusel scroll-snap para fotos de flota |
| `public/metropol-logo.svg` | SVG wordmark (719×179 viewBox) |
| `public/metropol-icon.png` | Icono PNG |
| `manual_usuario_metropol.md` | Manual de usuario con Rosa inline + fotos de flota |
| `scripts/scrape-metropol.mjs` | Script de scraping de metropol.com.ar |
