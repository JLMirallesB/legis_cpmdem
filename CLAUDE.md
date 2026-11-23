# Instrucciones para Claude Code - Legis CPM

## Qué es este proyecto
Lector de legislación de Conservatorios Profesionales de Música y Danza **y de Escuelas de enseñanza artística no formal (Música y Artes Escénicas)** de la Generalitat Valenciana. Sitio estático con Astro 7.x desplegado en GitHub Pages (`compressHTML: true` en `astro.config.mjs`: el modo `'jsx'` por defecto de Astro 7 borra los espacios entre texto y expresiones en líneas distintas). Datos en JSON bilingüe (es/va). El proyecto se llama **Legis CPMDEM** (los textos de marca ya incluyen las Escuelas de Música).

## Documentación
Leer antes de hacer cambios: `docs/CONTENT-GUIDE.md` (guía de ingesta para personas; Claude sigue la skill `ingesta-legis`), `docs/DATA-SCHEMA.md` (esquema JSON), `src/lib/types.ts` (tipos TypeScript).
Aclaraciones de aplicación (material no normativo): `data/aclaraciones/{slug}.md`, descritas en `docs/DATA-SCHEMA.md` §«Aclaraciones de aplicación».

## Pendientes
La lista de lo que queda está en `PENDIENTE.md` (sala de tareas, skill `todo-room`).
Léela antes de proponer trabajo y táchala en el mismo commit que termina algo.

## Consultas sobre la normativa
Al responder una duda sobre cómo se aplica una norma, buscar en **todo `data/`**, no solo en `data/laws/`. Las fichas de `data/notebooks/`, `data/center-docs/` y `data/organos/` también tienen notas:
```bash
grep -ril "<término>" data/
```
- Para cada norma citada en la respuesta, comprobar si existe `data/aclaraciones/<slug>.md` y **leerlo entero** antes de responder. El MCP `legis-cpmdem` ya lo devuelve en `get_law` y `search_articles`.
- Distinguir **Aclaración** (criterio comunicado por escrito) de **Criterio interpretativo** (lectura del repositorio, sin respaldo escrito). Si una aclaración matiza la lectura literal del articulado, citarla y advertir que es material no normativo: prevalece la norma.
- No afirmar que algo «no existe en el repositorio» sin haber buscado en todo `data/`; si no aparece, decir dónde se ha buscado.

## Ingesta de leyes y datasets
Para ingestar una ley («Ingesta esta ley: [URL]», «Añade este decreto: [URL]»), re-extraer, corregir o versionar una ya ingestada, o tocar los datasets externos (`scripts/gen-*-dataset.py`, `public/data/`): **carga antes la skill `ingesta-legis`** (`.claude/skills/ingesta-legis/`). Tiene el proceso paso a paso y, en `referencias/`, las lecciones de las ingestas anteriores.

Tres pasos de toda ingesta que no se saltan nunca (el detalle, en la skill):
- **Cribar la ley nueva contra las fichas** de `data/center-docs/`, `data/organos/` y `data/notebooks/`: `node scripts/refs-triage.mjs --todas --ley <slug>` (paso 6).
- **Revisar las referencias con ancla** que avise `npm run validate`, y solo después de mirar cada aviso `npm run refs:refresh` (paso 6 bis).
- **Comprobar si la ley alimenta un dataset externo** (calendario escolar, laboral o fiestas locales → `gen-calendario-dataset.py`; sorteo o convocatoria de admisión → `gen-sorteo-dataset.py`): si no se regenera y se publica, las apps externas siguen sirviendo datos del curso pasado (paso 7).

## Configuración importante
- `base` en `astro.config.mjs` DEBE tener trailing slash: `/legis_cpmdem/`
- Node.js >= 22.12.0
- Deploy automático en push a main via GitHub Actions

## Versionado y releases (OBLIGATORIO en cada release)
- **Una sola rama, `main`**, en local y en `origin`: se commitea y se empuja directamente a `main`. Nada de ramas `release-X.Y.Z` ni PR. Las PR #5-#7 del historial vienen de sesiones de Claude Code en iOS, donde no hay otra forma de llevar cambios al remoto; no son la convención (regla del usuario, 13/10/2026).
- Secuencia: `src/lib/version.ts` (se muestra en el header) → `data/changelog.json` bilingüe es/va → `npm run validate` (0 errores) → `npm run build` → commit en `main` → `git push origin main` (dispara el deploy) → `git tag vX.Y.Z` → `git push origin vX.Y.Z`.
- Al empezar o cerrar un release: `git fetch --prune` y `git branch -a`. Si aparece otra rama (p. ej. una que vino de iOS), comprobar que está fusionada en `main` y proponer borrarla.
- «Borrar la rama al fusionar» en la configuración de GitHub queda en manos del usuario (a Claude se lo impidieron los permisos el 13/10/2026).
- Formato: major.minor.patch (major=cambios de estructura, minor=ingestas de leyes, patch=correcciones)
