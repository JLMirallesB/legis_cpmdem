// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://JLMirallesB.github.io',
  base: '/legis_cpm',
  output: 'static',
  build: {
    format: 'directory'
  }
});
