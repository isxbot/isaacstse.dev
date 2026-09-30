import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dillon.isaacstse.dev',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  markdown: {
    syntaxHighlight: false,
  },
});
