import { getCollection, type CollectionEntry } from 'astro:content';
import { byIssueDesc } from './format';

/**
 * Archive gating rule (spec §4.1): the most-recent N issues are free; older
 * entries are gated for subscribers. In M1 this only drives the visual
 * "members only" treatment; real enforcement (validated against the Substack
 * subscriber list) lands at the edge in M4. `gated: true` in frontmatter can
 * force-gate any single entry regardless of recency.
 */
export const PUBLIC_RECENT = 6;

export type LoadedEntry = { entry: CollectionEntry<'entries'>; gated: boolean };

export async function getEntries(): Promise<LoadedEntry[]> {
  const all = (await getCollection('entries')).sort(byIssueDesc);
  const publicIssues = new Set(all.slice(0, PUBLIC_RECENT).map((e) => e.data.issue));
  return all.map((entry) => ({
    entry,
    gated: entry.data.gated ?? !publicIssues.has(entry.data.issue),
  }));
}
