# Versiones y modificaciones: errores conocidos y lecciones

## Ingesta desde texto consolidado (no original)
- Si se ingresa el texto consolidado (ya modificado por leyes posteriores) en vez del original:
  - El `content` del artículo será la versión vigente
  - Hay que obtener el texto **original** del PDF original del BOE para crear `versions[].v1`
  - La `posteriorAffectation` debe existir y `versions[]` debe tener la cadena completa
  - Indicar en la ley que es texto consolidado si procede

## Versiones de artículos (CRÍTICO)
- Cuando una ley modifica artículos de otra, HAY QUE crear el array `versions` en el artículo afectado
- Sin `versions`, el selector de versión NO aparece en la interfaz
- `content` del artículo DEBE coincidir con `versions[0].content` (versión más reciente)
- Versiones ordenadas de más reciente a más antigua
- La versión original tiene `modifiedBy: null`
- Tipos de modificación: reemplazo total del artículo, modificación de apartados, supresión de apartados
- **Al re-extraer texto** de un artículo con versions[]: actualizar el `content` de la versión v1 (`modifiedBy: null`) con el texto re-extraído, pero el `content` del nodo debe seguir siendo `versions[0].content` (vigente). Nunca sobreescribir `content` del nodo con texto original si hay versiones

## Cadenas de versiones múltiples (v1 → v2 → v3...)
- Un artículo puede ser modificado por más de una ley a lo largo del tiempo
- Ejemplo: art-14 de D.158/2007 tiene v1 (original 2007) → v2 (D.90/2015) → v3 (D.46/2026, vigente)
- Al insertar una versión intermedia en un artículo que ya tiene versions[], renumerar los versionId
- Orden siempre: `versions[0]` = vigente (vN más alto), `versions[last]` = original (v1)
- Antes de crear versiones, comprobar si el artículo ya tiene versions[] de ingestas anteriores
- Si ya existen, añadir la nueva versión en la posición cronológica correcta y renumerar

## Al ingestar una ley que ya fue modificada por leyes anteriores
- Si la ley base (ej. D.158/2007) ya fue modificada por leyes posteriores ya ingresadas (ej. D.90/2015, D.46/2026), el contenido actual del artículo debe reflejar la versión vigente
- HAY QUE crear versions[] desde el principio con toda la cadena cronológica conocida
- No ingestar el contenido "actualizado" sin versions[]: si un artículo ha sido modificado, debe tener el array completo para que la interfaz muestre el selector de versión

## Modificaciones parciales
- Para suprimir un apartado: eliminar el párrafo que empieza con `N. ` del contenido
- Para modificar un apartado: reemplazar el párrafo que empieza con `N. `
- Para reemplazar un artículo entero: usar el nuevo texto completo
- SIEMPRE preservar el texto original como versión anterior
- Al suprimir un apartado se van también todas sus letras y sub-apartados; si se sustituye por un texto corto (p. ej. una remisión a la conselleria), los sub-apartados del original desaparecen.
- En una cadena v1→v2→v3, la vigente acumula **todas** las intermedias: si la ley nueva solo toca el apartado 3, los apartados 1 y 2 conservan el texto de v2, no el de v1. (Fallo real: el art-14 del D.158/2007 perdió en v3 el Cant Valencià que el D.90/2015 había añadido al 1.b.)
- Los **anexos** también llevan `versions[]` cuando una norma los modifica (anexos II y III del D.159/2007, por la DF 4.ª del D.57/2020).
- El texto de cada versión sale del PDF de la norma modificadora, nunca del JSON existente: el art-8 del D.158/2007 tuvo en v2 un texto de procedencia desconocida.
