import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The `entries` collection is the contract between the generation pipeline and
 * the website. One file per day, immutable once published. Each entry is a
 * single machine-written poem, informed by the day's news, plus its provenance
 * receipt. No artwork — Slop Canon is poem-only.
 *
 * On approval the pipeline writes one of these files; that commit triggers a
 * static rebuild. See PLAN.md §12 (the pipeline seam).
 */
const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/entries' }),
  schema: z.object({
    issue: z.number().int().nonnegative(), // monotonic; drives Nº, permalink, order (day one is 0)
    date: z.coerce.date(),
    weather: z.enum(['light', 'mixed', 'heavy']), // drives the palette (heavy = drained)
    dreamTheme: z.string(), // the oblique subject carrying today's feeling
    title: z.string(), // short human title for the poem + <title>
    poem: z.string(), // 8–16 lines; line breaks preserved
    caption: z.string(), // in-voice line for the newsletter / social
    provenance: z.object({
      madeBy: z.string().default('a language model'),
      writtenAt: z.string(), // e.g. "06:04 PST"
      saw: z.array(z.string()).min(2).max(4), // oblique "what it saw" notes
      // The real articles behind the oblique notes — cited + linked in the receipt.
      sources: z
        .array(z.object({ title: z.string(), url: z.string().url() }))
        .default([]),
    }),
    // Optional manual override; otherwise gating is computed at build (recent N public).
    gated: z.boolean().optional(),
  }),
});

export const collections = { entries };
