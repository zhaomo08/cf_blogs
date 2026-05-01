// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://cf-blogs-4j9.pages.dev',
  output: 'static',
  integrations: [sitemap()],
});
