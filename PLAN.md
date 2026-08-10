# Slop Canon — Website Build Plan

> **Pivot (current):** the project is now **Slop Canon** — a poem-only daily (no
> drawing). The receipt and the machine/AI framing stay. Sections below that
> reference the drawing, image model, or per-channel image rendering are from the
> original drawing+poem concept and no longer apply; the content model is now
> `{ issue, date, weather, dreamTheme, title, poem, caption, provenance }`.
>
> **Later removals:** the Substack newsletter integration (subscribe CTAs,
> cookie-based draft automation) and the calendar (.ics) feed were all removed —
> the site has no subscribe path; poems live on the site + RSS only. Sections
> mentioning Substack/subscriptions are historical.


Scope: **the website** (landing + archive surface) from the project spec. It drops
into the larger daily pipeline at two seams (§12) without pulling the rest of the
pipeline — generation, Instagram, Shopify, Substack publishing, the approval queue —
into this codebase.

## Stack (chosen)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Astro** (static, content collections) | Ships ~0 JS; typed content; immutable-entries → static build. |
| Content store | Flat Markdown, one file per entry, in-repo | Git is the archive. Graduate to a headless CMS later without touching components. |
| Art | Generated raster per entry (`art.src`, CDN) | Inline-SVG demo art (`EntryArt.astro`) is the seed only; `src` wins when present. |
| Hosting | Netlify or Cloudflare Pages | Free static + build hooks + edge middleware for gating (M4). |
| Subscribe | Substack (hosted/embed) | No billing in this codebase. |
| Gating | Edge middleware + periodic Substack subscriber sync | The only non-static piece; deferred to M4. |

## Routes

- `/` — landing: today + subscribe + prints teaser + archive teaser
- `/day/[issue]` — permalink (canonical, OG-tagged, prev/next)
- `/archive` — full index, gated tiles show a members overlay
- `/prints` — links out to Shopify
- `/about` — the honest note, expanded
- `/rss.xml` — feed (public entries in full; gated ones teased)

## Content model

One file per day in `src/content/entries/`, validated by `src/content.config.ts`.
Fields map 1:1 onto the Voice skill's output (`WEATHER`, `DREAM-THEME`, `POEM`,
`ART BRIEF`, `CAPTION`, `WHERE IT CAME FROM`): `issue, date, weather, dreamTheme,
title, poem, art{sketch|src, alt, palette}, caption, provenance{madeBy,
hallucinatedAt, saw[]}, gated?`.

The schema enforces the compassion rule at build: a `weather: heavy` entry whose
`art.palette` isn't `drained` fails the build.

## Heavy-day mechanic

`weather` sets `data-weather` on each entry wrapper. `[data-weather="heavy"]` in
`global.css` remaps the fluoro inks to muted taupe, softens shadows, and stills the
doodles. First-class, not a theme option.

## Archive gating

`src/lib/entries.ts`: most-recent `PUBLIC_RECENT` (6) issues are free; older are
gated (or forced via `gated: true`). M1 renders the gated *visual* (members
overlay). Real enforcement — validated against the Substack subscriber list, synced
to an edge KV — lands at the edge in **M4**, keeping the rest of the site static.

## §12 The pipeline seam (how a new day appears)

1. On approval the pipeline **writes one entry file** (schema above) + uploads the
   plate to the CDN and sets `art.src`.
2. That commit fires a **build hook** → Astro rebuilds → new `/day/[issue]` + `/`.
3. Fully hands-off; a rebuild is a couple of minutes.

## Milestones

- **M1 — Static shell + design system.** ✅ Astro project; tokens/fonts; core
  components ported from the v2 mockup; heavy-day mechanic; one entry rendering.
- **M2 — Content model + real pages.** ✅ Content collection + Zod schema; seed
  entries incl. a heavy day; `/`, `/day/[issue]`, `/archive`, `/prints`, `/about`,
  RSS. (Landed together with M1.)
- **M3 — Distribution polish.** Wire Substack subscribe; self-host fonts (drop the
  Google Fonts request); real Shopify links; per-entry OG images; a11y + perf pass.
- **M4 — Gating + auto-rebuild.** Edge-middleware subscriber gate + Substack sync;
  build hook + documented seam; deploy to the production domain.

## Known follow-ups (tagged `TODO` in code)

- `Base.astro` — self-host fonts via `@fontsource` (privacy + perf).
- `SubscribeBlock.astro` — wire form to Substack.
- `PrintsBlock.astro` / `prints.astro` — real Shopify storefront URLs.
- `astro.config.mjs` — set the real `site` domain.
- Production art pipeline sets `art.src`; inline SVGs remain as fallback/demo.
```
