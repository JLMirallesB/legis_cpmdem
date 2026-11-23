---
name: ingesta-legis
description: Proceso y lecciones para ingestar normativa en Legis CPMDEM (PDF o HTML del DOGV y del BOE → JSON bilingüe en data/laws/). Úsala cuando el usuario diga «Ingesta esta ley», «Añade este decreto» o pase la URL de una norma para añadirla; al re-extraer, corregir o versionar una ley ya ingestada (versions[], posteriorAffectations, modificaciones parciales); al cribar una ley contra las fichas; y al tocar los datasets externos de calendario o sorteo (scripts/gen-*-dataset.py, public/data/). Las consultas sobre qué dice la normativa no la necesitan.
---

## Ingesta de leyes desde PDF del DOGV

### Comando del usuario
Cuando el usuario diga algo como **"Ingesta esta ley: [URL del PDF]"** o **"Añade este decreto: [URL]"**, seguir este proceso:

### Proceso paso a paso

#### 1. Descargar y extraer texto
```bash
# PDFs del DOGV pueden ser:
# A) Dos columnas (va izquierda, es derecha) - decretos antiguos
# B) PDFs separados por idioma (_es.pdf / _va.pdf) - decretos recientes
```

**Opción A: `pdftotext` (poppler)** — si está instalado:
```bash
# Para PDF de dos columnas:
pdftotext -layout -x 290 -y 0 -W 310 -H 842 "$PDF" /tmp/ley-es.txt  # columna derecha = ES
pdftotext -layout -x 0 -y 0 -W 305 -H 842 "$PDF" /tmp/ley-va.txt    # columna izquierda = VA

# Para PDFs separados:
pdftotext -layout "$PDF_ES" /tmp/ley-es.txt
pdftotext -layout "$PDF_VA" /tmp/ley-va.txt
```

**Opción B: `pdfplumber` (Python)** — alternativa si `pdftotext` no está disponible:
```python
import pdfplumber
with pdfplumber.open(pdf_path) as pdf:
    pw = pdf.pages[0].width
    mid = pw / 2
    for page in pdf.pages:
        right = page.crop((mid, 0, pw, page.height))  # ES
        left = page.crop((0, 0, mid, page.height))     # VA
        es_text = right.extract_text() or ""
        va_text = left.extract_text() or ""
```
`pdfplumber` suele estar disponible en el entorno aunque `pdftotext` no. Verificar con `python3 -c "import pdfplumber"` antes de empezar.

**⚠️ Preservación de párrafos (CRÍTICO):**
`extract_text()` de pdfplumber une todas las líneas de la columna con `\n` simple — NO distingue saltos de línea dentro de un párrafo de puntos y aparte reales. Si se usa `extract_text()` directamente y luego se unen líneas, el resultado es un bloque sin párrafos.

Para preservar los puntos y aparte, usar `region.chars` y detectar **sangrado** (indentation):
```python
from collections import Counter
chars = region.chars
# Agrupar chars por línea (misma coordenada top)
# Encontrar baseline x0 (el x0 más común entre todas las líneas)
# Línea con indent > 10pts sobre baseline = inicio de nuevo párrafo → insertar \n\n
```
- Baseline típico en DOGV: indent ≈ 8-9 pts desde el borde de columna
- Sangrado de párrafo: indent ≈ 22-23 pts (diferencia de ~14 pts)
- Títulos/encabezados: indent > 35 pts (no confundir con sangrado de párrafo)

#### 2. Analizar estructura
```bash
# Buscar artículos, capítulos, disposiciones, anexos, cláusula de promulgación
grep -n "^Artículo\|^\s*Artículo\|^Articulo\|^CAPÍTULO\|^DISPOSICION\|^ANEXO" /tmp/ley-es.txt
# Buscar cláusula de promulgación (lugar, fecha y firmantes)
grep -n "Valencia,\|València,\|San Vicente\|Sant Vicent" /tmp/ley-es.txt
```

#### 3. Generar JSON con script Python
Usar un script Python que:
- Parsee los artículos del texto extraído
- Extraiga la **cláusula de promulgación** (lugar, fecha, firmantes con nombre y cargo)
- Genere `data/laws/es/{slug}.json` y `data/laws/va/{slug}.json`
- Incluya el campo `promulgation` con `place`, `date` y `signatories[]`
- Siga el esquema de `src/lib/types.ts`
- El texto se extrae y se trocea con el script, no delegándolo en un agente o subagente LLM: con leyes largas (más de 50 artículos) resumen o pierden contenido.
- Tablas de tiempos lectivos: una por especialidad (`**Especialidad: Arpa**`), columnas `Asignatura | 1º | 2º | 3º | 4º | 5º | 6º | Total`, y las secciones A/B/C en negrita dentro de la tabla.

#### 4. Validar y compilar
```bash
npm run validate  # 0 errores obligatorio, avisos OK para leyes no ingresadas
npm run build     # debe compilar sin errores
```

Después, revisión a ojo con `npm run dev`: la ley aparece en el catálogo, el lector muestra todos los artículos y disposiciones, la barra lateral navega, la búsqueda la encuentra, el análisis jurídico enseña las cross-references y se ven los dos idiomas (`/es/ley/{slug}/` y `/va/llei/{slug}/`).

Si la norma cita direcciones web en el texto, comprobar además que resuelven —
ver `referencias/urls.md` («URLs escritas dentro del articulado»).

#### 5. Actualizar cross-references si la ley modifica otras
- Añadir `posteriorAffectations` en las leyes modificadas
- **CREAR VERSIONES** en los artículos afectados (array `versions`)
- Actualizar `lastModifiedDate` en `vigpiracy`
- Actualizar `data/metadata/law-registry.json`

#### 6. ⚠️ Cribar la ley nueva contra las fichas

**Paso obligatorio de toda ingesta.** El cribado cubre **tres** carpetas, no
una: `data/center-docs/` (documentos), `data/organos/` (órganos y cargos) y
`data/notebooks/` (cuadernos). Un solo comando las recorre todas:

```bash
node scripts/refs-triage.mjs --todas --ley <slug-de-la-ley-nueva>
```

Para una ficha suelta, su slug en vez de `--todas`:

```bash
node scripts/refs-triage.mjs pec --ley <slug-de-la-ley-nueva>
```

Lista los apartados de esa ley que hablan del documento y que aún no están
decididos. Cada candidato acaba en uno de tres sitios de la ficha: en `refs` si
regula el documento; en `refs` con `effect` y nota bilingüe si, sin regularlo,
le da consecuencias (solo fichas de documentos, ver «Efectos» en
`docs/DATA-SCHEMA.md`); o en `discarded` con su motivo si es mención de pasada.
Lo ya decidido no se vuelve a preguntar, así que el cribado no se repite.

Criterio de corte: entra lo que **regula** el documento —qué contiene, quién lo
elabora, quién lo aprueba, qué obligación impone— y no lo que solo lo nombra
(«de acuerdo con el proyecto educativo»). Ante la duda, descartar y anotar por
qué: un descarte razonado se revisa fácil, una ficha inflada no se lee.

Efecto o descarte: es efecto si la norma hace depender algo **concreto y
comprobable** del documento —autoriza, obliga, permite reclamar, otra actuación
tiene que ajustarse a él, alguien lo vigila—. «De acuerdo con el proyecto
educativo» suelto, en una lista de funciones, sigue siendo marco genérico. El
cribado marca con `◆` los candidatos con pinta de efecto.

Regla de separación entre fichas: **si tienen nombre distinto son documentos
distintos**, aunque uno viva dentro de otro. El PEC, la PGA y el Plan de Mejora
son tres fichas, no una. (Y en conservatorios el documento se llama **Plan de
Mejora**: el PAM es otra cosa, de los centros de régimen general.) Pero la
regla sirve para no fundir fichas, **no para descartar**: un apartado que dice
«el plan de convivencia se incorporará a la PGA» regula las dos y entra en las
dos. Descartarlo de cada una con «ficha propia» fue el error que corrigió la
v2.9.1 (34 apartados).

**Ficha o parte.** Si la norma dice que un documento se elabora «mediante» o «dentro de» otro, es una parte de esa ficha (`parts[]`), no una ficha propia: así quedaron los proyectos curriculares en el PEC y el plan de autoevaluación en el Plan de Mejora. Un documento **renombrado** es una sola ficha y no entra en la regla de separación: el NOF es el antiguo RRI (buscar por «reglamento de régimen interior», «reglamento de régimen interno», «normas de organización y funcionamiento» y sus formas valencianas). Nombres que no se cambian: es **plan de convivencia** (D.193/2025, art. 18), aunque la coordinación pasó a llamarse de bienestar y protección; y el PAT es el **plan de orientación y acción tutorial** (D.57/2020, art. 50.3.h).

Si una ficha sale sospechosamente corta, mira primero qué ve el cribador: ya pasó que `parseApartados` dejaba invisible el 43 % del corpus. Y lee la lista completa, no solo lo marcado con `★`: el heurístico de verbos se dejó el corazón del PEC (D.57/2020, art. 50.2 y 50.3).

**Fichas que no se criban por términos.** Algunas no se definen por una
palabra sino por un tramo de articulado («los arts. 15-24 de la Ley 40/2015»)
o por un tema difuso. Buscarlas por término da mucho ruido y, peor, pierde
apartados que las regulan sin nombrarlas. Esas declaran en su JSON:

```json
"triage": { "mode": "manual", "reason": "…por qué el término no sirve…" }
```

`--todas` las lista al final, con su motivo, en vez de callárselas: el hueco
queda dicho para que alguien lo mire a mano. Hoy son tres cuadernos
(`organos-colegiados`, `evaluacion-equipo-docente`, `distribucion-horaria`).
Antes de poner `terms` a una ficha nueva, medir el **recall**: si el cribado no
reencuentra las refs que ya tiene, no sirve de red y va a manual.

**Órganos y cargos (`data/organos/`) no se criban por mención**: a la dirección la nombran cientos de apartados, casi siempre como firmante o destinataria. `node scripts/organos-clasificar.mjs <slug>` (informe; `--write` escribe la ficha) propone incluir cuando el órgano es sujeto de un deber o el artículo entero va de él, y agrupa el resto como menciones incidentales. Cada ficha lleva `titleTerms` (para reconocer sus artículos) y `exclude` (homónimos: «dirección del departamento», «dirección territorial»…). Lo que el clasificador se deja es sistemático: las relaciones **entre** órganos («el claustro elige a sus representantes en el Consejo Escolar»), porque el sujeto de la frase es el otro órgano. Revisa esa clase primero.

Tras tocar una ficha: `npm run validate` y `npm run refs:refresh` si procede.

#### 6 bis. ⚠️ Revisar las referencias con ancla que apunten a lo que has tocado

`npm run validate` comprueba todas las referencias de `data/notebooks/`,
`data/center-docs/` y `data/organos/` contra las leyes:

- **Error** si un ancla ya no resuelve: el apartado citado ha desaparecido o se
  ha renumerado. Rompe el build a propósito.
- **Aviso** si el texto citado ha cambiado, si el artículo tiene versión nueva,
  si le afecta una norma posterior o si venció el curso de una norma anual.

Ante un aviso: abrir la cita, comprobar que sigue diciendo lo que se quería
citar y solo entonces `npm run refs:refresh` para volver a sellarla. Lanzarlo
sin mirar silencia justo el aviso que hacía falta.

Si la ley nueva llega con los apartados pegados en un solo párrafo (defecto
recurrente de extracción), `npm run fix:apartados` los separa: solo corta donde
continúa la serie esperada, así que no rompe referencias internas del tipo
«el artículo 5. La evaluación…».

#### 7. ⚠️ Comprobar si la ley alimenta un dataset externo (NO SALTAR)

**Este paso es obligatorio en toda ingesta.** Hay apps externas que leen datasets estáticos generados a partir de las leyes de este repo. Si la ley recién ingestada es una de sus fuentes y no se regenera el dataset, esas apps siguen sirviendo datos del curso pasado sin avisar de nada.

| Si la ley es… | Regenerar con | Detalle |
|---|---|---|
| Calendario escolar, calendario laboral/festivos autonómicos, o fiestas locales | `python3 scripts/gen-calendario-dataset.py` | `referencias/datasets.md`, «Dataset de calendario escolar…» |
| Sorteo público de admisión (`resolucion-sorteo-admision-{curso}`), convocatoria anual de admisión de Música y Danza, u orden de admisión que sustituya a la Orden 8/2026 | `python3 scripts/gen-sorteo-dataset.py` | `referencias/datasets.md`, «Dataset del sorteo de admisión…» |

Los generadores **extraen los datos del texto de las leyes ingestadas**: casi nunca basta con ejecutarlos, hay que registrar antes la ley nueva en la lista de fuentes del script (`LOCAL_SOURCES`, `COURSES`, `STANDING_RULE`…). Cada sección de `referencias/datasets.md` explica qué tocar.

Después: `npm run build` (Astro copia `public/` a `dist/`), release normal y **push** — el dataset solo llega a las apps externas cuando se despliega.

**Al crear un dataset nuevo** (una tercera app que quiera leer datos de este repo), hay cuatro sitios que tocar, y ninguno es opcional:
1. `scripts/gen-{nombre}-dataset.py` — generador que **extrae los datos del texto de las leyes ingestadas**, nunca valores tecleados a mano.
2. `public/data/{nombre}/` — salida: `manifest.json` con `courses[]` + un fichero por curso.
3. Una **fila en la tabla de este paso 7** y una **sección en `referencias/datasets.md`** con el disparador y las convenciones del esquema.
4. `src/lib/opendata.ts` — descriptor bilingüe del dataset; es lo que alimenta la página pública `/es/datos/` y `/va/dades/`. Si cambia la forma de un fichero ya publicado, actualizarlo también.

**Antes de proponer un dataset nuevo**, que haya un consumidor que lo pida: los dos que hay nacieron de la petición concreta de una app externa. Un dataset sin consumidor no lo regenera nadie y, cuando alguien lo encuentra años después, sirve un dato ya falso. Ordenar las ideas por «hay alguien que lo pediría», no por «se podría hacer».

**Se publica la cita de la norma, no el algoritmo.** El consumidor tiene que poder separar ante su usuario qué es texto legal y qué es su propia lectura (lo pidió una app consumidora). Si la norma base no está ingestada, el dataset lo dice (`procedure.sourceIngested: false` en el del sorteo) en vez de aparentar una fuente que no está.


### Errores conocidos y lecciones aprendidas

Están en `referencias/`, por temas. Léelas en su momento: **antes de extraer el texto, `extraccion.md`; antes de escribir el JSON, `contenido.md`; si la ley modifica otra o ya fue modificada, `versiones.md`; si cita direcciones web, `urls.md`; si alimenta un dataset, `datasets.md`.**

- `referencias/extraccion.md`: método según la fuente (DOGV, BOE, consolidados, HTML), extracción del DOGV, PDF consolidados del BOE, separación de párrafos, tablas HTML del BOE, imágenes y diagramas, apartados de primer nivel, sub-secciones de anexos curriculares, preámbulos y marcadores dispositivos.
- `referencias/contenido.md`: disposiciones, listas y formato, renderizado, leyes solo en castellano, contenido no relevante para conservatorios, estructura JSON, propiedades de clasificación, cláusula de promulgación, enlaces de publicación oficial, cross-references, leyes de desarrollo y modificadoras, leyes ingresadas, resoluciones y leyes de medidas fiscales.
- `referencias/versiones.md`: ingesta desde texto consolidado, versiones de artículos, cadenas de versiones, leyes ya modificadas y modificaciones parciales.
- `referencias/urls.md`: URLs escritas en el articulado, hipervínculos ocultos y erratas del DOGV.
- `referencias/datasets.md`: datasets de calendario escolar y de sorteo de admisión (disparadores y convenciones).
