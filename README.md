# Slop Canon — website

Static Astro site: today's poem + its provenance receipt, on a single page. One
machine-written poem a day, informed by the day's news, in the machine's voice — no
drawing. Built to be near-zero-ops — entries are immutable, so the whole site is
statically generated and rebuilt when a new approved entry lands.

> Note: the project folder is still named `the-daily-hallucination` (its original
> name); the brand is **Slop Canon**.

See [PLAN.md](PLAN.md) for the full build plan, milestones, and the pipeline contract.

## Running it

This machine has a **local, no-sudo Node** at `~/.local/node-current` (installed for
this project; delete that folder to remove it). It isn't on your global `PATH`, so
either prefix commands or add it to your shell:

```bash
export PATH="$HOME/.local/node-current/bin:$PATH"
```

Then, from this folder:

```bash
npm install      # once
npm run dev      # dev server at http://localhost:4321
npm run build    # static build → dist/
npm run preview  # serve the built dist/
npm run check    # type-check
```

## How it's laid out

```
src/
  content/entries/*.md   one immutable file per day (the pipeline writes these)
  content.config.ts      Zod schema + the build-time heavy-day guard
  layouts/Base.astro     <head>, SEO/OG, header + footer shell
  components/             Header, Marquee, Hero, EntryPlate, Receipt,
                         Archive + PoemCard (grid + in-page drawer),
                         PrintsBlock, Footer
  lib/                   entries.ts (gating rule), format.ts, site.ts
  pages/                 index, day/[issue], about, rss.xml
                         (single-page site: today's poem + archive + shop
                          all live on the landing; no newsletter/subscribe)
  styles/global.css      design tokens + all component CSS + heavy-day drain
```

## The one rule that matters

An entry's `weather` (`light` | `mixed` | `heavy`) drives everything. On a `heavy`
day the palette **drains to grey** (`global.css`, the `[data-weather="heavy"]`
scope), the whimsy is stilled, and the build **fails** if such an entry isn't marked
`art.palette: drained` (`content.config.ts`). This is the project's compassion
mechanic, enforced in code — not a theme toggle.

## Adding a day (until the pipeline does it)

Drop a file in `src/content/entries/`, e.g. `215.md`, following the shape of the
existing entries. `issue` must be unique and monotonic. Rebuild to publish.
```
