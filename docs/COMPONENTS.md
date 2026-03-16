# Componentes - Legis CPM

## Estado: Fase 9 (Pulido completado)

### Layouts

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| BaseLayout | `src/layouts/BaseLayout.astro` | `lang`, `title?`, `description?` | Layout raíz HTML. Incluye skip-link, Header, Footer, meta tags, CSS global. |
| LawReaderLayout | `src/layouts/LawReaderLayout.astro` | `law`, `lang` | Layout dos columnas (sidebar + contenido) para lectura de leyes. Incluye breadcrumb, metadatos, enlace DOGV y DownloadButtons. |

### Componentes de Navegación

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| Header | `src/components/Header.astro` | `lang`, `currentUrl` | Cabecera sticky con logo + versión, nav (catálogo, buscar) y selector de idioma. ARIA labels. Guarda preferencia en localStorage. |
| Footer | `src/components/Footer.astro` | `lang` | Pie de página con disclaimer, contacto (email, GitHub, ko-fi) y copyright. Contraste mejorado para accesibilidad. |
| LawSidebar | `src/components/LawSidebar.astro` | `structure` | Índice lateral navegable con scroll spy. Indentación por profundidad de nodo. aria-label en nav. |

### Componentes del Catálogo

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| LawCatalog | `src/components/LawCatalog.astro` | `lang` | Agrupa leyes por categoría y renderiza LawCard para cada una. |
| LawCard | `src/components/LawCard.astro` | `law`, `lang` | Tarjeta con tipo, badge de vigencia, título corto, número y fecha. Enlaza al lector. |
| VigencyBadge | `src/components/VigencyBadge.astro` | `status`, `lang` | Badge con color por estado: verde (vigente), amarillo (parcial), naranja (derogada parcial), rojo (derogada). |

### Componentes del Lector

| Componente | Archivo | Props | Descripción |
|------------|---------|-------|-------------|
| ArticleContent | `src/components/ArticleContent.astro` | `node`, `lang` | Renderiza artículo con selector de versiones si hay múltiples. JavaScript client-side cambia contenido sin recargar. |
| LegalAnalysis | `src/components/LegalAnalysis.astro` | `analysis`, `vigpiracy`, `lang` | Panel de análisis jurídico: vigencia, normas habilitantes, afectaciones anteriores/posteriores, derogaciones, concordancias. Con badges de color por tipo. |
| DownloadButtons | `src/components/DownloadButtons.astro` | `law`, `lang` | Botones de descarga: JSON (datos completos), Markdown consolidado (solo versión vigente) y Markdown con historial. Genera Markdown en build time con `markdown-export.ts`. |

### Librerías Compartidas

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| types | `src/lib/types.ts` | Tipos TypeScript del modelo de datos (Law, StructureNode, LegalAnalysis, etc.) |
| laws | `src/lib/laws.ts` | Funciones para cargar y filtrar leyes desde JSON (getAllLaws, getLawBySlug, etc.) |
| version | `src/lib/version.ts` | Versión del sitio (constante VERSION) |
| markdown-export | `src/lib/markdown-export.ts` | Genera Markdown consolidado e historial a partir de un objeto Law |
| i18n/utils | `src/i18n/utils.ts` | Funciones i18n: t(), getLang(), getAlternateUrl(), getOtherLang() |

### Endpoints API

| Endpoint | Archivo | Descripción |
|----------|---------|-------------|
| search-index-es.json | `src/pages/api/search-index-es.json.ts` | Índice de búsqueda en castellano generado en build time. |
| search-index-va.json | `src/pages/api/search-index-va.json.ts` | Índice de búsqueda en valenciano generado en build time. |
