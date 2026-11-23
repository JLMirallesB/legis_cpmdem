# Contenido y JSON: errores conocidos y lecciones

## Disposiciones (errores recurrentes en TODAS las ingestas)
- Las disposiciones finales SIEMPRE deben ser nodos separados (df-1, df-2, etc.), NUNCA un solo nodo con todo junto
- El subtítulo de la disposición (ej. "Única. Derogación normativa") NO debe repetirse al inicio del content
- Los títulos deben ser completos: "Disposición final primera. Aplicación y desarrollo", no solo "Disposiciones finales"
- La cláusula de promulgación NUNCA debe colarse en el content de la última disposición final
- Verificar SIEMPRE tras la ingesta: buscar "Valencia," o "El president" dentro del content de disposiciones

## Listas y formato de contenido
- Listas con guiones (art-5, art-6): usar `\n–` (salto simple), NO `\n\n–` (que crea párrafos separados con sangrado)
- Headings de secciones curriculares (Introducción, Objetivos, Contenidos, Criterios de evaluación): marcar con `**negrita**` → se renderizan como `.content-heading`
- Títulos de artículo multilínea en el PDF: verificar que el content NO empiece con un fragmento en minúscula (señal de título truncado)
- Tablas: reconstruir manualmente si pdfplumber extrae Table 0 con celdas combinadas (usar Table 1/2 o datos directos del PDF)
- Las tablas (distribución horaria, ratios profesor/alumno) están en páginas a ancho completo (no dos columnas), primero un idioma y luego el otro — NO usar crop de media página para estas páginas
- Usar `pdfplumber.extract_tables()` para extraer tablas — funciona bien para la mayoría de PDFs excepto los más antiguos (D.157/2007 donde agrupa toda la tabla en 1 fila)
- Almacenar tablas como **markdown** en el `content` (formato `| col | col |` con separador `|---|---|`). Esto funciona en los 3 formatos de salida: web (renderizado como `<table>`), JSON (legible), markdown export (nativo)
- `src/lib/content-renderer.ts` detecta bloques que empiezan con `|` y contienen `|---` y los renderiza como `<table>` HTML
- Agrupar tablas por especialidad con título en negrita: `**Especialidad: Arpa**\n\n| ... |`
- Las páginas de tablas se identifican buscando `page.extract_tables()` con más de 3 filas (las de 1 fila son basura)
- Un `ANEXO` sin número romano (ej. "Anexo único") no se captura con la regex `ANEXO\s+(I{1,3}V?...)` → buscar también `ANEXO\s*\n` sin número

## Renderizado del contenido (`src/lib/content-renderer.ts`, `ArticleContent.astro`)
- Formato admitido en `content`: `\n\n` separa bloques (cada uno un `<p>`); `\n` simple es `<br>` dentro del párrafo; `**texto**` es `<strong>`, o `.content-heading` si ocupa el bloque entero; un bloque que empieza por `|` y lleva `|---` es una tabla (`**…**` en una celda → `<strong>`); `![alt](url)` es una figura.
- El HTML entra con `set:html`, que no recibe el atributo `data-astro-cid-*` de los estilos con ámbito de Astro: los selectores del contenido van con `:global()` (`.article-text :global(p)`). Si un estilo nuevo «no se ve», es esto.
- Tablas: sin `width: 100%` (se centran con `margin: auto`), sin `white-space: nowrap` en `th`, y el envoltorio `.table-wrapper` con `max-width: 100%` y `overflow-x: auto`.
- Los encabezados de grupo de disposiciones («Disposiciones adicionales»…) no van en los JSON: los genera `src/lib/disposition-groups.ts` al renderizar, en el contenido y en la barra lateral.
- El selector de versión solo aparece si el nodo tiene `versions` con más de una entrada.

## Leyes solo en castellano
- Muchas leyes estatales (BOE) solo existen en castellano: LOE, LOMLOE, LODE, reales decretos, órdenes ministeriales
- Para la versión VA: **mismo contenido ES** con nota al inicio del preámbulo: `[Aquesta llei/norma només existeix en castellà. El text es mostra en castellà.]`
- Los metadatos VA (title, titleShort, vigpiracy.statusLabel, promulgation.signatories.role, legalAnalysis titles/descriptions) deben traducirse al valenciano
- Roles de firmantes estatales: `Rey de España` → `Rei d'Espanya`, `Presidente del Gobierno` → `President del Govern`, `Ministro/a de X` → `Ministre/a de X`

## Leyes con contenido no relevante para conservatorios
- Muchas leyes estatales regulan múltiples enseñanzas (ESO, bachillerato, FP, deportivas...)
- Los artículos/disposiciones que NO tratan de música ni danza se sustituyen por: `[No relativo a conservatorios profesionales de música y danza - ver PDF original]`
- Fórmula idéntica en ES y VA, solo el contenido cambia
- Los capítulos excluidos de leyes grandes (ej. Título I LOE) se incluyen como nodos `capitulo` con un hijo `articulo` que contiene la nota (para que el renderizador lo muestre)
- **NUNCA eliminar completamente** capítulos/artículos: siempre dejar referencia para que el lector sepa que existen

## Estructura JSON
- `id` y `slug` deben ser iguales y coincidir con el nombre del archivo (sin .json)
- Convención: `{tipo}-{numero}-{año}` → `decreto-158-2007`. Para resoluciones anuales: `resolucion-inicio-curso-2025-2026`
- Categorías válidas: las de `data/metadata/categories.json` (no mantener lista duplicada aquí). Las leyes ómnibus van en `leyes_modificadoras`, no en `general`
- IDs de estructura: `art-N`, `titulo-N`, `titulo-N-cap-N`, `cap-N`, `da-N`, `dt-N`, `dd-unica`, `df-N`, `anexo-N`, `preambulo`; secciones `titulo-N-cap-N-sec-N` o `cap-N-sec-N`; disposiciones únicas `da-unica`, `dt-unica`, `df-unica`

## Propiedades de clasificación (OBLIGATORIO en toda nueva ingesta)
Cada ley debe incluir las 4 propiedades siguientes (definidas en `src/lib/types.ts`):
- `scope`: `"general"` | `"musica_y_danza"` | `"musica"` | `"danza"` | `"escuelas_musica_artes_escenicas"` — indica a qué enseñanzas aplica. `escuelas_musica_artes_escenicas` = escuelas de enseñanza artística NO reglada (Música y Artes Escénicas); distinto de los valores de conservatorio (enseñanza reglada). Al añadir un valor de scope nuevo hay que tocar: `src/lib/types.ts` (unión `LawScope`), `src/i18n/{es,va}.json` (`tag.scope.<valor>`), `src/components/LawTags.astro` (CSS `.tag-scope-<valor>`) y `src/pages/{es,va}/buscar.astro` (`tagLabels` + CSS)
- `territory`: `"estatal"` | `"autonomico"` — BOE = estatal, DOGV = autonómico
- `temporality`: objeto con `type: "permanente"` o `type: "anual"` (con `schoolYear` y `expiresDate`)
  - Leyes anuales (ej. instrucciones de inicio de curso): `{ "type": "anual", "schoolYear": "25-26", "expiresDate": "2026-09-01" }`
  - El `expiresDate` es siempre el 1 de septiembre del curso siguiente
- `docType`: `"normativa"` — las resoluciones publicadas en DOGV/BOE son normativa, no documentos
- Estas propiedades se muestran como etiquetas de color en catálogo, detalle y búsqueda (`LawTags.astro`)
- Son filtrables en el buscador

## Cláusula de promulgación (OBLIGATORIO)
- Toda ley debe incluir `promulgation` con `place`, `date` y `signatories[]`
- Cada firmante tiene `name` (nombre completo) y `role` (cargo en el idioma del JSON)
- El lugar varía: "Valencia"/"València", "San Vicente del Raspeig"/"Sant Vicent del Raspeig", etc.
- Las órdenes solo tienen un firmante (el/la conseller/a); los decretos tienen president + conseller/a
- Extraer del PDF original: aparece tras la última disposición, antes de los anexos
- El nombre se almacena en mayúsculas/minúsculas normales (no ALL CAPS como en el PDF)

## Enlaces de publicación oficial (OBLIGATORIO)
- `publishedIn.url` → ficha de la disposición en DOGV/BOE (análisis jurídico, texto consolidado). Ejemplos:
  - DOGV: `https://dogv.gva.es/es/eli/es-vc/d/2007/09/21/158` o `https://dogv.gva.es/va/resultat-dogv?signatura=2013/6657`
  - BOE: `https://www.boe.es/eli/es/rd/2006/12/22/1577` (futuro, cuando se ingesten leyes estatales)
- `publishedIn.pdfUrl` → enlace directo al PDF publicado. Ejemplo: `https://dogv.gva.es/datos/2007/09/25/pdf/2007_11706.pdf`
- **AMBOS campos son obligatorios** en toda nueva ingesta
- Si el usuario solo proporciona la URL del PDF, **pedir la URL de la ficha** antes de generar el JSON
- Si el usuario solo proporciona la ficha, **pedir la URL del PDF**
- El botón "Ver en DOGV" usa `url`; el botón "PDF oficial" usa `pdfUrl`

## Cross-references bidireccionales
- Si Ley B modifica Ley A: actualizar AMBAS leyes
- En Ley A: `posteriorAffectations` + versiones en artículos + `lastModifiedDate`
- En Ley B: `priorAffectations`
- Leyes no ingresadas: usar `lawId` con slug esperado (enlace roto temporal, OK)

## Leyes de "desarrollo" vs leyes "modificadoras"
- Algunas leyes **desarrollan** especialidades de otra ley (ej. D.109/2011 desarrolla Bajo Eléctrico del D.158/2007) sin modificar artículos concretos
- Estas van en `posteriorAffectations` con `articles: []` (array vacío) y `type: "modifica"`
- Las leyes **modificadoras** sí cambian artículos: van con `articles: ["art-6", "art-8"]` etc.
- Ambos tipos requieren entrada en `posteriorAffectations` de la ley base

## Leyes ingresadas
Consultar siempre `data/metadata/law-registry.json` para la lista actualizada. No mantener lista duplicada aquí.

Tipos de norma ingresados hasta ahora: `decreto`, `orden`, `ley_organica`, `ley`, `real_decreto`, `resolucion`, `instrucciones`. Pendientes: `correccion_errores`.

### Resoluciones
- Las resoluciones pueden tener estructuras muy variadas (con artículos, con apartado único + anexo, u otras formas). NO asumir una estructura fija.
- Ejemplo ingresado: instrucciones de inicio de curso (apartado único + anexo extenso con secciones numeradas 1-10 usando nodos `seccion`/`articulo`).
- Las resoluciones anuales (instrucciones de curso) usan `temporality.type: "anual"` con `schoolYear` y `expiresDate`.
- **⚠️ Si la norma es de calendario** (calendario escolar, calendario laboral/festivos autonómicos, o fiestas locales), tras ingestarla hay que **regenerar el dataset de calendario** — ver «Dataset de calendario escolar para consumo externo» en `datasets.md`.
- **⚠️ Si la norma es el sorteo público de admisión** (`resolucion-sorteo-admision-{curso}`) o la convocatoria anual de admisión de Música y Danza, tras ingestarla hay que **regenerar el dataset de sorteo** — ver «Dataset del sorteo de admisión para consumo externo» en `datasets.md`.

### Leyes de medidas fiscales (leyes de acompañamiento)

Cada año, junto a los presupuestos, Les Corts aprueban una ley de medidas fiscales, de gestión administrativa y financiera, y de organización de la Generalitat (la «ley de acompañamiento»). Son leyes enormes y heterogéneas que modifican decenas de normas de golpe.

**⚠️ Al ingestar una ley de acompañamiento hay dos comprobaciones obligatorias:**

1. **¿Modifica la Ley 20/2017, de tasas?** Casi siempre sí, y casi siempre toca el título XIV (tasas en materia de educación). Hay que abrir `data/laws/{es,va}/ley-20-2017.json` y **crear las versiones** de los artículos afectados (`art-14-1-2`, `art-14-2-5`, `art-14-5-5`, `dt-unica`…), actualizar `posteriorAffectations` y `vigpiracy.lastModifiedDate`. Si no se hace, el repositorio publica tarifas de matrícula caducadas, que es peor que no publicarlas.
2. **¿Modifica alguna otra ley ya ingestada?** Revisar el capítulo de la Conselleria de Educación, Cultura y Universidades y el índice completo: el Decreto 193/2025 de convivencia, el Decreto 80/2017 de inspección o los decretos de currículo pueden aparecer en cualquier capítulo.

Categoría: **`leyes_modificadoras`** («Leyes de medidas y ómnibus»), tanto para las leyes de acompañamiento como para las de medidas urgentes (`ley-3-2026`, hiperregulación). Lo que las une es la forma, no el tema; `general` queda para normativa transversal con contenido propio.

Convenciones de alcance para estas leyes (ver `ley-5-2026` como modelo): se conserva el esqueleto completo de títulos, capítulos y secciones, agrupando en un solo nodo los **tramos de capítulos seguidos** sin incidencia («Capítulos I a VI. …»), y se reproduce con texto íntegro solo lo que afecta a las enseñanzas de música y danza. El preámbulo se poda igual: enteros los apartados de encuadre general de la ley, y del resto solo los párrafos con incidencia, sustituyendo los tramos elididos por la nota.

Cuando un cuadro de tarifas o de cuotas mezcla enseñanzas, **se recorta a los conceptos de conservatorio** y se cierra con la nota de no relativo; no se reproduce entero.
