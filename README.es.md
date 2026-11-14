<div align="center">

<img src="assets/banner.svg" alt="Lọ Chéo — Gran Guerra de la Orza de Encurtidos" width="100%" />

# LỌ CHÉO — LA GRAN GUERRA DE LA ORZA

### 🫙 Arcade vietnamita de encurtidos que corre 100% en el navegador — un único HTML, offline-first
### 🌐 UI del juego en 7 idiomas — Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français

[🇻🇳 Tiếng Việt](README.md) · [🇬🇧 English](README.en.md) · [🇨🇳 中文](README.zh.md) · [🇯🇵 日本語](README.ja.md) · [🇰🇷 한국어](README.ko.md) · [🇪🇸 Español](README.es.md) · [🇫🇷 Français](README.fr.md) · [🇹🇭 ไทย](README.th.md) · [🇩🇪 Deutsch](README.de.md) · [🇵🇹 Português](README.pt.md)

[![Version](https://img.shields.io/badge/version-1.1.8-f5a81c.svg?style=for-the-badge&logo=semver&logoColor=black)](docs/releases/v1.1.8.md)
[![Tier](https://img.shields.io/badge/tier-PATCH%20%C2%B7%20violet-9d6bff.svg?style=for-the-badge)]
[![Tests](https://img.shields.io/badge/tests-948%20%C2%B7%2090%20files-2bb48c.svg?style=for-the-badge&logo=vitest&logoColor=white)]
[![CI](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml/badge.svg)](https://github.com/standardizeparadigm/Lo-CheoIO/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0--only-e63b2e.svg?style=for-the-badge)](LICENSE)
[![Offline](https://img.shields.io/badge/offline--first-100%25-2bb48c.svg?style=for-the-badge)](#-instalación-y-ejecución)
[![Single File](https://img.shields.io/badge/single--file-HTML-8cc63f.svg?style=for-the-badge)](#-build-de-producción)
[![Languages](https://img.shields.io/badge/UI-VI%20%C2%B7%20EN%20%C2%B7%20ZH%20%C2%B7%20JA%20%C2%B7%20KO%20%C2%B7%20ES%20%C2%B7%20FR-ffc94a.svg?style=for-the-badge&logo=googletranslate&logoColor=black)](#-cambiar-de-idioma)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ffc94a.svg?style=for-the-badge)](CONTRIBUTING.md)

<img src="assets/demo.svg" alt="Lọ Chéo en acción — la orza avanza en diagonal, atrapa encurtidos y despedaza moho" width="100%" />

<img src="assets/languages.svg" alt="7 idiomas — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

<img src="assets/palette-ribbon.svg" alt="La paleta de Lọ Chéo — siete bandas que respiran por turnos (animación SMIL)" width="100%" />

</div>

---

## 🥒 Sobre el proyecto

> Lọ Chéo — La Gran Guerra de la Orza: un arcade de encurtidos que corre 100% en el navegador, empaquetado en un único archivo HTML autocontenido, offline-first — sin CDN, sin servidor. La orza de cerámica solo sabe moverse en **diagonal**: mantén dos teclas para zigzaguear, acelerar y despedazar moho, moscas y orugas; llena la orza antes de que la cerámica se raje en tres. **9 modos · 14 ingredientes · 16 logros · ranking TOP 8 · UI en 7 idiomas.**

Es un **arcade de acción de pantalla única** inspirado en los humildes encurtidos vietnamitas. Sin niveles lineales ni menús recargados: solo la orza, una lluvia infinita de verduras y tus reflejos en llamas.

<img src="assets/divider.svg" alt="" width="100%" />

## 🆕 Novedades de v1.1.8

> El **parche final** antes de 1.2.0. Sin modo nuevo, sin cambios de balance, sin cambios en el formato de guardado. Esta última ronda hace una cosa: **el hero mide la ventana y elige su propio diseño** — en todos los tamaños, sin scroll ni recortes. La banda del deck desaparece y los 20 SVG se redibujan.

### 📐 Una suma que nadie vigilaba — y cuatro errores a la vez

La captura informaba de cuatro problemas, pero tenían **una** sola causa. La fila de paneles de esquina y el ticker eran hermanos flex con `shrink-0`, así que tomaban su altura primero y al hero solo le llegaba lo que sobraba:

```
ventana de 720px
├── 415px   fila de paneles GAME/INFO  (alto según el contenido, shrink-0)
├──  55px   ticker                     (alto según el texto, shrink-0)
└── 250px   hero                       ← el resto, cuando necesita ~430px
```

| Síntoma en la captura | Por qué |
| --- | --- |
| `LỌ` cortado en el borde superior | hero de 250px, contenido de 430px |
| `CÀI ĐẶT` desbordando el panel | el panel se dimensionaba por contenido, no por la ventana |
| La línea de copyright partida en dos | el ticker necesitaba 55px y recibía 48px |
| La `×` del «Cómo jugar» flotando en mitad de la pantalla | el acordeón que la contenía ya había salido de la vista |

La solución no fue añadir unos píxeles de holgura, sino **declarar la altura una vez y hacer que todo la vuelva a leer**: `layout/metrics.ts` guarda cada número, `layout/fit.ts` devuelve un `MenuPlan` puro, `MenuChrome` es una sola banda `absolute inset-x-0 bottom-0`, y el hero reserva su espacio con un `padding-bottom` calculado por la **misma** función.

<img src="assets/layout-fix.svg" alt="Antes y después del parche 1.1.8 — 1.1.7 comprimía la escena a 250px y cortaba el tarro, 1.1.8 mantiene una escena de 342px y reserva 378px para los paneles (animación SMIL)" width="100%" />

### 🌀 El error de scroll: un contenedor de scroll dentro de otro

La parte inferior se quedaba quieta y la superior seguía subiendo y bajando — exactamente como se describió. v1.1.7 envolvió el contenido del hero en una caja `overflow-y-auto` y lo centró con `min-h-full` + `justify-center`. Eso solo funciona mientras el contenido es **más bajo** que la caja; cuando es **más alto**, `justify-center` lo empuja hacia arriba y su borde superior queda *por encima del origen del scroll* — ninguna posición de scroll puede alcanzarlo.

Ahora toda la pantalla tiene **un** contenedor de scroll (`.menu-scroll`), con el contenido anclado arriba y sin centrado vertical. Las tres clases que causaron el fallo —`flex-1 overflow-y-auto`, `min-h-full`, `justify-center`— están prohibidas por `tests/menu-layout.test.ts`.

### 🎯 Hero: `LỌ CHÉO` centrado y subido un poco

- El logotipo queda **centrado en horizontal** y luego **subido**, como se pidió, con el tamaño limitado por **ancho y alto** a la vez, para que una ventana baja no desborde el glifo.
- El tarro de cerámica se movió a la derecha, rodeado de **tres anillos de halo a 18s / 26s / 34s** — el anillo único de 14s se leía como un spinner de carga.
- **Catorce adornos** (estrellas, chispas, aros, burbujas, chiles, hojas de lima, moscas, gotas de salsa de pescado) en dos franjas arriba y abajo del título, cada uno con su duración y retardo — la respuesta a *«solo la palabra y el tarro es muy poco»*.
- Las coordenadas son **datos** en `scene/decor.ts` con una función de colisión, así que `tests/menu-decor.test.ts` fija posición y cantidad.

### 📖 El «Cómo jugar» se muda al menú GAME

Las seis reglas y la tabla de teclas ya no viven en el hero — abrirlas empujaba el `LỌ` fuera de la pantalla. Ahora son **una fila del panel GAME** que abre un modal (`HowToModal`), de modo que el diseño no se mueve ni abierto ni cerrado. La `×` perdida desapareció junto con el acordeón que la generaba.

### 🗂️ El proyecto gana más carpetas

```
src/components/menu/
├── layout/          metrics.ts · fit.ts · useMenuPlan.ts       ← NUEVO: cada número en un sitio
├── scene/           decor.ts · DecorGlyph · HeroDecor · JarHalo ← NUEVO: el hero decorado
├── ticker/          strings.ts · tickerTone.ts · MenuTicker     ← NUEVO: la banda como módulo
├── howto/           rules.ts                                    ← NUEVO: 6 reglas + tabla de teclas
├── background/      layers.ts · MenuBackground                  ← 8 capas de fondo como datos
└── MenuChrome.tsx · HowToModal.tsx                              ← NUEVO: la banda inferior + modal
```

### 🐛 Correcciones

| # | Error | Corrección |
| --- | --- | --- |
| 1 | La parte de arriba seguía haciendo scroll con la de abajo quieta | fuera la caja anidada: **un** `.menu-scroll` anclado arriba |
| 2 | `LỌ` cortado en el borde superior | el hero conserva una escena de 342px y no se comprime a 250px |
| 3 | `CÀI ĐẶT` desbordando el panel GAME | `CornerPanel.height` pasa a ser **obligatorio**: 318px (compacto) / 458px (rico) |
| 4 | Línea de copyright partida en dos | ticker fijo de 48px, copyright dentro del bloque del marquesina |
| 5 | La `×` del «Cómo jugar» flotando | acordeón → modal, nada `absolute` sobre una caja ya desplazada |
| 6 | La altura del panel dependía del idioma (alemán y tailandés desbordaban antes) | altura declarada, independiente del contenido |
| 7 | Un anillo de 14s se leía como spinner | tres anillos a 18s / 26s / 34s que casi nunca coinciden |
| 8 | Documentación/SVG/lanzadores desfasados | barrido de 10 README + docs + 19 SVG → 1.1.8 |

→ Detalles completos: [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) · Versión anterior: [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md)

### 🪟 Dos capturas, una ventana, 260 píxeles de diferencia

Las dos últimas capturas de esta ronda son **la misma aplicación**: `1920×1080` a pantalla completa y `1920×820` en ventana. El ancho no cambió ni un píxel. Pero en la segunda, la mitad inferior del hero queda **debajo** de los dos paneles de esquina y el chip `CHẾ ĐỘ CHƠI` aparece cortado por la mitad.

La causa no es falta de altura. Es la pregunta equivocada:

| Qué decide el diseño | Sabe | No sabe |
| --- | --- | --- |
| `sm:` · `lg:` en CSS | el **ancho** | el **alto** |
| `plan.minimal` | el **alto** (bajo 220px) | el ancho, y solo cuando ya es tarde |
| `heroLayout()` (nuevo) | **ambos**, desde el mismo número que usa el chrome | — |

Una decisión que depende de *dos ejes* no se puede escribir como una media query de un eje. Así que el diseño del hero salió del CSS y se volvió una función pura:

```ts
export function heroLayout({ scene, width, minimal }: HeroInput): HeroLayout {
  if (minimal) return { sideBySide: false, halo: false, badgeRow: false, mascot: false, liveBadge: false };

  const sideBySide = width >= WIDTH_FOR_SIDE_BY_SIDE && scene >= HEIGHT_FOR_SIDE_BY_SIDE;

  return {
    sideBySide,
    halo:       scene >= HEIGHT_FOR_HALO,
    badgeRow:   scene >= HEIGHT_FOR_BADGE_ROW,
    mascot:     true,          // el logo nunca se oculta
    liveBadge:  scene >= HEIGHT_FOR_BADGE_ROW,
  };
}
```

`scene` es la altura que `planMenuLayout()` asignó al hero — **el número exacto** que el chrome reserva. No puede desviarse, porque ambos leen de una sola función.

#### Tres umbrales, los tres derivados

Aquí no hay un solo número redondo. Cada constante es la altura real de lo que controla:

| Constante | Valor | Derivada de |
| --- | --- | --- |
| `HEIGHT_FOR_BADGE_ROW` | **232** | wordmark 150 + badge 40 + live badge 22 = 212, más 20px de aire |
| `HEIGHT_FOR_HALO` | **300** | lockup 150 + anillo 240 − solape 90 |
| `HEIGHT_FOR_SIDE_BY_SIDE` | **300** | la columna más alta: mascota 192 + chip 24 + relleno |

`232` es un **error que se atrapó**. El primer borrador lo puso en `210` — por debajo del mismo lockup de 212px que controla. Una banda de 210px dibujaba un lockup de 212 y la línea de récord quedaba cortada. Exactamente la clase de error que esta ronda corrige, producido por la propia corrección.

`tests/menu-adaptive.test.ts` recorre **1.682 viewports** — cada combinación de 15 anchos reales × 13 altos reales, y luego un paso por `320..3840` × `150..700` — y verifica `heroContentHeight(layout) ≤ scene` en cada muestra.

#### El cuarto evento que faltaba

El usuario produjo esas dos capturas **pulsando la tecla de pantalla completa**. La app escuchaba `resize` y `orientationchange`. Firefox no dispara ninguna de las dos al alternar pantalla completa; Safari antiguo solo dispara `webkitfullscreenchange`.

Así que la ventana cambió de alto, el hero conservó su plan viejo, y el chip siguió cortado hasta el siguiente resize.

```ts
export const VIEWPORT_EVENTS = [
  "resize",
  "orientationchange",
  "fullscreenchange",
  "webkitfullscreenchange",
  "mozfullscreenchange",
  "MSFullscreenChange",
] as const;
```

La lista vive en un solo lugar, porque `useMenuPlan()` y `useViewportWidth()` **ambos** la necesitan — y cada uno registraba su propia copia, es decir dos copias que pueden describir dos ventanas distintas.

### 🗑️ La banda divisoria de la imagen 12 — y el deck que se fue con ella

La tercera imagen es una tira de `1443×180` recortada del centro de la pantalla: un marcador `🎮`, una línea dorada y tres títulos `GAME / RETO DE HOY / REGLA DEL DÍA`. Ese es el **deck** — tres columnas de prosa dentro de una banda de altura fija.

No puede vivir ahí, y las otras dos capturas dicen por qué: a `1920×1080` su columna derecha se cortaba **a mitad de frase**, a `1920×820` toda la fila quedaba bajo los paneles. Una banda suficientemente alta para un wordmark de 200px no lo es también para tres párrafos.

Nada de lo que decía el deck se pierde:

| Qué decía el deck | Dónde vive ahora |
| --- | --- |
| el modo que vas a jugar | el chip bajo la mascota; la lista completa está en GAME |
| **el reto de hoy** | una línea en el panel INFO — `modo · objetivo` |
| la regla del día | una línea del modal de instrucciones, que siempre fue la versión completa de esas seis reglas |

Las cuentas de fecha **no** se fueron con él. `challengeFor()` y `tipIndexFor()` se mudaron a `src/game/daily/` — son funciones puras del día local, sin relación con la presentación. Las 21 pruebas se mudaron con ellas, conservando sus nombres.

La banda vacía bajo el wordmark ahora es **deliberada**. Ese es el precio de un hero que encaja en cualquier tamaño.

### 🏷️ Changelog por niveles — un color por nivel

| Nivel | Etiqueta | Color | Significado | Ejemplo |
| --- | --- | --- | --- | --- |
| `major` | **MAJOR** | 🩷 rosa `#ff5fb0` | versión grande — sistemas nuevos | 1.0.0 |
| `minor` | **UPDATE** | 🟡 oro `#f5a81c` | mejora — contenido nuevo | 1.1.0 |
| `patch` | **PATCH** | 🟣 violeta `#9d6bff` | correcciones y limpieza | 1.1.1 → **1.1.8** |

El nivel se **deriva del SemVer** con `tierFor(version)`, nunca se escribe a mano. El panel añade un **filtro**: TODO · MAJOR · UPDATE · PATCH con el recuento por nivel.

<img src="assets/release-tiers.svg" alt="Los tres niveles MAJOR/UPDATE/PATCH con sus colores y la línea de tiempo de diez versiones (animación SMIL)" width="100%" />

<img src="assets/test-matrix.svg" alt="Matriz de pruebas 1.1.8 — 948 tests en 90 archivos, nueve puertas (animación SMIL)" width="100%" />

<img src="assets/corner-menu.svg" alt="Paneles GAME (abajo-izquierda) e INFO (abajo-derecha) deslizándose (animación SMIL)" width="100%" />

<img src="assets/settings-sections.svg" alt="Ajustes en seis secciones (desde v1.1.6) — interruptores, barras de nivel y selectores (animación SMIL)" width="100%" />

## 📐 Diseño adaptable — cómo el hero elige su forma

La pantalla de inicio no usa media queries para decidir su diseño. **Mide** la ventana y elige entre cinco capacidades: `sideBySide`, `halo`, `badgeRow`, `mascot`, `liveBadge`.

El flujo tiene dos etapas, ambas puras:

```
planMenuLayout(viewport) → { scene, reserve, … }    scene + reserve = altura
            │
            └─ scene es el número exacto que reserva el chrome
                        │
    heroLayout({ scene, width }) → 5 booleanos
```

| Bandera | Activa cuando | Qué desaparece si está apagada |
| --- | --- | --- |
| `sideBySide` | ancho ≥ 1024 **y** hero ≥ 300px | la mascota baja bajo el wordmark |
| `halo` | hero ≥ 300px | el anillo alrededor del tarro |
| `badgeRow` | hero ≥ 232px | la placa «HŨ DƯA ĐẠI CHIẾN» y la línea de récord |
| `mascot` | casi siempre | — (solo se oculta en la economía mínima) |
| `liveBadge` | hero ≥ 232px | la línea EN DIRECTO DESDE LA COCINA y la versión |

Los tres umbrales **no son números redondos** — cada uno es la altura real de lo que controla:

```ts
HEIGHT_FOR_BADGE_ROW    = 232  // 150 wordmark + 40 placa + 22 live + 20 aire
HEIGHT_FOR_HALO         = 300  // 150 lockup + 240 anillo − 90 solape
HEIGHT_FOR_SIDE_BY_SIDE = 300  // columna más alta: 192 mascota + 24 chip
```

`tests/menu-adaptive.test.ts` recorre **1.682 viewports** y verifica `heroContentHeight(layout) ≤ scene` en cada muestra. Al redimensionar, ambos hooks escuchan **seis** eventos y actualizan en un solo frame.

### 🌍 La segunda capa: entorno, no solo tamaño

La altura de la ventana no es la altura utilizable. En un iPhone la barra de
direcciones y el indicador de inicio se comen una parte; al hacer zoom,
`visualViewport` es menor que `innerHeight`. Por eso hay una capa aparte, pura y
sin React (`src/components/menu/adaptive/environment.ts`):

```ts
type Environment = {
  dpr: number;            // acotado a [1, 4]
  landscape: boolean;
  coarse: boolean;        // un dedo, no un ratón
  insetTop / Right / Bottom / Left: number;
  reducedMotion: boolean;
};
```

Cuatro cosas fáciles de hacer mal, y qué se hizo en su lugar:

1. **`env()` no se puede leer con `getComputedStyle`.** Hace falta un elemento que
   *use* `env(safe-area-inset-*)` para que su padding calculado signifique algo.
   La primera versión creaba **cuatro** sondas (una por borde) — cuatro layouts
   forzados en cada resize. Ahora es **una** sonda con cuatro paddings, retirada
   en un bloque `finally` para que un error no la deje suelta.
2. **`pointer: coarse` puede cambiar sin ningún `resize`.** Un portátil híbrido
   alterna ratón y dedo todo el tiempo. El hook escucha **ambas** media queries,
   no solo `resize`.
3. **El inset `0` es legítimo.** El helper `sane()` de los demás campos numéricos
   tiene suelo 1 — reutilizarlo para el inset convierte «sin notch» en «notch de
   1px».
4. **El inset se resta de la altura utilizable, nunca de la escena.**
   `usableHeight(h, inset) = clamp(h − inset, 1, ∞)`, y tanto `planFits` como
   `occupiesExactly` pasan por ahí, así que no pueden discrepar.

`tests/environment.test.ts` cubre `saneDpr` (también `NaN`, `−1`, `7`),
`parseInset`, `verticalInset` e `isHandheld`; `tests/use-environment.test.ts`
construye objetos `window` y `document` falsos (sin jsdom), así que también cubre
un `matchMedia` que **lanza** y un documento **sin body**.

### ⚠️ Una limitación conocida — registrada, no escondida

En **844×600**, una ventana sin inset da al hero 222px; con un inset de 10px le
da **268px**. Una ventana más pequeña recibe un hero 46px más alto. La causa es
que la altura total se reparte por umbrales discretos, y un inset pequeño empuja
la suma por encima de uno de ellos, lo que cambia la economía.

Es un defecto **real, pequeño y ya existente**. Se intentó una búsqueda de ocho
economías para maximizar `scene` — **falla**: a 1920×1080 quita el ticker y las
filas altas, es decir justo lo que ve el jugador. Se revirtió. En su lugar,
`tests/layout-inset.test.ts` **afirma los números medidos** (222 → 268, +46) como
un test en verde: quien lo arregle romperá el test y tendrá que actualizarlo, y
mientras tanto al menos está escrito. Al lado está la invariante que sí se
cumple: dentro de *una* economía, `scene + reserve === usableHeight` (252
combinaciones comprobadas).

## ✨ Lo destacado

| Grupo | Detalles |
| --- | --- |
| 🎮 **9 modos de juego** | **ENCURTIDO CLÁSICO** (equilibrado) · **ZEN** (sin peligros, ×0.5) · **INFIERNO DE CHILE** (+35% velocidad, ×1.5) · **60 SEGUNDOS** (contrarreloj 60 s, ×1.25) · **FIEBRE DE ORO** (botín dorado ×2.6) · **LLUVIA DE CONSERVAS** (densidad ~1.4×, ×0.75) · **CERÁMICA FINA** (una grieta es fatal, ×2.0) · **FESTIVAL DE COMBOS** (ventana ×2, ×1.15) · **GRAN FESTÍN** (densidad ~×2, tarro ×2.5, ×0.6) |
| 🌐 **i18n en el juego** | Tiếng Việt · English · 中文 · 日本語 · 한국어 · Español · Français — `src/i18n/` (módulo puro + puente React), `t()` con interpolación, sincroniza `<html lang>`, números por locale (vi-VN / en-US / zh-CN / ja-JP / ko-KR / es-ES / fr-FR) |
| 🕹️ **Mecánica AL CORTE exclusiva** | Mantén 2 teclas/ejes en diagonal — la orza acelera, brilla y despedaza peligros. Barra de stamina dedicada con histéresis anti-parpadeo |
| 🥬 **14 ingredientes** | Berenjena, chile, ajo, jengibre, sal, mostaza, **MOSTAZA DORADA** (llena la orza rápido) · SAL/AJO DORADO · CHILE INFERNAL · HIELO · MOHO, MOSCA, **ORUGA** (peligros) |
| 🧄 **Escudo de Ajo Dorado** | Mejora: apila hasta **2 cargas** que absorben las grietas; un halo giratorio orbita la orza |
| 🏆 **16 logros** | Guardados **entre partidas** (localStorage), con aviso «¡NUEVO LOGRO!» en la pantalla de fin |
| 🔊 **Audio artesanal** | 11 efectos sintetizados con Web Audio API (cero archivos) + pentatónica que modula con el nivel; silencio con `M` |
| 💾 **Clasificación TOP 8** | Guardado local, validado y normalizado al leer, nombres en mayúsculas automáticas, highlight para el récord recién marcado |
| 🎨 **Gráficos 60fps** | Canvas 2D, presupuesto de 460 partículas, DPR tope 2, suelo de losetas pre-renderizado offscreen, titileo de estrellas + aurora en el menú |
| 📴 **Offline-first de verdad** | Fuentes auto-alojadas (subsets latin + vietnamita, woff2), sin CDN ni APIs — abre `dist/index.html` y a jugar |
| 🧪 **Calidad** | 948 tests unitarios (vitest) para modes / achievements / storage / i18n / settings — `npm run check` es la puerta de CI |

<img src="assets/items.svg" alt="Los 14 ingredientes — encurtidos para atrapar, poderes dorados para agarrar, peligros para esquivar" width="100%" />

## 🌐 Cambiar de idioma

Lọ Chéo incluye **7 idiomas de interfaz**, aplicados al instante — sin recargar, sin perder la partida:

<img src="assets/languages.svg" alt="7 idiomas — VI · EN · 中文 · 日本語 · 한국어 · Español · Français" width="100%" />

| Idioma | Dónde | Guardado en |
| --- | --- | --- |
| 🇻🇳 Tiếng Việt | botón **VI** (predeterminado; sigue el idioma del navegador) | `locheo.lang.v1` |
| 🇬🇧 English | **EN** botón | `locheo.lang.v1` |
| 🇨🇳 中文 | **中** botón | `locheo.lang.v1` |
| 🇯🇵 日本語 | **日** botón | `locheo.lang.v1` |
| 🇰🇷 한국어 | **한** botón | `locheo.lang.v1` |
| 🇪🇸 Español | **ES** botón | `locheo.lang.v1` |
| 🇫🇷 Français | **FR** botón | `locheo.lang.v1` |

- Cambia el idioma en **Ajustes → IDIOMA** (rejilla de 7 botones con bandera) — un único lugar, sin selector flotante sobre el menú.
- Todas las cadenas visibles viven en `src/i18n/locales/{vi,en,zh,ja,ko,es,fr}.ts` — motor canvas, pantallas, HUD, popups, ticker, pistas.
- ¿Falta una clave? `t()` cae al vietnamita — los siete juegos de claves (y sus placeholders) los garantizan los tests.

## 🕹️ Controles

| Acción | Teclado | Táctil |
| --- | --- | --- |
| Mover | `W` `A` `S` `D` o `← ↑ ↓ →` | Arrastra en cualquier parte (joystick flotante) |
| **Corte diagonal (CHÉO)** | Mantén **2 teclas a la vez** (p. ej. `A`+`W`) | Arrastra en **45°** — el anillo del joystick se vuelve dorado |
| Golpe de orza (onda + aspiradora) | `Space` | Botón rojo **SLAM**, abajo a la derecha |
| Pausa / continuar | `P` o `Esc` | Botón de pausa, arriba a la derecha |
| Reinicio instantáneo | `R` (también en pausa/game over) | Botón «Otra tanda» |
| Empezar / confirmar | `Enter` | Botón **AL FUEGO** |
| Silencio / sonido | `M` | Botón de altavoz, arriba a la derecha |
| Cambiar idioma | — (usa los botones VI/EN/中/日/한/ES/FR) | Botones VI/EN/中/日/한/ES/FR en menú / pausa |

## 🚀 Instalación y ejecución

### Juega ya (sin build)

```bash
# cada release incluye un único archivo autocontenido:
open dist/index.html      # macOS
xdg-open dist/index.html  # Linux
start dist/index.html     # Windows
```

### Build de producción

```bash
npm install        # instala dependencias (Node ≥ 20.19)
npm run build      # → dist/index.html (un único archivo autocontenido)
```

> `vite-plugin-singlefile` incrusta todo el JS/CSS/fuentes/imágenes en **un** `dist/index.html` (~700 KB, gzip ~355 KB). Sin servidor, sin red.

### Desarrollo

```bash
npm run dev        # servidor de desarrollo con HMR (http://localhost:5173)
npm run preview    # sirve el build de producción localmente
npm run typecheck  # tsc --noEmit (strict, noUnusedLocals…)
npm run test       # vitest — 948 tests unitarios (modes / achievements / storage / i18n / settings)
npm run check      # typecheck + test + build (puerta de calidad CI)
```

## 🗂️ Estructura del proyecto

```
lo-cheoio/
├─ index.html              # entrada, meta SEO/OG (sin CDN)
├─ package.json            # lo-cheoio v1.1.8, scripts dev/build/test/check
├─ .gitattributes          # *.bat/*.cmd → CRLF · posix → LF · binaries
├─ vite.config.ts          # vite + react + tailwind v4 + singlefile
├─ tsconfig.json           # strict; incluye src + tests
├─ favicon.ico             # web icon (multi-size 16→256)
├─ public/                 # favicon.ico/png/svg served at web root
├─ assets/
│  ├─ banner.svg           # banner del README (animación SMIL)
│  ├─ demo.svg             # simulación de gameplay (animación SMIL)
│  ├─ items.svg            # los 14 ingredientes (animación SMIL)
│  ├─ modes.svg            # los 9 modos (animación SMIL)
│  ├─ languages.svg        # 7 in-game languages (SMIL animation)
│  ├─ new-modes.svg        # the 2 new v1.1.4 modes (SMIL animation)
│  ├─ corner-menu.svg     # corner GAME/INFO panels (SMIL animation)
│  ├─ settings-sections.svg # 6-section settings tour (SMIL, v1.1.6)
│  ├─ divider.svg          # sparkle divider (SMIL animation)
│  ├─ license.svg          # sello copyleft AGPL-3.0 animado (animación SMIL)
│  └─ favicon.svg          # favicon (SMIL animation)
├─ scripts/
│  ├─ play-mac.command     # lanzador macOS — doble clic, menú a todo color
│  ├─ play-windows.bat     # lanzador Windows — doble clic, menú a todo color
│  ├─ play-linux.sh        # lanzador Linux — doble clic, menú a todo color
│  └─ README.md            # guía de lanzadores para novatos de la terminal
├─ docs/
│  ├─ README.md            # índice de documentación (v1.1.5)
│  ├─ DESCRIPTION.md       # descripciones multilingüe (vi/en/zh + SEO)
│  ├─ design/              # specs menu-corners / save-format / settings-format
│  ├─ guides/              # overview del engine · a11y · rendimiento · storage keys · release playbook…
│  └─ releases/
│     ├─ v1.0.0.md         # notas del primer release
│     ├─ v1.1.0.md         # notas de v1.1.0
│     ├─ v1.1.1.md         # notas de v1.1.1
│     ├─ v1.1.2.md         # v1.1.2
│     ├─ v1.1.3.md         # v1.1.3 release notes
│     ├─ v1.1.4.md         # release notes (1.1.4)
│     ├─ v1.1.5.md         # release notes (1.1.5)
│     ├─ v1.1.6.md         # release notes (1.1.6)
│     └─ v1.1.8.md         # current release notes (1.1.8)
├─ README.md               # 🇻🇳 Tiếng Việt
├─ README.en.md            # 🇬🇧 English
├─ README.zh.md            # 🇨🇳 中文
├─ README.ja.md            # 🇯🇵 日本語
├─ README.ko.md            # 🇰🇷 한국어
├─ README.es.md            # 🇪🇸 Español (este archivo)
├─ README.fr.md            # 🇫🇷 Français
├─ README.th.md            # 🇹🇭 ไทย
├─ README.de.md            # 🇩🇪 Deutsch
├─ README.pt.md            # 🇵🇹 Português
├─ src/
│  ├─ main.tsx             # raíz React, StrictMode
│  ├─ App.tsx              # máquina de fases menu/playing/paused/gameover
│  ├─ version.ts           # APP_VERSION = "1.1.8" (fuente única de verdad)
│  ├─ index.css            # tema tailwind v4 + todas las animaciones/gradientes
│  ├─ assets/fonts/        # subsets woff2 (Be Vietnam Pro ×6, Bungee)
│  ├─ styles/fonts.css     # @font-face + unicode-range, 100% offline
│  ├─ i18n/
│  │  ├─ i18n.ts           # módulo puro: detección, persistencia, t() + interpolación
│  │  ├─ useI18n.ts        # hook React: useI18n/useLanguage
│  │  └─ locales/          # vi.ts (fuente de claves) · en · zh · ja · ko · es · fr
│  ├─ components/
│  │  ├─ GameCanvas.tsx    # canvas + joystick flotante + teclado + visibilidad
│  │  ├─ StartScreen.tsx   # menú: hero + escena en capas + paneles de esquina
│  │  ├─ menu/              # paneles GAME/INFO + modales + icons/
│  │  │  └─ background/     # 8 background layers as data (v1.1.8)
│  │  ├─ ModeSelector.tsx  # 9 tarjetas de modo (classic/zen/inferno/blitz/goldrush/storm/hardcore · combo · feast)
│  │  ├─ AchievementsPanel.tsx  # muro de insignias bloqueadas/desbloqueadas
│  │  ├─ GameOverScreen.tsx     # ¡ORZA ROTA! + puntos + nuevos logros
│  │  ├─ PauseScreen.tsx        # PAUSA + estadísticas de la partida
│  │  ├─ settings/           # ajustes en 6 secciones + controles (v1.1.6)
│  │  └─ ui/               # ocho primitivas, un archivo cada una (v1.1.8 — separadas de ui.tsx)
│  ├─ game/
│  │  ├─ engine.ts         # toda la simulación + render canvas (~2260 líneas)
│  │  ├─ modeTypes.ts      # ModeId · ModeConfig (types-only, v1.1.8)
│  │  ├─ modes/            # 9 balance records — classic.ts … feast.ts (v1.1.8)
│  │  ├─ modesIndex.ts     # MODES · MODE_LIST · isModeId (v1.1.8)
│  │  ├─ modeMath.ts       # multiplierForCombo · jarBonus · comboWindowFor… (v1.1.8)
│  │  ├─ modes.ts          # barrel — keeps every old import working
│  │  ├─ achievements.ts   # 16 insignias + checker puro (puro)
│  │  ├─ storage.ts        # localStorage: top 8, progreso, logros
│  │  ├─ audio.ts          # sintetizador Web Audio: sfx + música pentatónica
│  │  ├─ changelog/          # in-game changelog (v1.1.8 — split from one file)
│  │  │  ├─ types.ts        #   ChangelogEntry · ReleaseTier · copyFor()
│  │  │  ├─ tiers.ts        #   tierFor() · TIER_ORDER · TIER_LABEL_KEY
│  │  │  ├─ entries/        #   1 file per release — v1_0_0.ts … v1_1_7.ts
│  │  │  └─ index.ts        #   ordered list + 5 helpers
│  │  ├─ runSave.ts         # persistencia de partida suspendida
│  │  ├─ settings.ts        # esquema de ajustes, defaults, normalización
│  │  ├─ settingsIO.ts      # códec de copia/restauración (v1.1.6)
│  │  ├─ settingsPresets.ts # cuatro ajustes rápidos (v1.1.6)
│  │  └─ audioLevels.ts     # matemática de ganancia pura (v1.1.6)
│  └─ utils/
│     ├─ cn.ts             # clsx + tailwind-merge
│     └─ useFocusTrap.ts   # foco atrapado en modales (v1.1.6)
└─ tests/                  # vitest — 90 archivos · 948 tests (modes · achievements · storage · i18n · runSave · settings · presets · audio…)
```

## 🧱 Arquitectura y rendimiento
<img src="assets/architecture.svg" alt="Arquitectura de Lọ Chéo v1.1.8 — entrada → motor → estado → render y servicios (animación SMIL)" width="100%" />


- **Bucle de juego** con `requestAnimationFrame`, delta-time clampeado a `1/20s`, multiplicado por `timeScale` (cámara lenta de HIELO) y un breve **hit-stop** por captura para ese “golpe”.
- **HUD en canvas** dibujado directamente cada frame; React solo renderiza pantallas según `phase` — sin re-renders en el bucle caliente; al cambiar de idioma, el HUD toma el nuevo diccionario en el frame siguiente.
- **i18n por capas**: `src/i18n/i18n.ts` es un módulo puro (sin React), `useI18n` solo puenta los re-renders vía el evento `locheo:languagechange`; `t()` admite interpolación `{param}` y cae al vietnamita.
- **Suelo de losetas** pre-renderizado una vez a un canvas offscreen (con viñeta + charcos de luz); el titileo de estrellas y las pompas se calculan en tiempo real — muy barato.
- **Presupuesto**: ≤460 partículas, ≤70 ítems, ≤34 popups, DPR ≤ 2; colisiones por hitbox; los restos de encurtidos en el suelo se autolimpian.
- **localStorage** con validación/normalización de entrada — un registro corrupto no rompe la tabla; si el almacenamiento está bloqueado (Safari privado) el juego sigue en memoria; el idioma vive aparte en `locheo.lang.v1`.
- **Motion suave**: `prefers-reduced-motion` desactiva aurora/shimmer/spin; las estrellas y el screen shake también respetan las media queries.

## ❓ Preguntas frecuentes

**¿El lanzador de Windows se queja de los caracteres vietnamitas?**
Corregido en v1.1.4: `play-windows.bat` ahora es CRLF + UTF-8 BOM con `chcp 65001` y los diacríticos vietnamitas intactos — el error `'Ọ' is not recognized...` desaparece para siempre. Si editas el .bat con otro editor, conserva CRLF y BOM (`.gitattributes` lo fuerza automáticamente).


**¿Puedo jugar sin red?**
Sí — 100%: abre `dist/index.html` y todo funciona, fuentes y audio incluidos. No hay ni una petición de red.

**¿Hay anuncios o telemetría?**
No. Sin tracking ni analítica — tus puntos solo viven en tu localStorage.

**¿Cambiar de idioma pierde mi progreso?**
No. Puntos, logros, progreso y modo son independientes de `locheo.lang.v1`.

**¿Dónde se guarda el TOP 8?**
`locheo.scores.v1` (puntos), `locheo.progress.v1` (partidas/orzas/despedazadas totales), `locheo.achievements.v1` (insignias) — borrar el almacenamiento los borra, ¡cuida la orza!

**¿Quieres añadir otro idioma?**
Añade `src/i18n/locales/xx.ts` reflejando las claves de `vi.ts`, actualiza `LANGUAGES` + tests y abre un PR — ver [CONTRIBUTING.md](CONTRIBUTING.md).

**¿No te apañas con la terminal?**
Doble clic en [`scripts/play-mac.command`](scripts/play-mac.command) (macOS), [`scripts/play-windows.bat`](scripts/play-windows.bat) (Windows) o [`scripts/play-linux.sh`](scripts/play-linux.sh) (Linux) — aparece un menú a color; elige `1` para compilar y jugar al instante, `2` para el servidor de desarrollo. Detalles: [scripts/README.md](scripts/README.md).

## 📦 Releases y changelog

| Versión | Tier | Fecha | Notas |
| --- | --- | --- | --- |
| [v1.1.8](docs/releases/v1.1.8.md) | 🟣 **PATCH** | 2026-11-13 | **La pantalla de inicio ya no desborda**: una suma de alturas mal hecha dejaba el hero en 250px y cortaba `LỌ` · **error de scroll** (caja anidada + `justify-center`) resuelto con **un solo** `.menu-scroll` anclado arriba · **«Cómo jugar» al menú GAME** como modal · paneles declarados en **318px/458px** en vez de ajustarse al contenido · ticker de 48px · **14 adornos del hero** + **3 anillos de halo** · `src/components/menu/{layout,scene,ticker,howto}/` · **948 tests / 90 archivos** |
| [v1.1.7](docs/releases/v1.1.7.md) | 🟣 **PATCH** | 2026-11-12 | **Fondo del menú sin niebla** (cuatro capas: `blur 64→22px`, viñeta de esquinas en vez de pantalla completa, marco CRT 140→90px, suelo 45→70%) · **changelog por niveles con color** · **96 viñetas nuevas** para 8 versiones · fechas reordenadas · `src/game/changelog/` dividido · 10 READMEs rehechos · **256 tests** |
| [v1.1.6](docs/releases/v1.1.6.md) | 🟣 **PATCH** | 2026-11-10 | **Ajustes en 6 secciones** (rápidos · audio · pantalla · idioma · copia · datos) · volúmenes 0–100 · intensidad de sacudida · calidad visual · pausa al cambiar de pestaña · idioma dentro de Ajustes · 4 preajustes · exportar/importar JSON · menú multicapa animado · degradado en la tarjeta del autor · foco atrapado en modales · fix de música al recargar · **150 tests** |
| [v1.1.5](docs/releases/v1.1.5.md) | 🟣 **PATCH** | 2026-11-09 | **Menús de esquina GAME/INFO** (Jugar · Continuar · Modos · Clasificación · Logros · Ajustes / Sobre el autor · Changelog · Salir) · **guardar y reanudar partida** (`locheo.run.v1`) · ajustes in-game (SFX/música/sacudida/movimiento) · fix fuga de atajos por modales · prefers-reduced-motion global · **113 pruebas** |
| [v1.1.4](docs/releases/v1.1.4.md) | 🟣 **PATCH** | 2026-11-06 | **9 modos** (Combo Festival · Gran Festín) · **16 logros** · **7 idiomas** (ES/FR añadidos) · fix play-windows.bat (CRLF+BOM) · lanzadores en 7 idiomas · 61 tests |
| [v1.1.3](docs/releases/v1.1.3.md) | 🟣 **PATCH** | 2026-11-04 | 7 modos (Lluvia de Conservas · Cerámica Fina) · 14 logros · 5 idiomas · favicon · lanzadores multilingües · 55 tests |
| [v1.1.2](docs/releases/v1.1.2.md) | 🟣 **PATCH** | 2026-11-02 | 5 modos (60 Segundos · Fiebre de Oro) · 12 logros · combo en llamas · lanzadores de doble clic · README en 10 idiomas · 49 tests |
| [v1.1.1](docs/releases/v1.1.1.md) | 🟣 **PATCH** | 2026-10-30 | i18n en el juego VI/EN/ZH · README en 7 idiomas · barrido total de bugs · 49 tests |
| [v1.1.0](docs/releases/v1.1.0.md) | 🟡 **UPDATE** | 2026-10-29 | 3 modos · Escudo de Ajo Dorado · Oruga · Mostaza Dorada · 10 logros · fuentes auto-alojadas |
| [v1.0.0](docs/releases/v1.0.0.md) | 🩷 **MAJOR** | 2026-10-26 | Primer release: motor completo, 11 ingredientes, GOLPE DE ORZA, combo ×9 |

Ver también [CHANGELOG.md](CHANGELOG.md).

## 🗺️ Hoja de ruta (borrador — sujeta a cambios según feedback)

| Hito | ETA | Ideas |
| --- | --- | --- |
| **v1.2.0** | 2026 Q1 | Música procedural por modo · tests de regresión visual (Playwright) en CI · subsetting de fuentes más agresivo para reducir el bundle |
| **v1.3.0** | 2026 Q1–Q2 | 10º modo de juego (candidato: **TORMENTA DE MOSCAS** — solo moscas, sobrevive cortando) · modo con semilla para retos diarios |
| **v1.4.0** | 2026 Q2 | Tabla de clasificación online **opt-in** (serverless, cifrada) — offline-first sigue siendo el valor por defecto |
| Backlog | — | Ghost replay de tu mejor partida · modo foto (oculta el HUD, exporta PNG) · locale tailandés (ไทย) en evaluación |

*Una hoja de ruta no es una promesa — la prioridad siempre es: estabilidad → que sea más fácil de jugar → más contenido.*

## 📚 Documentación adicional y desarrollo

Notas de diseño y documentación técnica más profunda:

| Doc | What it covers |
| --- | --- |
| [docs/releases/v1.1.8.md](docs/releases/v1.1.8.md) | Versión v1.1.8 — cuatro errores de maquetación de una sola suma de alturas, el scroll anidado, el «Cómo jugar» en el menú GAME, 14 adornos del hero |
| [docs/releases/v1.1.7.md](docs/releases/v1.1.7.md) | Versión v1.1.7 — fondo del menú sin niebla (diagnóstico de cuatro capas), changelog por niveles, 96 viñetas nuevas |
| [docs/releases/v1.1.6.md](docs/releases/v1.1.6.md) | Release v1.1.6 — ajustes en 6 secciones, preajustes, copia, menú multicapa |
| [docs/releases/v1.1.5.md](docs/releases/v1.1.5.md) | Release v1.1.5 — menús de esquina, guardar/continuar, ajustes, fixes |
| [docs/design/menu-corners.md](docs/design/menu-corners.md) | Diseño del menú de esquina GAME/INFO — principios, a11y, responsive |
| [docs/design/save-format.md](docs/design/save-format.md) | Spec `locheo.run.v1` — snapshot de partida en pausa (schema + ciclo de vida) |
| [docs/design/settings-format.md](docs/design/settings-format.md) | Spec `locheo.settings.v1` — ajustes del juego (schema + wiring) |
| [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) | Problemas comunes — pantalla negra · audio · Continuar · launcher |
| [scripts/smoke-ssr.tsx](scripts/smoke-ssr.tsx) | Smoke test de render headless (todo el árbol menú/modal) |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | CI: npm ci → npm run check (Node 22) |

## 🤝 Contribuir

1. Haz fork, crea una rama con la convención `arena/<nombre>` o `feat/<nombre>`.
2. `npm run check` debe estar en verde antes de abrir PR (typecheck + 948 tests + build).
3. Evita nuevas dependencias de runtime salvo necesidad real — filosofía: **un archivo, sin red, jugable para siempre**.
4. En el PR indica las pantallas/modos afectados y adjunta un clip si cambia el gameplay.

## 📄 Licencia y autor

<img src="assets/license.svg" alt="AGPL-3.0-only — licencia copyleft" width="400" />

- **AGPL-3.0-only** © 2026 [Standardize Paradigm](mailto:standardizeparadigm@donuco.com) — ver [LICENSE](LICENSE) y [assets/license.svg](assets/license.svg).
- Fuentes: [Be Vietnam Pro](https://fonts.google.com/specimen/Be+Vietnam+Pro) & [Bungee](https://fonts.google.com/specimen/Bungee) — SIL Open Font License 1.1 (subsets woff2 auto-alojados).
- Por cada orza de encurtidos en cada mesa vietnamita — salud. 🫙🇻🇳
