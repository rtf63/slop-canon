// @ts-check
import { defineConfig } from 'astro/config';

// Slop Canon — static-first site.
// Entries are immutable once published, so we prerender everything.
// The one dynamic need (archive gating) is handled later at the edge (M4).
export default defineConfig({
  site: 'https://www.slopcanon.ai',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // Keep pretty permalinks: /day/214 -> day/214/index.html
    format: 'directory',
  },
  // Let the dev server honor an assigned PORT (e.g. from preview tooling).
  server: { port: Number(process.env.PORT) || 4321 },
  vite: {
    build: {
      // Never inline scripts/assets into the HTML: keeps every <script> as an
      // external same-origin file so the strict CSP (script-src 'self', no
      // unsafe-inline) can hold. That CSP is the backstop that stops any
      // injected inline script from ever running on this domain.
      assetsInlineLimit: 0,
    },
  },
});
