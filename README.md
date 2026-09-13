# Poetry IDE

Editor web de poesía en español con análisis métrico y prosódico mientras escribes. Explora el ritmo, revisa la rima y compara versiones de un poema con un motor determinista escrito en TypeScript que se ejecuta en el navegador.

## Inicio rápido

Entorno recomendado: **Node.js 24.12 o posterior de la rama 24**, **pnpm 10** y Git. Los scripts usan sintaxis de shell POSIX; en Windows puedes ejecutarlos desde WSL.

```bash
git clone https://github.com/luismarrer/poetry-ide.git
cd poetry-ide
pnpm install --frozen-lockfile
pnpm dev
```

Abre [localhost:4321](http://localhost:4321). La aplicación no requiere cuentas, claves de API ni variables de entorno para ejecutarse en local.

## Qué puedes hacer

- **Escribir con análisis en tiempo real.** El margen del editor muestra el número de línea, las sílabas métricas y el esquema de rima.
- **Inspeccionar cada verso.** Consulta la separación silábica, las sílabas tónicas, las sinalefas, los acentos rítmicos y el ajuste por acento final: +1 para agudas, 0 para llanas y −1 para esdrújulas.
- **Decidir cómo leerlo.** Activa o desactiva las sinalefas detectadas, fija un conteo métrico manual y compara el resultado con el cálculo automático sin cambiar el texto.
- **Trabajar en verso libre o silva.** El modo Silva destaca los versos de 7 y 11 sílabas y señala los que quedan fuera de esas medidas.
- **Explorar rimas consonantes y asonantes.** Alterna el esquema de rima y busca palabras en el diccionario poético local, con filtros por cantidad de sílabas.
- **Comparar borradores.** Crea, duplica, renombra y elimina versiones. La vista dividida permite editar dos versiones a la vez, inspeccionar el panel activo y copiar el contenido entre ambos.
- **Consultar estadísticas.** Revisa versos, estrofas, palabras, distribución de longitudes métricas, esquema de rima y porcentaje de versos de 7 u 11 sílabas en modo Silva.
- **Organizar el texto.** Añade títulos, encabezados y comentarios, carga ejemplos y alterna entre los temas claro y oscuro.

## Primeros pasos en el editor

1. Escribe un poema o carga uno desde **Ejemplos…**. Cargar un ejemplo reemplaza el texto y las decisiones métricas de la versión activa.
2. Elige **Libre** o **Silva** y coloca el cursor en un verso para consultar su inspector.
3. Ajusta las sinalefas o el conteo manual cuando quieras representar otra lectura. **Restablecer** devuelve ese verso al cálculo automático.
4. Selecciona **Consonante** o **Asonante** para explorar las correspondencias de rima. Insertar una sugerencia añade la palabra al final del verso activo.
5. Duplica una versión y abre la vista de dos paneles para probar cambios. Si solo existe una versión al activar la división, se crea una copia automáticamente.

El botón **Sinalefas** muestra u oculta sus marcas en el editor; el cálculo métrico se mantiene activo.

### Títulos y comentarios

Los encabezados de uno a seis signos `#`, seguidos de un espacio, y los comentarios con `//` o `%` quedan excluidos del conteo métrico y de la rima. Los comentarios también pueden escribirse al final de un verso; en ese caso, `%` debe ir precedido de un espacio:

```text
# Borrador
## Primera estrofa
// Probar otra lectura del último verso
Pasos de un peregrino son, errante,
cuantos me dictó versos dulce musa, % revisar esta imagen
en soledad confusa,
```

Usa **Cmd + /** en macOS o **Ctrl + /** en otros sistemas para añadir o quitar comentarios `//` en las líneas seleccionadas.

### Guardado local

El título, las versiones, las decisiones métricas y las preferencias se guardan automáticamente en `localStorage`, bajo la clave `poetry_ide_state_v1`. Persisten al recargar en el mismo navegador y origen; no se sincronizan entre dispositivos. Borrar los datos del sitio elimina ese estado.

El análisis y las sugerencias de rima se calculan en el navegador, sin servicios de IA ni consultas a un diccionario remoto. Las tipografías se cargan desde Google Fonts.

## Desarrollo

La interfaz usa **Astro 5**, **React 19**, **CodeMirror 6** y **Tailwind CSS 3**. El motor de `src/poetry/` es TypeScript puro, independiente de la interfaz.

| Comando | Función |
| --- | --- |
| `pnpm dev` | Inicia el servidor de desarrollo. |
| `pnpm start` | Alias del servidor de desarrollo. |
| `pnpm check` | Revisa tipos y diagnósticos de Astro. |
| `pnpm build` | Ejecuta `astro check` y genera la compilación de producción. |
| `pnpm preview` | Sirve la compilación de producción en local. |
| `pnpm test` | Ejecuta las pruebas unitarias una vez con Vitest. |
| `pnpm test:watch` | Ejecuta Vitest en modo de observación. |
| `pnpm test:e2e` | Ejecuta las pruebas de navegador con Playwright. |

### Pruebas de navegador

Playwright está configurado para Chromium de escritorio y una emulación móvil de Pixel 5. **No inicia el servidor automáticamente.** Instala el navegador e inicia la aplicación en una terminal:

```bash
pnpm exec playwright install chromium
pnpm dev --host 127.0.0.1
```

En otra terminal, desde la raíz del proyecto:

```bash
pnpm test:e2e
```

Por defecto, las pruebas usan `http://127.0.0.1:4321`. Si el servidor está en otra dirección o puerto, indica su URL:

```bash
BASE_URL=http://127.0.0.1:4322 pnpm test:e2e
```

### Compilación de producción

```bash
pnpm build
pnpm preview
```

La configuración actual genera un sitio estático (`output: 'static'`) e incluye el adaptador de Vercel. Puedes revisar estos ajustes en [astro.config.mjs](astro.config.mjs).

### Estructura del proyecto

```text
src/
├── components/          # Interfaz React
│   ├── editor/          # CodeMirror, versiones, vista dividida y extensiones
│   ├── inspector/       # Análisis del verso y sugerencias de rima
│   ├── stats/           # Estadísticas del poema
│   ├── topbar/          # Forma, rima, ejemplos y tema
│   ├── statusbar/       # Resumen del análisis activo
│   └── PoetryApp.tsx    # Estado, persistencia y coordinación de la interfaz
├── poetry/              # Motor de análisis independiente de React
│   ├── phonology/       # Vocales, consonantes y limpieza del texto
│   ├── syllabification/ # Separación silábica y acentuación
│   ├── meter/           # Sinalefas, acento final y decisiones manuales
│   ├── rhythm/          # Posiciones de los acentos rítmicos
│   ├── rhyme/           # Rima consonante, asonante y diccionario local
│   ├── forms/           # Verso libre y silva
│   ├── lint/            # Reglas y diagnósticos poéticos
│   ├── versions/        # Modelo y creación de versiones
│   └── index.ts         # API pública del motor: analyzePoem y exportaciones
├── data/                # Poemas de ejemplo
├── layouts/             # Documento base y tipografías
├── pages/               # Entrada de Astro
└── styles/              # Estilos globales y temas
tests/
├── unit/                # Silabeo, métrica, rima, formas y versiones
└── e2e/                 # Flujos del editor y gestión de versiones
```

## Alcance del análisis

El motor aplica reglas de silabeo, sinalefa, acentuación y rima. El resultado es una propuesta de lectura: las licencias poéticas y la pronunciación pueden requerir ajustes manuales. El modo Silva comprueba las medidas de 7 y 11 sílabas; su porcentaje de conformidad expresa esa coincidencia métrica.

Las sugerencias de rima proceden del vocabulario incluido en el repositorio y su cobertura es limitada. Las decisiones métricas se asocian a índices de línea y de palabras; conviene revisarlas si insertas, eliminas o reordenas texto.
