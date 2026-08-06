// @ts-check
import { defineConfig } from 'astro/config';

// The Daily Hallucination — static-first site.
// Entries are immutable once published, so we prerender everything.
// The one dynamic need (archive gating) is handled later at the edge (M4).
export default defineConfig({
  site: 'https://thedailyhallucination.example', // TODO: real domain at deploy
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // Keep pretty permalinks: /day/214 -> day/214/index.html
    format: 'directory',
  },
});
