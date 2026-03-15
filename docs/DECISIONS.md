# Decisiones Arquitect&oacute;nicas - Legis CPM

Registro de decisiones importantes del proyecto (ADR - Architecture Decision Records).

---

## ADR-001: Framework - Astro

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Contexto**: Necesitamos un framework para construir un lector de legislaci&oacute;n est&aacute;tico desplegable en GitHub Pages.

**Opciones consideradas**:
1. HTML/CSS/JS puro
2. React (Vite)
3. Vue.js (Vite)
4. **Astro** (elegida)

**Decisi&oacute;n**: Astro, porque genera HTML est&aacute;tico puro (ideal para contenido legislativo), tiene soporte nativo para rutas por idioma, y permite a&ntilde;adir interactividad con "islas" solo donde sea necesario.

---

## ADR-002: Ingesta de Leyes - Asistida por Claude

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Contexto**: Necesitamos una forma de importar leyes desde PDFs del DOGV al formato JSON del sistema.

**Opciones consideradas**:
1. Script de scraping autom&aacute;tico
2. Importaci&oacute;n 100% manual
3. **Asistida por Claude** (elegida)

**Decisi&oacute;n**: Claude lee el PDF, extrae estructura, detecta modificaciones cruzadas y genera los JSON. El usuario revisa antes de commitear. Raz&oacute;n: m&aacute;xima flexibilidad para manejar casos especiales sin necesidad de mantener un parser complejo.

---

## ADR-003: Almacenamiento de Datos - JSON plano

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Contexto**: Necesitamos almacenar los textos legislativos de forma estructurada sin backend.

**Decisi&oacute;n**: Archivos JSON planos en `data/laws/{lang}/`, un archivo por ley y por idioma. Los JSON contienen toda la informaci&oacute;n: texto, estructura, versiones de art&iacute;culos y an&aacute;lisis jur&iacute;dico. Astro los lee en build time.

---

## ADR-004: B&uacute;squeda - FlexSearch del lado del cliente

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Contexto**: La b&uacute;squeda debe funcionar en un sitio est&aacute;tico sin backend.

**Decisi&oacute;n**: FlexSearch con &iacute;ndice pre-generado en build time. El &iacute;ndice se serializa a JSON y se carga en el cliente cuando se usa el buscador. Estimaci&oacute;n: 200KB-1.5MB para 20-50 leyes.

---

## ADR-005: Bilingismo - Rutas separadas por idioma

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Decisi&oacute;n**: Rutas `/es/` y `/va/` con p&aacute;ginas Astro separadas. Detecci&oacute;n autom&aacute;tica del idioma del navegador con fallback a castellano. Preferencia guardada en localStorage.

---

## ADR-006: Versiones de Art&iacute;culos - Selector sin diff

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Decisi&oacute;n**: Desplegable `<select>` por art&iacute;culo que permite elegir la versi&oacute;n. Se muestra el texto de esa versi&oacute;n sin comparativa visual (sin diff). Los datos de todas las versiones se embeben en la p&aacute;gina como JSON inline.

---

## ADR-007: Descargas - JSON + Markdown (consolidado e historial)

**Fecha**: 2026-03-15
**Estado**: Aceptada

**Decisi&oacute;n**: Cada ley ofrece descarga en JSON (datos completos), Markdown consolidado (solo versi&oacute;n vigente) y Markdown con historial (todas las versiones). La generaci&oacute;n de Markdown se hace en el cliente. Tambi&eacute;n se ofrece enlace a la publicaci&oacute;n oficial (DOGV/BOE).
