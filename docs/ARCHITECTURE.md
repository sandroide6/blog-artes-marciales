# Arquitectura Técnica y Estructura de Contenidos — Blog de Artes Marciales

**Proyecto:** `blog-artes-marciales`  
**Rol:** DevTeam Architect  
**Versión:** 1.0.0  
**Fecha:** 2026-10-20  

---

## 1. Diagnóstico de Arquitectura Actual

### 1.1 Estado del Repositorio y Dependencias
- **Framework:** Astro `^7.4.1` (Astro v5 Content Layer).
- **Integraciones presentes:**
  - `@astrojs/mdx` (`^8.1.0`): Soporte para Markdown y MDX.
  - `@astrojs/rss` (`^4.0.19`): Generación de feeds RSS.
  - `@astrojs/sitemap` (`^3.7.4`): Sitemap XML para SEO.
  - `sharp` (`^0.35.0`): Procesamiento optimizado de imágenes con `astro:assets`.
- **Estilos actuales:**
  - `src/styles/global.css`: Estilos básicos heredados de Bear Blog en CSS plano, tipografía Atkinson Hyperlegible mediante font provider local.
  - No cuenta con Tailwind CSS configurado aún ni utilidades tipográficas para contenido en prosa.
- **Colección de Contenidos:**
  - Definida en `src/content.config.ts` mediante el loader `glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' })`.
  - Esquema Zod actual limitado a: `title` (string), `description` (string), `pubDate` (date), `updatedDate` (date opcional), `heroImage` (image opcional).
  - **Carencias del esquema actual:** No soporta `disciplina` (Karate, Jiu-Jitsu, Muay Thai, Boxeo, MMA), `tipo` de artículo (técnica, historia, filosofía), `autor`, `tags`, `readingTime` ni bandera `featured`.
- **Estructura de Vistas:**
  - `src/pages/index.astro`: Template estándar ("Hello, Astronaut!"), sin identidad de artes marciales, sin showcase de disciplinas ni artículos destacados.
  - `src/pages/blog/index.astro`: Lista monolítica con maquetación flotante simple, sin filtrado por disciplina.
  - `src/pages/blog/[...slug].astro`: Enrutamiento dinámico con `render(post)` de Astro 5.
  - `src/pages/about.astro`: Texto dummy en inglés.
  - `src/layouts/BlogPost.astro`: Layout de lectura estándar con estilos acoplados en etiqueta `<style>`.

---

## 2. Arquitectura Propuesta

### 2.1 Principios de Diseño
1. **SSG Puro y Cero Sobrecarga (PONYTAIL):** Generación 100% estática. Sin frameworks cliente pesados (React/Vue/Svelte) para vistas de contenido; interactividad de filtros implementada con Web Standards nativos (`URLSearchParams` y dataset en DOM).
2. **Identidad Visual "Dojo & Octagon":**
   - Base oscura/neutral elegante (`#0d0f12`, `#161a22`, bordes en gris táctico `#272e3b`).
   - Acentos cromáticos específicos por disciplina (Karate: Blanco/Carmesí, BJJ: Azul Tatami/Índigo, Muay Thai: Oro Tailandés/Ámbar, Boxeo: Rojo Guante/Fuego, MMA: Esmeralda Oscuro/Titanio).
3. **Content Layer Tipado:** Validación en tiempo de compilación con Zod para garantizar que ningún artículo carezca de disciplina, tiempo de lectura, tags o metadatos de autor.
4. **Navegación Multidisciplinaria Dual:**
   - Rutas estáticas canónicas indexables para SEO: `/artes/[disciplina]`.
   - Explorador interactivo instantáneo en `/blog` con filtros por disciplina y tags.

### 2.2 Mapa Conceptual de Componentes

```
┌────────────────────────────────────────────────────────────────────────┐
│                               BaseHead                                 │
│          (SEO, OpenGraph, Twitter Cards, Canonical, RSS, Fonts)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                  BaseLayout              BlogPostLayout
             (Navbar + Main + Footer) (Header Art. + Prose + Related)
                        │
       ┌────────────────┼────────────────┬────────────────┐
       ▼                ▼                ▼                ▼
   index.astro      blog/index.astro  about.astro   artes/[disciplina].astro
  (Hero Marcial,    (Explorador con   (Filosofía y  (Página canónica
   DisciplinasGrid,  Filtros cliente,  Código de     por arte marcial,
   Destacados,       Grid Artículos)   Honor Budo)   guías e historia)
   Recientes)
```

### 2.3 Árbol de Archivos Objetivo

```text
blog-artes-marciales/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── hero-martial.jpg
│   │   │   └── disciplines/ (karate.jpg, bjj.jpg, muay-thai.jpg, boxeo.jpg, mma.jpg)
│   │   └── fonts/
│   ├── components/
│   │   ├── BaseHead.astro
│   │   ├── Navbar.astro (reemplaza/moderniza Header.astro)
│   │   ├── Footer.astro
│   │   ├── FormattedDate.astro
│   │   ├── MartialBadge.astro (insignia de disciplina con color temático)
│   │   ├── ArticleCard.astro (tarjeta responsiva con heroImage, disciplina, lectura, fecha)
│   │   ├── HeroMarcial.astro (hero con llamado a la acción y estética marcial)
│   │   ├── DisciplinasGrid.astro (cuadrícula de acceso rápido a las 5 disciplinas)
│   │   ├── FilterBar.astro (barra de filtrado reactiva nativa en cliente)
│   │   └── RelatedPosts.astro (artículos relacionados de la misma disciplina)
│   ├── content/
│   │   └── blog/
│   │       ├── bjj-fundamentos-pasaje-guardia.mdx
│   │       ├── karate-filosofia-dojo-kun.md
│   │       ├── muay-thai-tecnica-teep-frontal.mdx
│   │       ├── boxeo-biomecanica-jab-perfecto.md
│   │       └── mma-evolucion-artes-marciales-mixtas.mdx
│   ├── data/
│   │   └── disciplines.ts (definición canónica de disciplinas, colores, descripciones)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── BlogPost.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro (renombrado/orientado a Filosofía y Orígenes)
│   │   ├── blog/
│   │   │   ├── index.astro (directorio general con filtros)
│   │   │   └── [...slug].astro (detalle dinámico)
│   │   ├── artes/
│   │   │   └── [disciplina].astro (páginas estáticas dedicadas por arte)
│   │   └── rss.xml.js
│   ├── styles/
│   │   └── global.css (importación de Tailwind o tokens marciales modernos)
│   ├── consts.ts
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## 3. Contratos de Integración y Esquemas de Datos

### 3.1 Esquema de la Colección `blog` (`src/content.config.ts`)

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const DISCIPLINAS = ['karate', 'bjj', 'muay-thai', 'boxeo', 'mma'] as const;
export const TIPOS_ARTICULO = ['guia-tecnica', 'historia', 'filosofia', 'entrenamiento'] as const;
export const NIVELES_DIFICULTAD = ['principiante', 'intermedio', 'avanzado', 'todos'] as const;

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(120),
      description: z.string().min(10, 'La descripción debe ser descriptiva').max(300),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      disciplina: z.enum(DISCIPLINAS, {
        errorMap: () => ({ message: 'Disciplina inválida. Permitidas: karate, bjj, muay-thai, boxeo, mma' }),
      }),
      tipo: z.enum(TIPOS_ARTICULO, {
        errorMap: () => ({ message: 'Tipo inválido. Permitidos: guia-tecnica, historia, filosofia, entrenamiento' }),
      }),
      dificultad: z.enum(NIVELES_DIFICULTAD).default('todos'),
      autor: z.object({
        name: z.string(),
        role: z.string().default('Instructor Marcial'),
        avatar: z.string().optional(),
      }),
      tags: z.array(z.string()).default([]),
      heroImage: z.optional(image()),
      readingTime: z.string().regex(/^\d+\s+min$/, 'Formato esperado: "X min" (ej. "6 min")'),
      featured: z.boolean().default(false),
    }),
});

export const collections = { blog };
```

### 3.2 Catálogo Canónico de Disciplinas (`src/data/disciplines.ts`)

```typescript
export interface DisciplineInfo {
  id: 'karate' | 'bjj' | 'muay-thai' | 'boxeo' | 'mma';
  name: string;
  tagline: string;
  description: string;
  origin: string;
  accentColor: string; // Tailwind class o Hex
  badgeClass: string;
  borderClass: string;
}

export const DISCIPLINES_MAP: Record<string, DisciplineInfo> = {
  karate: {
    id: 'karate',
    name: 'Karate',
    tagline: 'El camino de la mano vacía',
    description: 'Golpes percusivos, katas tradicionales, control de distancia y disciplina mental originaria de Okinawa.',
    origin: 'Okinawa, Japón',
    accentColor: '#dc2626',
    badgeClass: 'bg-red-950/80 text-red-400 border-red-800',
    borderClass: 'hover:border-red-600',
  },
  bjj: {
    id: 'bjj',
    name: 'Brazilian Jiu-Jitsu',
    tagline: 'El arte suave y el dominio del suelo',
    description: 'Sumisiones, transiciones, estrangulaciones y control posicional donde la técnica vence a la fuerza bruta.',
    origin: 'Brasil / Japón',
    accentColor: '#3b82f6',
    badgeClass: 'bg-blue-950/80 text-blue-400 border-blue-800',
    borderClass: 'hover:border-blue-600',
  },
  'muay-thai': {
    id: 'muay-thai',
    name: 'Muay Thai',
    tagline: 'El arte de las ocho extremidades',
    description: 'Uso demoledor de puños, codos, rodillas, tibias y clinch, forjado en la tradición guerrera del Reino de Siam.',
    origin: 'Tailandia',
    accentColor: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-400 border-amber-800',
    borderClass: 'hover:border-amber-600',
  },
  boxeo: {
    id: 'boxeo',
    name: 'Boxeo Clásico',
    tagline: 'La dulce ciencia del pugilismo',
    description: 'Precisión milimétrica, juego de pies, cabeceo, timing y potencia concentrada en el golpeo de puños.',
    origin: 'Inglaterra / Grecia clásica',
    accentColor: '#ef4444',
    badgeClass: 'bg-rose-950/80 text-rose-400 border-rose-800',
    borderClass: 'hover:border-rose-600',
  },
  mma: {
    id: 'mma',
    name: 'Artes Marciales Mixtas (MMA)',
    tagline: 'La síntesis total del combate moderno',
    description: 'Integración sinérgica de striking, derribos de lucha y juego de sumisión en la distancia de jaula.',
    origin: 'Global / Vale Tudo',
    accentColor: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
    borderClass: 'hover:border-emerald-600',
  },
};

export const DISCIPLINES_LIST = Object.values(DISCIPLINES_MAP);
```

### 3.3 Contratos de Interfaces de Componentes (`Props`)

#### `ArticleCard.astro`
```typescript
import type { CollectionEntry } from 'astro:content';

export interface Props {
  post: CollectionEntry<'blog'>;
  variant?: 'featured' | 'compact' | 'standard';
}
```

#### `MartialBadge.astro`
```typescript
export interface Props {
  disciplina: 'karate' | 'bjj' | 'muay-thai' | 'boxeo' | 'mma';
  size?: 'sm' | 'md' | 'lg';
}
```

#### `HeroMarcial.astro`
```typescript
export interface Props {
  title: string;
  subtitle: string;
  featuredPost?: CollectionEntry<'blog'>;
}
```

#### `FilterBar.astro`
```typescript
export interface Props {
  activeDisciplina?: string;
  totalPosts: number;
}
```

---

## 4. Decisiones Técnicas y Justificación

| Decisión Técnica | Alternativas Evaluadas | Justificación y Ventajas |
| :--- | :--- | :--- |
| **Astro Content Layer con Zod** | Astro Content Collections legacy v4, Markdown sin tipar, Headless CMS externo (Strapi/Sanity). | Astro 5 Content Layer (`src/content.config.ts`) compila a código ultra-rápido, valida integridad de tipos en build time y no impone infraestructura adicional ni costos de base de datos. |
| **Estilos Responsivos con Tailwind CSS / Clases Semánticas Marciales** | Vanilla CSS en cada archivo, CSS Modules, Styled Components. | Tailwind permite crear una paleta táctica cohesiva rápida, layouts CSS Grid responsivos fluidos y un plugin de tipografía (`@tailwindcss/typography`) que estila Markdown/MDX automáticamente. |
| **Filtros por Arte Marcial Nativos (Web Components / Vanilla JS)** | React island (`client:load`), Preact, Vue. | Cumple la política estricta **PONYTAIL**: Un script nativo de 25 líneas con data-attributes filtra el grid sin cargar bibliotecas JS de 40+ KB al cliente. |
| **Páginas canónicas por disciplina (`/artes/[disciplina]`)** | Filtrado únicamente por query parameters (`/blog?disciplina=karate`). | Las páginas dedicadas `/artes/karate`, `/artes/bjj`, etc., ofrecen URLs canónicas limpias esenciales para SEO temático y estructuración de contenidos por nicho marcial. |
| **MDX para guías técnicas** | Markdown plano (`.md`) exclusivamente. | MDX permite inyectar callouts visuales para advertencias de seguridad física en técnicas (ej. precauciones en llaves cervicales o luxaciones en BJJ). |

---

## 5. Plan de Implementación Desglosado para `devteam-frontend`

El equipo de Frontend debe ejecutar la implementación en pasos atómicos y secuenciales:

### Tarea 1: Base de Datos y Tipos
- [ ] Crear [src/data/disciplines.ts](file:///c:/Users/andre/Desktop/FORMULARIO%20TRANSPORTE/blog-artes-marciales/src/data/disciplines.ts) con el mapa completo de disciplinas, colores, etiquetas e iconos.
- [ ] Actualizar [src/content.config.ts](file:///c:/Users/andre/Desktop/FORMULARIO%20TRANSPORTE/blog-artes-marciales/src/content.config.ts) con el esquema estricto Zod (disciplina, tipo, dificultad, autor, readingTime, featured).
- [ ] Actualizar [src/consts.ts](file:///c:/Users/andre/Desktop/FORMULARIO%20TRANSPORTE/blog-artes-marciales/src/consts.ts) con el nombre canónico del blog (ej. `"DOJO & COMBAT" — Revista de Artes Marciales & Combate Multidisciplinario`).

### Tarea 2: Estilos y Sistema de Diseño "Dojo & Octagon"
- [ ] Configurar soporte para Tailwind CSS (o integrar utilidades marciales en `src/styles/global.css` con variables CSS para fondo oscuro `#0d0f12`, acentos `#dc2626`, fuentes y prose).
- [ ] Definir tokens de color e insignias para cada disciplina.

### Tarea 3: Componentes de UI Marcial
- [ ] Implementar `src/components/MartialBadge.astro`: Badge con color temático según la disciplina.
- [ ] Implementar `src/components/ArticleCard.astro`: Tarjeta responsiva con imagen optimizada (`astro:assets`), disciplina, título, extracto, autor y tiempo de lectura.
- [ ] Implementar `src/components/HeroMarcial.astro`: Bloque impactante con tipografía de alto contraste, titular y acceso a artículos clave.
- [ ] Implementar `src/components/DisciplinasGrid.astro`: Grid de 5 tarjetas interactivas que enlazan a las páginas `/artes/[disciplina]`.
- [ ] Implementar `src/components/FilterBar.astro`: Botones de selección rápida (Todas, Karate, BJJ, Muay Thai, Boxeo, MMA) con interactividad nativa en cliente.
- [ ] Modernizar `src/components/Header.astro` y `src/components/Footer.astro` con navegación en español e identidad marcial.

### Tarea 4: Contenido Inicial Multidisciplinario (5 Artículos Piloto)
- [ ] Crear artículo de Karate: `src/content/blog/karate-filosofia-dojo-kun.md` (Historia y filosofía del Dojo Kun).
- [ ] Crear artículo de BJJ: `src/content/blog/bjj-fundamentos-pasaje-guardia.mdx` (Guía técnica de conceptos de control y desestabilización).
- [ ] Crear artículo de Muay Thai: `src/content/blog/muay-thai-tecnica-teep-frontal.mdx` (Guía técnica del pateo frontal defensivo y timing).
- [ ] Crear artículo de Boxeo: `src/content/blog/boxeo-biomecanica-jab-perfecto.md` (Biomecánica y trayectoria del golpe más fundamental).
- [ ] Crear artículo de MMA: `src/content/blog/mma-evolucion-artes-marciales-mixtas.mdx` (Análisis histórico desde UFC 1 a la integración contemporánea).

### Tarea 5: Páginas y Enrutamiento
- [ ] Rediseñar `src/pages/index.astro`: Integrar `HeroMarcial`, `DisciplinasGrid`, sección de Artículos Destacados y Últimas Publicaciones.
- [ ] Refactorizar `src/pages/blog/index.astro`: Integrar `FilterBar` y grid responsivo de artículos con estado visual activo.
- [ ] Crear `src/pages/artes/[disciplina].astro`: Generación dinámica estática (`getStaticPaths`) para cada una de las 5 disciplinas.
- [ ] Rediseñar `src/layouts/BlogPost.astro`: Cabecera de artículo con metadatos completos (disciplina, autor con rol, tiempo de lectura, fecha formateada, tags) y estilos tipográficos limpios.
- [ ] Reescribir `src/pages/about.astro`: "Filosofía y Misión Marcial", destacando respeto, perseverancia, autosuperación y el puente entre tradición y combate moderno.

---

## 6. Riesgos Técnicos y Criterios de Aceptación

### 6.1 Riesgos Técnicos y Mitigaciones
1. **Validación de imágenes locales en `image()` de Astro:**
   - *Riesgo:* Si los artículos frontmatter apuntan a rutas de imagen inexistentes, `astro build` fallará.
   - *Mitigación:* Hacer `heroImage` opcional en Zod (`z.optional(image())`) y proveer placeholders limpios o componentes fallback condicionales en `ArticleCard.astro` y `BlogPost.astro`.
2. **Hidratación innecesaria en cliente:**
   - *Riesgo:* Utilizar frameworks pesados que perjudiquen la puntuación Core Web Vitals (LCP/FID).
   - *Mitigación:* Mantener 0 KB de JavaScript en páginas estáticas; el filtrado en cliente debe resolverse con Vanilla JS estándar y eventos `click` delegados.
3. **Colisión de URLs:**
   - *Riesgo:* Slugs confusos o duplicados entre posts y disciplinas.
   - *Mitigación:* Usar la convención `/artes/[disciplina]` para categorías y `/blog/[...slug]` para artículos individuales.

### 6.2 Criterios de Aceptación Verificables
- [ ] `npm run build` o `npx astro check` compila exitosamente sin errores de tipos Zod ni rutas rotas.
- [ ] La página de inicio (`/`) renderiza las 5 disciplinas marciales (Karate, BJJ, Muay Thai, Boxeo, MMA).
- [ ] Cada artículo posee metadatos visibles: Insignia de disciplina con su color característico, tiempo de lectura estimado, autor y fecha.
- [ ] Los filtros en `/blog` permiten alternar entre las diferentes disciplinas de forma inmediata sin recargar la página.
- [ ] La página `/about` contiene texto original centrado en la filosofía del Budo y el entrenamiento multidisciplinario en español.
