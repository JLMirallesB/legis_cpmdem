# Gu&iacute;a de Contenido - Legis CPM

## C&oacute;mo A&ntilde;adir una Nueva Ley

La ingesta de leyes se hace de forma **asistida por Claude** en sesiones de trabajo.

### Proceso

1. **Prep&aacute;rate**: Ten a mano el PDF del DOGV de la ley que quieres a&ntilde;adir
2. **Proporciona el PDF a Claude**: P&aacute;sale el archivo PDF
3. **Claude procesar&aacute;**:
   - Extrae el texto del PDF
   - Separa los dos idiomas (castellano y valenciano)
   - Detecta la estructura (art&iacute;culos, cap&iacute;tulos, disposiciones)
   - Detecta si modifica art&iacute;culos de otras leyes ya existentes
4. **Claude genera los JSON**:
   - Crea `data/laws/es/{slug}.json` (castellano)
   - Crea `data/laws/va/{slug}.json` (valenciano)
   - Si hay modificaciones cruzadas, actualiza las leyes afectadas
5. **Revisa**: Comprueba que los JSON generados son correctos
6. **Commitea**: Haz commit de los cambios

### Convenciones de Nombrado

- **Nombre del archivo**: `{tipo}-{numero}-{a&ntilde;o}.json`
  - Ejemplo: `decreto-158-2007.json`
  - Ejemplo: `orden-28-2011.json`
  - Ejemplo: `resolucion-15-2019.json`

- **slug**: mismo que el nombre del archivo sin `.json`

- **Categor&iacute;as disponibles** (ver `data/metadata/categories.json`):
  - `curriculo` - Curr&iacute;culo
  - `organizacion` - Organizaci&oacute;n y funcionamiento
  - `acceso` - Acceso y admisi&oacute;n
  - `evaluacion` - Evaluaci&oacute;n
  - `profesorado` - Profesorado
  - `titulaciones` - Titulaciones
  - `general` - Normativa general

### Estructura M&iacute;nima de un JSON

Ver [DATA-SCHEMA.md](./DATA-SCHEMA.md) para el esquema completo.

### Verificaci&oacute;n

Despu&eacute;s de a&ntilde;adir una ley, ejecuta:

```bash
npm run dev
```

Y navega a la ley en el navegador para verificar que se renderiza correctamente.
