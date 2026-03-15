# Componentes - Legis CPM

## Estado: Fase 0 (Scaffolding)

Componentes creados hasta ahora:

### Layouts

| Componente | Archivo | Props | Descripci&oacute;n |
|------------|---------|-------|-------------|
| BaseLayout | `src/layouts/BaseLayout.astro` | `lang`, `title?`, `description?` | Layout ra&iacute;z HTML. Incluye Header, Footer, meta tags, CSS global. |

### Componentes de Navegaci&oacute;n

| Componente | Archivo | Props | Descripci&oacute;n |
|------------|---------|-------|-------------|
| Header | `src/components/Header.astro` | `lang`, `currentUrl` | Cabecera sticky con logo, navegaci&oacute;n y selector de idioma |
| Footer | `src/components/Footer.astro` | `lang` | Pie de p&aacute;gina con descripci&oacute;n y copyright |

### Pendientes de crear

- LawReaderLayout - Layout con sidebar para lectura de leyes
- SearchBar - Barra de b&uacute;squeda global
- SearchResults - Resultados de b&uacute;squeda
- LawCard - Tarjeta de ley en el cat&aacute;logo
- LawCatalog - Grid de leyes por categor&iacute;as
- LawSidebar - &Iacute;ndice lateral navegable
- ArticleContent - Renderizado de art&iacute;culo
- VersionSelector - Desplegable de versiones
- LegalAnalysis - Panel de an&aacute;lisis jur&iacute;dico
- VigencyBadge - Badge de estado de vigencia
- LanguageSwitcher - Selector ES/VA (integrado en Header por ahora)
- Breadcrumb - Migas de pan
- DownloadButtons - Botones de descarga (JSON, MD, enlace oficial)
