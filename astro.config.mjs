// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.sky3.org',
  output: 'static',
  compressHTML: true,
});
