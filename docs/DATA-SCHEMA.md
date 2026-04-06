# Esquema de Datos - Legis CPM

## Ubicaci&oacute;n de Archivos

- Leyes en castellano: `data/laws/es/{slug}.json`
- Leyes en valenciano: `data/laws/va/{slug}.json`
- Categor&iacute;as: `data/metadata/categories.json`
- Tipos TypeScript: `src/lib/types.ts`

## Esquema JSON de una Ley

Cada ley es un archivo JSON con la siguiente estructura:

```json
{
  "id": "decreto-158-2007",
  "slug": "decreto-158-2007",
  "type": "decreto",
  "number": "158/2007",
  "date": "2007-09-21",
  "publishedIn": {
    "source": "DOGV",
    "number": "5606",
    "date": "2007-09-25",
    "url": "https://dogv.gva.es/es/eli/es-vc/d/2007/09/21/158",
    "pdfUrl": "https://dogv.gva.es/datos/2007/09/25/pdf/2007_11706.pdf"
  },
  "title": "T&iacute;tulo completo de la norma",
  "titleShort": "T&iacute;tulo corto para listados",
  "category": "curriculo",
  "vigpiracy": {
    "status": "vigente | vigente_parcial | derogada_parcial | derogada",
    "statusLabel": "Texto legible del estado",
    "effectiveDate": "2007-09-26",
    "lastModifiedDate": "2020-03-15"
  },
  "structure": [ ... ],
  "legalAnalysis": { ... }
}
```

## Campos Principales

| Campo | Tipo | Obligatorio | Descripci&oacute;n |
|-------|------|-------------|-------------|
| id | string | S&iacute; | Identificador &uacute;nico (mismo en ambos idiomas) |
| slug | string | S&iacute; | Slug para la URL (mismo en ambos idiomas) |
| type | LawType | S&iacute; | Tipo: ley_organica, ley, real_decreto, decreto, orden, resolucion, correccion_errores |
| number | string | S&iacute; | N&uacute;mero oficial (ej: "158/2007") |
| date | string | S&iacute; | Fecha de aprobaci&oacute;n (YYYY-MM-DD) |
| publishedIn | object | S&iacute; | Datos de publicaci&oacute;n oficial |
| title | string | S&iacute; | T&iacute;tulo completo |
| titleShort | string | S&iacute; | T&iacute;tulo corto para listados |
| category | string | S&iacute; | ID de categor&iacute;a (ver categories.json) |
| vigpiracy | object | S&iacute; | Estado de vigencia |
| structure | array | S&iacute; | Estructura jer&aacute;rquica del texto |
| legalAnalysis | object | S&iacute; | An&aacute;lisis jur&iacute;dico |

## Estructura del Texto (structure)

La estructura es un &aacute;rbol jer&aacute;rquico:

```json
{
  "type": "titulo",
  "id": "titulo-1",
  "title": "T&iacute;tulo I. Disposiciones generales",
  "children": [
    {
      "type": "capitulo",
      "id": "titulo-1-cap-1",
      "title": "Cap&iacute;tulo I. Objeto y &aacute;mbito",
      "children": [
        {
          "type": "articulo",
          "id": "art-1",
          "number": "1",
          "title": "Art&iacute;culo 1. Objeto",
          "content": "Texto del art&iacute;culo...",
          "versions": [...]
        }
      ]
    }
  ]
}
```

### Tipos de nodo (StructureNodeType)

- `preambulo` - Pre&aacute;mbulo
- `titulo` - T&iacute;tulo (puede contener cap&iacute;tulos)
- `capitulo` - Cap&iacute;tulo (puede contener secciones o art&iacute;culos)
- `seccion` - Secci&oacute;n
- `articulo` - Art&iacute;culo (nodo hoja con contenido)
- `disposicion_adicional` - Disposici&oacute;n adicional
- `disposicion_transitoria` - Disposici&oacute;n transitoria
- `disposicion_derogatoria` - Disposici&oacute;n derogatoria
- `disposicion_final` - Disposici&oacute;n final
- `anexo` - Anexo

## Versiones de Art&iacute;culos

Un art&iacute;culo puede tener m&uacute;ltiples versiones si ha sido modificado:

```json
{
  "type": "articulo",
  "id": "art-5",
  "number": "5",
  "title": "Art&iacute;culo 5. ...",
  "content": "Texto de la versi&oacute;n VIGENTE (la m&aacute;s reciente)",
  "versions": [
    {
      "versionId": "v2",
      "effectiveDate": "2020-03-15",
      "modifiedBy": {
        "lawId": "decreto-5-2020",
        "title": "Decreto 5/2020...",
        "articleRef": "art-3"
      },
      "content": "Texto de la versi&oacute;n vigente..."
    },
    {
      "versionId": "v1",
      "effectiveDate": "2007-09-26",
      "modifiedBy": null,
      "content": "Texto original del art&iacute;culo..."
    }
  ]
}
```

- El campo `content` del art&iacute;culo siempre contiene la versi&oacute;n vigente
- El array `versions` est&aacute; ordenado de m&aacute;s reciente a m&aacute;s antiguo
- `modifiedBy` es `null` para la versi&oacute;n original

## An&aacute;lisis Jur&iacute;dico

```json
{
  "legalAnalysis": {
    "enactedPursuantTo": [
      {
        "lawId": "ley-organica-2-2006",
        "title": "Ley Org&aacute;nica 2/2006...",
        "articles": ["art-45"],
        "relationship": "habilitante"
      }
    ],
    "priorAffectations": [
      {
        "lawId": "decreto-anterior",
        "title": "Norma que esta ley modifica",
        "type": "modifica",
        "articles": ["art-5"],
        "description": "Modifica el art&iacute;culo 5..."
      }
    ],
    "posteriorAffectations": [
      {
        "lawId": "decreto-5-2020",
        "title": "Norma que modifica esta ley",
        "type": "modifica",
        "articles": ["art-1", "art-3"],
        "date": "2020-03-15",
        "description": "Modifica los art&iacute;culos 1 y 3"
      }
    ],
    "derogations": [],
    "concordances": []
  }
}
```

## Convenciones de Nombrado

- **slug**: tipo-numero-ano en min&uacute;sculas (ej: `decreto-158-2007`)
- **IDs de art&iacute;culo**: `art-{numero}` (ej: `art-1`, `art-12`)
- **IDs de t&iacute;tulo**: `titulo-{numero}` (ej: `titulo-1`)
- **IDs de cap&iacute;tulo**: `titulo-{n}-cap-{n}` (ej: `titulo-1-cap-2`)
- **IDs de versi&oacute;n**: `v{numero}` de m&aacute;s reciente a m&aacute;s antiguo
- **Fechas**: formato ISO `YYYY-MM-DD`
