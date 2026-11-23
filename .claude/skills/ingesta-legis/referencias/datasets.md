# Datasets para consumo externo

## Dataset de calendario escolar para consumo externo (`public/data/calendario/`)

Este repo publica un **dataset de calendario** (ficheros estáticos servidos por GitHub Pages) que consume una app externa de planificación de calendario escolar. NO es parte de la web visible: son datos.

- Ficheros publicados: `public/data/calendario/manifest.json` y `public/data/calendario/{curso}.json` (p. ej. `2026-2027.json`).
- URLs públicas: `https://jlmirallesb.github.io/legis_cpmdem/data/calendario/manifest.json` (y `/{curso}.json`).
- Esquema versionado propio: `"schema": "cev-calendario-escolar"`, `"version": N` (subir `version` solo en cambios incompatibles: renombrar un slug de municipio, cambiar semántica de un campo, etc. Los cambios aditivos no la tocan).
- Generador reproducible: **`scripts/gen-calendario-dataset.py`** — lee de `data/laws/va/` (no de temporales) y reescribe los ficheros. Ejecutar: `python3 scripts/gen-calendario-dataset.py`.

### ⚠️ DISPARADOR: al ingestar/modificar normativa de calendario, REGENERAR el dataset

Después de ingestar o modificar cualquiera de estas normas, **hay que regenerar el dataset y republicar** (si no, la app externa se queda con datos obsoletos):

| Normativa afectada | Acción en `scripts/gen-calendario-dataset.py` |
|---|---|
| **Fiestas locales de un nuevo año** (ej. `resolucion-fiestas-locales-2027`) | Añadir una línea a `LOCAL_SOURCES` con `(slug, año, meses)`. Para completar el curso 2026-2027: `("resolucion-fiestas-locales-2027", 2027, set(range(1, 7)))` (ene-jun 2027). |
| **Nuevo calendario escolar** (ej. curso 2027-2028) | Crear un nuevo bloque de curso: añadir el curso a `manifest["courses"]` y generar `{curso}.json` con sus fechas (inicio/fin por enseñanza, vacaciones, festivos). Extender `LOCAL_SOURCES` con las fiestas locales de los años naturales que cubre ese curso. |
| **Nuevo calendario laboral** (decreto anual) o cambios en festivos autonómicos | Actualizar `autonomic_holidays` (escolar + laboral deduplicados, excluyendo los que caen dentro de vacaciones). |
| **Corrección de fechas** en cualquiera de las leyes anteriores | Re-ejecutar el generador (las fechas se transcriben de las leyes). |

Convenciones del dataset (no romper, la app externa depende de ellas):
- `code` de municipio = **slug estable y único** (minúsculas, sin acentos ni apóstrofes, `/`→`-`). **Nunca renombrar** un slug ya publicado (rompería selecciones guardadas en la app externa → sería cambio incompatible, subir `version`). `name` = forma legible (valenciano, oficial DOGV).
- Rangos de vacaciones: `start`/`end` **inclusivos** (primer y último día NO lectivo; la reincorporación ya es lectiva).
- `nonLectiveDays` va **vacío** desde este repo (los días de libre disposición los fija cada consejo escolar municipal, no están en el DOGV).
- `localHolidays` de un curso solo incluye festivos **dentro del curso** (por eso las fiestas de año natural se filtran por meses en `LOCAL_SOURCES`).
- Idioma del dataset: valenciano. Un mapeo de nombres es/va de municipios sería una pasada futura verificada (no emparejar a ojo Xàbia↔Jávea, etc.).

Tras regenerar: `npm run build` (Astro copia `public/` a `dist/`) y hacer release normal (version.ts + changelog + tag + push).

## Dataset del sorteo de admisión para consumo externo (`public/data/sorteo/`)

Este repo publica un segundo dataset (mismo patrón que el de calendario) que consumen apps externas de gestión de admisión y pruebas de acceso: las letras del sorteo público de Conselleria con las que se ordena al alumnado en los desempates. NO es parte de la web visible: son datos.

- Ficheros publicados: `public/data/sorteo/manifest.json` y `public/data/sorteo/{curso}.json`.
- URLs públicas: `https://jlmirallesb.github.io/legis_cpmdem/data/sorteo/manifest.json` (y `/{curso}.json`).
- Esquema versionado propio: `"schema": "cev-sorteo-admision"`, `"version": N` (subir `version` solo en cambios incompatibles; los aditivos no la tocan).
- Generador reproducible: **`scripts/gen-sorteo-dataset.py`** — extrae las letras con regex del artículo «Resultado del sorteo» de la norma ya ingestada; **nunca teclearlas a mano**. Ejecutar: `python3 scripts/gen-sorteo-dataset.py`.

### ⚠️ DISPARADOR: al ingestar el sorteo de un curso nuevo, REGENERAR el dataset

| Normativa afectada | Acción en `scripts/gen-sorteo-dataset.py` |
|---|---|
| **Sorteo de un curso nuevo** (ej. `resolucion-sorteo-admision-2027-2028`) | Añadir una tupla a `COURSES`: `(curso, slug del sorteo, slug de la convocatoria de admisión de Música y Danza)`. Si la convocatoria aún no está ingestada, pasar `None` como tercer elemento y volver a ejecutar cuando lo esté. |
| **Nueva convocatoria anual de admisión de Música y Danza** | Rellenar el tercer elemento de la tupla del curso correspondiente (activa la comprobación cruzada de letras). |
| **Nueva orden de admisión de Música y Danza** que sustituya a la Orden 8/2026 | Actualizar `STANDING_RULE` con el nuevo slug y artículo. |
| **Corrección de letras** en la resolución del sorteo | Re-ejecutar el generador (las letras se extraen de la ley). |

Convenciones del dataset (la app externa depende de ellas):
- `letters1`/`letters2` = cadena literal `«X-Y»`, tal y como la publica la norma (primer apellido / segundo apellido).
- `manifest.courses[]` es lo que evita que la app adivine el slug de la norma del año siguiente: lee el manifest, elige curso y pide `{curso}.json`.
- `norm` = norma de la que salen las letras. `appliedBy` = normas de Música y Danza que aplican ese sorteo a los conservatorios.
- **El sorteo NO es específico de enseñanzas artísticas**: la resolución solo nombra Infantil, Primaria, ESO, Bachillerato y Educación Especial. Se aplica a los conservatorios por el art. 19.2.4.º de la Orden 8/2026 y por el apartado noveno de la convocatoria anual, que reproduce las mismas letras. El generador comprueba que ambas coinciden y aborta si discrepan.

Tras regenerar: `npm run build` y release normal (version.ts + changelog + tag + push).
