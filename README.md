# Poetry IDE — IDE para Poesía en Español

Un entorno de desarrollo integrado (IDE) web moderno y minimalista para poetas y escritores en lengua española. Ofrece análisis prosódico y métrico en tiempo real con un motor determinista en TypeScript puro, gutter reactivo con conteo silábico, inspector de verso con overrides poéticos manuales, modo Silva y rima consonante.

## Características

* **Análisis prosódico en tiempo real**: Sin botones de "analizar". El conteo métrico se actualiza mientras se escribe.
* **Gutter métrico**: Visualiza el número de verso y las sílabas métricas calculadas en el margen izquierdo (`1 7`, `2 7`, `3 11`).
* **Modo Silva**: Reconoce y destaca heptasílabos (7) y endecasílabos (11), señalando discretamente versos fuera de estructura con sugerencias no intrusivas.
* **Inspector de verso**:
  * Desglose completo de sílabas gramaticales vs. métricas.
  * Separación silábica visual con detección de sílabas tónicas.
  * Detección de sinalefas intervocálicas (incluyendo `h` muda y `y` vocálica).
  * **Decisiones métricas manuales (overrides)**: Alterna entre sinalefa y hiato sin modificar el texto original. Compara `algoritmo: 10` frente a `con tus decisiones: 11`.
  * Ley del acento final (+1 aguda, 0 llana, -1 esdrújula).
  * Acentos rítmicos del verso (e.g. `2 · 6 · 10`).
  * Extracción de rima consonante y asignación de esquema (A, B, A, —, B).
* **Motor desacoplado**: Motor lingüístico en `src/poetry/` implementado en TypeScript puro sin dependencias de frameworks.
* **Local-first**: Persistencia automática en el navegador (`localStorage`).
* **Diseño tipográfico cuidado**: Tipografía editorial (Lora, Inter, JetBrains Mono) con soporte para temas Claro y Oscuro.

## Estructura del Proyecto

```
src/
├── poetry/                        # Motor lingüístico determinista puro (TypeScript)
│   ├── phonology/                 # Vocales, consonantes, dígrafos, limpieza y tokenización
│   ├── syllabification/           # Silabeo gramatical determinista según normas RAE
│   ├── meter/                     # Métrica poética, sinalefas, compensación final y overrides
│   ├── rhythm/                    # Acentos rítmicos métricos
│   ├── rhyme/                     # Rima consonante y esquematización
│   ├── forms/                     # Estructuras poéticas (Libre, Silva)
│   ├── lint/                      # Motor de linter y reglas poéticas
│   └── index.ts                   # Punto de entrada del motor
├── components/                    # Componentes React (Islands de Astro)
│   ├── editor/                    # CodeMirror 6 + Gutter interactivo
│   ├── inspector/                 # Panel de inspección y overrides de verso
│   ├── topbar/                    # Selector de forma, sinalefas, temas y ejemplos
│   ├── statusbar/                 # Barra de estado inferior estilo IDE
│   ├── stats/                     # Modal de estadísticas poéticas
│   └── PoetryApp.tsx              # Componente principal
└── pages/index.astro              # Punto de entrada Astro
```

## Scripts

```bash
# Desarrollo local
pnpm dev

# Compilar para producción
pnpm build

# Ejecutar tests unitarios (Vitest)
pnpm test

# Ejecutar tests end-to-end (Playwright)
pnpm test:e2e
```
