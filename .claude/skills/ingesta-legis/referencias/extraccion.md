# Extracción del texto: errores conocidos y lecciones

## Selección del método de extracción (CRÍTICO)

Elegir el método según la fuente del PDF:

| Fuente | Formato | Método recomendado |
|--------|---------|-------------------|
| DOGV bilingüe antiguo | 2 columnas (va izq, es der) | `pdfplumber` crop izq/der o `pdftotext -x` |
| DOGV PDFs separados | 1 columna por idioma | `pdftotext -layout` |
| BOE moderno (≥2009) | 2 columnas mismo idioma | **`pdftotext`** sin `-layout` (respeta orden de lectura por columnas) |
| BOE antiguo (< 2009) | 2 columnas mismo idioma, PDF compartido con otras leyes | **`pdftotext`** sin `-layout`, luego recortar por marcadores de inicio/fin del RD |
| BOE consolidado PDF | 1 columna | `pdfplumber extract_text()` o `pdftotext -layout` |
| BOE consolidado HTML | HTML web | **Preferido** cuando existe: `curl + regex` |
| DOGV consolidado PDF | 1 columna por idioma | `pdftotext -layout` (eliminar cabeceras de "Legislación consolidada") |

**⚠️ NUNCA usar `pdfplumber` crop (left/right) para PDFs del BOE de dos columnas del mismo idioma.** El crop a `pw/2` corta palabras en los bordes de columna, produciendo texto garbled ("habili-" + "tación" separados, "Orgá" + "nica" truncados). Este error se ha repetido múltiples veces.

**`pdftotext` sin `-layout`** es el método más fiable para BOE con dos columnas del mismo idioma: respeta el orden de lectura (columna izquierda completa, luego columna derecha), no corta palabras. Con `-layout` se interleavan las dos columnas en las mismas líneas, produciendo texto mezclado.

**Cuando el PDF del BOE contiene varias leyes** (ejemplo: RD 943/2003 comparte PDF con otro RD), extraer sin `-layout` y luego recortar el texto usando los marcadores "REAL DECRETO NNN/AAAA" como delimitadores.

**BOE consolidado HTML** (`https://www.boe.es/buscar/act.php?id=BOE-A-XXXX-NNNNN&tn=1`) es la fuente más fiable para texto de artículos. Extraer con:
```python
import re
with open(html_path) as f: html = f.read()
for m in re.finditer(r'<div class="bloque" id="(\w+)">(.*?)</div>\s*<p class="linkSubir">', html, re.DOTALL):
    bid, block = m.group(1), m.group(2)
    paras = [re.sub(r'<[^>]+>', '', p.group(1)).strip() 
             for p in re.finditer(r'<p class="parrafo[^"]*"[^>]*>(.*?)</p>', block, re.DOTALL)]
```
IDs de bloques BOE: `pr` (preámbulo), `a1`-`aN` (artículos), `daprimera`, `dtprimera`, `ddunica`, `dfprimera`, `ani`-`anv` (anexos).

## Extracción de texto (DOGV)
- `pdftotext` con `-layout` funciona bien para dos columnas si se usan las coordenadas `-x` correctas
- El ancho de página A4 es 595-612 pts. La columna derecha empieza en ~290
- Algunos artículos tienen "Articulo" (sin tilde) en PDFs antiguos - buscar ambas variantes
- Los títulos de artículo pueden ocupar varias líneas - el regex `^Artículo N.` puede no capturar todo
- Las líneas de encabezado de página (Núm. XXXX, CVE:, https://dogv.gva.es/) deben eliminarse del texto
- Los guiones de fin de línea (`-\n`) deben unirse
- La cláusula de promulgación ("Valencia, NN de mes de AAAA" / "El president...") aparece tras la última disposición, antes de los anexos. **NO descartar**: extraer como `promulgation` (lugar, fecha, firmantes). Recortar del contenido de la última disposición si se capturó ahí por error
- El lugar de promulgación NO siempre es Valencia/València — puede ser San Vicente del Raspeig, Alicante, etc.
- Los nombres de firmantes aparecen en ALL CAPS en el PDF → normalizar a mayúsculas/minúsculas ("Alberto Fabra Part", no "ALBERTO FABRA PART")
- Los cargos (`role`) deben ir SIN artículo "El/La" al inicio: "President de la Generalitat", no "El president de la Generalitat"
- Los cargos de conselleria se normalizan con nombre neutro y solo el área de educación: "Conselleria de Educación" / "Conselleria d'Educació" (no Conseller/Consellera, ni las otras áreas como Cultura, Deporte, etc.)
- Los cargos del ministerio estatal se normalizan igual, independientemente del nombre oficial del ministerio en cada época: "Ministerio de Educación" (ES) / "Ministeri d'Educació" (VA) (no Ministro/Ministra, ni las otras áreas como Cultura, Deporte, Ciencia, Formación Profesional, etc.)

## PDFs consolidados del BOE (errores recurrentes)
- Los PDFs consolidados del BOE tienen un **ÍNDICE** al principio con los mismos marcadores de estructura (`Artículo N.`, `Disposición...`) que el cuerpo de la ley, pero seguidos de `. . . . . .` y número de página
- **SIEMPRE** saltar el índice: buscar las líneas con `. . . .` (puntos suspensivos) y excluirlas. El cuerpo empieza tras `PREÁMBULO` (o `PREAMBULO` sin tilde en leyes antiguas)
- Si el parser captura disposiciones con 0 chars de contenido, es casi seguro que está leyendo el índice en vez del cuerpo
- Verificar siempre: NINGUNA disposición debe tener content vacío (excepto las explícitamente derogadas)

## Separación de párrafos (CRÍTICO - error en TODAS las ingestas de BOE)
- Los apartados numerados (`1.`, `2.`, `3.`) DEBEN estar separados por `\n\n`
- Las letras (`a)`, `b)`, `c)`) DEBEN estar separados por `\n\n`
- Los ordinales de modificación (`Uno.`, `Dos.`, `Tres.`) DEBEN estar separados por `\n\n`
- **Error recurrente**: `join_paragraphs()` une todo en mega-párrafos sin separar estos elementos
- Aplicar post-procesamiento si el parser no los separa:
```python
content = re.sub(r'(\.) (\d+\. [A-Z])', r'\1\n\n\2', content)  # "... text. 2. New"
content = re.sub(r'(\.) ([a-z]\) [A-Z])', r'\1\n\n\2', content)  # "... text. a) New"
content = re.sub(r'\n(\d+\. [A-Z])', r'\n\n\1', content)  # single \n before numbered
content = re.sub(r'\n([a-z]\) )', r'\n\n\1', content)  # single \n before lettered
```
- Para preámbulos extraídos con `pdftotext -layout`: detectar párrafos por **sangría** (indent > 14 espacios = nuevo párrafo, ~10 = continuación)

## Tablas de HTML del BOE
- Las tablas del BOE consolidado HTML contienen `<br>` dentro de celdas → convertir a `; ` al generar markdown
- **Cada fila de la tabla markdown DEBE estar en UNA sola línea** — si hay saltos de línea dentro de celdas, el renderizador no la detecta como tabla
- Celdas con `**` (leyenda de asteriscos) NO deben interpretarse como negrita: `ArticleContent.astro` ya ignora `**` sin contenido (length ≤ 4)
- Las tablas con puntos suspensivos (`Instrumento . . . . 6 180`) no se extraen bien con `extract_tables()` → parsear con regex del texto
- Siempre incluir la leyenda de asteriscos (`*`, `**`) después de la tabla como texto normal

## Imágenes y diagramas en PDFs
- Los diagramas/organigramas del PDF se extraen como texto garbled (celdas del diagrama mezcladas)
- Detectar por patrones: bloques de texto corto con nombres de niveles educativos, siglas MECES/EQF mezclados
- Sustituir por imagen: guardar en `public/images/laws/{slug}-{nombre}.png` y usar markdown `![alt](/legis_cpmdem/images/laws/archivo.png)`
- `ArticleContent.astro` renderiza `![alt](url)` como `<figure>` con `<img>` y `<figcaption>`
- `content-renderer.ts` convierte URLs (`https://...`), dominios `www.` y correos en enlaces clicables automáticamente (auto-linking). Para URLs escritas no hace falta markdown de enlaces; solo para hipervínculos ocultos — ver `urls.md` («URLs escritas dentro del articulado»).

## Detección de apartados de primer nivel (CUIDADO)
- Algunos artículos tienen sub-listados dentro de apartados con letras (a, b, c, d) que a su vez contienen ítems numerados `1. `, `2. `, etc.
- Ejemplo: art-9 del D.156/2007 tiene `5. Las pruebas... a) Prueba de acceso a baile flamenco: 1. Realización de... 2. Realización de...`
- La regex `\d+\. ` captura estos sub-ítems como falsos apartados de primer nivel
- Para distinguir apartados principales: buscar solo números secuenciales (1→2→3→4→5) precedidos por fin de frase (`. N. `) o al inicio del texto
- Alternativa segura: buscar manualmente las posiciones cuando el artículo tiene estructura compleja con sub-listados

## Sub-secciones de anexos curriculares
- Los anexos de currículo (Anexo I de D.156, D.157, D.158, D.159) contienen múltiples asignaturas/especialidades
- Se pueden dividir en sub-secciones con `children` para que aparezcan en el sidebar de navegación
- Un nodo `anexo` puede tener `children` (array de nodos `seccion`) EN VEZ DE `content` — no ambos
- Patrones de detección de asignaturas:
  - **Música (D.158, D.159)**: headers en ALL CAPS (`ACOMPAÑAMIENTO`, `CONJUNTO`...) + algunos en Title Case (`Complemento coral`, `Cultura audiovisual`, `Fundamentos de informática`...)
  - **Danza (D.156)**: headers con `Especialidad: Nombre` (`Especialidad: Baile Flamenco`, `Especialidad: Danza clásica`...)
  - **Danza elemental (D.157)**: headers en ALL CAPS (`DANZA ACADÉMICA`, `FOLKLORE`...)
- **Detección por lista cerrada** (PREFERIDO para D.158/2007): usar una lista cerrada de nombres de asignaturas conocidas (del art. 7 del decreto) y buscarlas como líneas standalone (`\nNOMBRE\n`) en el texto v1. Esto evita falsos positivos con líneas de tablas de distribución horaria que también aparecen como líneas cortas. La detección genérica por ALL CAPS captura basura de tablas (`Total 1365`, `A. Propias de la especialidad`, etc.)
- Para detectar headers ALL CAPS usar el texto de `extract_text()` (v1), NO el texto con párrafos (v2), porque la detección de sangrado puede romper los headers en mayúsculas insertando `\n\n` dentro de ellos
- **El contenido de cada sub-sección también necesita párrafos**: el texto v1 tiene `\n` en cada línea visual del PDF sin distinguir párrafos. Tras splitear por headers (v1), aplicar heurística de unión de líneas en párrafos:
  - Líneas ALL CAPS → párrafo standalone (sub-header)
  - Línea que empieza con `N. ` o `a) ` → nuevo párrafo (apartado numerado)
  - Línea anterior termina en `.` `:` `»` + línea actual empieza con mayúscula + línea anterior > 40 chars → nuevo párrafo
  - Resto → unir con espacio a la línea anterior (continuación de párrafo)
- IDs de sub-sección: `anexo-1-{slugified-name}` (ej. `anexo-1-acompanamiento`, `anexo-1-baile-flamenco`)

## Preámbulos y marcadores dispositivos
- El preámbulo termina con un marcador dispositivo en línea aislada, que varía según el tipo de norma:
  - Decretos: `DECRETO` (es) / `DECRETE` (va)
  - Órdenes: `ORDENO` (es) / `ORDENE` (va)
- No confundir con "DECRETO 158/2007" dentro del texto del preámbulo (que es referencia, no marcador)
- El marcador dispositivo siempre va seguido inmediatamente de `CAPÍTULO I` o `Artículo 1`
- En valenciano, el marcador de inicio del preámbulo varía: "L'estructura...", "Este decret...", "La Llei orgànica..."
- Verificar que no se captura texto de los artículos
