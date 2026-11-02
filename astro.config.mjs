// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://JLMirallesB.github.io',
  base: '/legis_cpmdem/',
  output: 'static',
  trailingSlash: 'always',
  // Astro 7 aplica por defecto las reglas de espacios de JSX ('jsx'), que borran los saltos
  // de línea entre texto y expresiones («5 fragmentos · 5 leyes» salía «5 fragmentos·5 leyes»).
  // true = compresión sin pérdida, el comportamiento por defecto de Astro 6.
  compressHTML: true,
  build: {
    format: 'directory'
  }
});
