# Direcciones web en el articulado

## URLs escritas dentro del articulado (comprobación obligatoria)

Muchas resoluciones e instrucciones citan direcciones web en el propio texto. El
renderizador las autoenlaza solo (URLs `https://`, dominios `www.` y correos, en
párrafos, encabezados y celdas de tabla), así que **en el JSON van como texto
plano, sin markdown de enlace**. Lo que hay que vigilar es la transcripción:

- El PDF parte las URLs largas por el salto de línea. Al unir las líneas queda
  **un espacio dentro de la dirección** (`…/Actualitzaci %C3%B3n_Instrucciones…`,
  `…/SPRL_IOPRL_04+1910+Info rmaci%C3%B3n…`). El enlace sale a medias y la cola
  se ve como texto suelto: es el síntoma de «hay un link que no se muestra como
  tal».
- O desaparece **el guion que había en el salto**: `proteccio-dedades` por
  `proteccio-de-dades`, `delegacion-deproteccion`, `unaadaptaci%C3%B3n`,
  `revista.seg- social.es`. La URL parece bien y da 404.
- Ojo también con los **UUID de las rutas de `ceice.gva.es`**: pierden guiones
  igual que el resto (`6ee7fef6-f05b48d3-…` en vez de `6ee7fef6-f05b-48d3-…`).
- Y con el número de apartado que se pega al final de la dirección
  (`…-publics-gva.2. Cualquier normativa…`): ahí el `2.` es el apartado
  siguiente y hay que separarlo con `\n\n`.

`npm run validate` corta con **error** los tres patrones (URL partida por un
espacio, URL acabada en guion, coma pegada dentro de la URL), pero no detecta un
guion perdido en medio. Por eso, tras la ingesta: **extraer todas las URLs del
JSON y comprobarlas** (`curl -o /dev/null -w '%{http_code}' -L`). Las que den
404 hay que mirarlas una a una y distinguir dos casos:

- **Defecto nuestro** (guion o espacio perdido al extraer) → se corrige.
- **Enlace muerto en origen** (el portal de la GVA se reestructura a menudo y las
  normas citan rutas que ya no existen) → **se transcribe tal cual**. El texto
  legal es el que es; no se «arregla» apuntando a otra página. Si la misma
  dirección está mal en ES y en VA, es errata del DOGV, no de la extracción.

**Hipervínculos ocultos.** A veces el PDF muestra un texto y guarda la URL
detrás: el nombre de un proyecto, el título de un documento o, en el DOGV, solo
el UUID del fichero («…Universidades: f00905e8-e689-…»). Transcribir solo lo
visible deja un código suelto o un nombre sin enlace. Se transcribe como
**enlace markdown**, con el texto visible intacto y la URL del hipervínculo:
`[f00905e8-e689-3beb-533f-ea76f8b12788](https://ceice.gva.es/…?t=…)`. El
renderizador lo pinta como enlace (`content-renderer.ts`), el bloque de enlaces
citados usa el texto visible como nombre salvo que sea un UUID o una URL
(`cited-links.ts`), y `npm run validate` da error si la URL no es absoluta o
está partida por un espacio. Si el texto visible ya es una URL, se deja como
texto plano aunque el hipervínculo apunte a otra parte.

Para sacarlos: `python3 scripts/pdf-hidden-links.py norma.pdf --json
data/laws/es/{slug}.json` lista los hipervínculos del PDF cuya URL aún no está
en el JSON, con el texto visible que los lleva (pypdf + `pdftotext -bbox`).
Las resoluciones de inicio de curso **anteriores a 2026-2027 no se han
auditado**: la de 2025-2026 tiene al menos media docena de enlaces ocultos
pendientes (convalidaciones, SPRL-IOPRL-04, delegación de protección de datos…).

No hay que rellenar nada en el JSON para que estos enlaces aparezcan en la
cabecera de la ley: el bloque plegable «Enlaces citados en el texto» se genera
en tiempo de compilación (`src/lib/cited-links.ts`). `externalResources` es solo
para enlaces que **no** están en el articulado (calculadora de prelación,
ADMINOVA, corrección de errores publicada aparte).

**Cuando la errata es del DOGV y sabemos cuál era la dirección buena**, el
articulado NO se toca —se transcribe lo publicado— y la corrección se anota en
`data/metadata/link-corrections.json`:

```json
{
  "url": "www.aipd.es",
  "correctedUrl": "https://www.aepd.es",
  "note": { "es": "…por qué se corrige…", "va": "…" }
}
```

Sale marcada como «errata en la norma» dentro del bloque de enlaces citados, con
el enlace bueno debajo. `url` tiene que coincidir **carácter a carácter** con lo
que hay en el texto; `npm run validate` da error si deja de aparecer en alguna
ley (corrección obsoleta), si falta la nota en un idioma o si `correctedUrl` no
es absoluta.

Esto es solo para direcciones **equivocadas** cuyo destino correcto conocemos —
que la propia norma nombra el organismo, o que la ruta buena es evidente. Un
enlace bien transcrito que hoy da 404 porque el portal se reorganizó **no se
corrige a ojo**: se deja como está.
