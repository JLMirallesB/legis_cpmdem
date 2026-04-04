# Instrucciones para Claude Code - Legis CPM

## Qué es este proyecto
Lector de legislación de Conservatorios Profesionales de Música de la Generalitat Valenciana. Sitio estático con Astro 6.x desplegado en GitHub Pages. Datos en JSON bilingüe (es/va).

## Documentación
Leer antes de hacer cambios: `docs/CONTENT-GUIDE.md` (proceso de ingesta), `docs/DATA-SCHEMA.md` (esquema JSON), `src/lib/types.ts` (tipos TypeScript).

## Ingesta de leyes desde PDF del DOGV

### Comando del usuario
Cuando el usuario diga algo como **"Ingesta esta ley: [URL del PDF]"** o **"Añade este decreto: [URL]"**, seguir este proceso:

### Proceso paso a paso

#### 1. Descargar y extraer texto
```bash
# PDFs del DOGV pueden ser:
# A) Dos columnas (va izquierda, es derecha) - decretos antiguos
# B) PDFs separados por idioma (_es.pdf / _va.pdf) - decretos recientes

# Para PDF de dos columnas:
pdftotext -layout -x 290 -y 0 -W 310 -H 842 "$PDF" /tmp/ley-es.txt  # columna derecha = ES
pdftotext -layout -x 0 -y 0 -W 305 -H 842 "$PDF" /tmp/ley-va.txt    # columna izquierda = VA

# Para PDFs separados:
pdftotext -layout "$PDF_ES" /tmp/ley-es.txt
pdftotext -layout "$PDF_VA" /tmp/ley-va.txt
```

#### 2. Analizar estructura
```bash
# Buscar artículos, capítulos, disposiciones, anexos
grep -n "^Artículo\|^\s*Artículo\|^Articulo\|^CAPÍTULO\|^DISPOSICION\|^ANEXO" /tmp/ley-es.txt
```

#### 3. Generar JSON con script Python
Usar un script Python que:
- Parsee los artículos del texto extraído
- Genere `data/laws/es/{slug}.json` y `data/laws/va/{slug}.json`
- Siga el esquema de `src/lib/types.ts`

#### 4. Validar y compilar
```bash
npm run validate  # 0 errores obligatorio, avisos OK para leyes no ingresadas
npm run build     # debe compilar sin errores
```

#### 5. Actualizar cross-references si la ley modifica otras
- Añadir `posteriorAffectations` en las leyes modificadas
- **CREAR VERSIONES** en los artículos afectados (array `versions`)
- Actualizar `lastModifiedDate` en `vigpiracy`
- Actualizar `data/metadata/law-registry.json`

### Errores conocidos y lecciones aprendidas

#### Extracción de texto
- `pdftotext` con `-layout` funciona bien para dos columnas si se usan las coordenadas `-x` correctas
- El ancho de página A4 es 595-612 pts. La columna derecha empieza en ~290
- Algunos artículos tienen "Articulo" (sin tilde) en PDFs antiguos - buscar ambas variantes
- Los títulos de artículo pueden ocupar varias líneas - el regex `^Artículo N.` puede no capturar todo
- Las líneas de encabezado de página (Núm. XXXX, CVE:, https://dogv.gva.es/) deben eliminarse del texto
- Los guiones de fin de línea (`-\n`) deben unirse

#### Versiones de artículos (CRÍTICO)
- Cuando una ley modifica artículos de otra, HAY QUE crear el array `versions` en el artículo afectado
- Sin `versions`, el selector de versión NO aparece en la interfaz
- `content` del artículo DEBE coincidir con `versions[0].content` (versión más reciente)
- Versiones ordenadas de más reciente a más antigua
- La versión original tiene `modifiedBy: null`
- Tipos de modificación: reemplazo total del artículo, modificación de apartados, supresión de apartados

#### Modificaciones parciales
- Para suprimir un apartado: eliminar el párrafo que empieza con `N. ` del contenido
- Para modificar un apartado: reemplazar el párrafo que empieza con `N. `
- Para reemplazar un artículo entero: usar el nuevo texto completo
- SIEMPRE preservar el texto original como versión anterior

#### Estructura JSON
- `id` y `slug` deben ser iguales y coincidir con el nombre del archivo (sin .json)
- Convención: `{tipo}-{numero}-{año}` → `decreto-158-2007`
- Categorías válidas: `curriculo`, `organizacion`, `acceso`, `evaluacion`, `profesorado`, `titulaciones`, `general`
- IDs de estructura: `art-N`, `titulo-N`, `titulo-N-cap-N`, `cap-N`, `da-N`, `dt-N`, `dd-unica`, `df-N`, `anexo-N`, `preambulo`

#### Cross-references bidireccionales
- Si Ley B modifica Ley A: actualizar AMBAS leyes
- En Ley A: `posteriorAffectations` + versiones en artículos + `lastModifiedDate`
- En Ley B: `priorAffectations`
- Leyes no ingresadas: usar `lawId` con slug esperado (enlace roto temporal, OK)

#### Preámbulos en valenciano
- El marcador de inicio varía: "L'estructura...", "Este decret...", "La Llei orgànica..."
- El marcador de fin es la línea aislada "DECRET" o "DECRETE" (no confundir con "DECRETO" dentro del texto)
- Verificar que no se captura texto de los artículos

### Leyes ingresadas (verificar en `data/metadata/law-registry.json`)
- `decreto-158-2007` - Currículo EEPP música (29 arts + Anexo I)
- `decreto-159-2007` - Currículo EE música (27 arts + 4 anexos)
- `decreto-57-2020` - Organización conservatorios (56 arts)
- `decreto-46-2026` - Modificación decretos ERE (6 arts)

### Configuración importante
- `base` en `astro.config.mjs` DEBE tener trailing slash: `/legis_cpm/`
- Node.js >= 22.12.0
- Deploy automático en push a main via GitHub Actions
