import { getCollection, type CollectionEntry } from 'astro:content';
import { byIssueDesc } from './format';

/**
 * Archive visibility rule: the most-recent N issues are always shown in full;
 * `gated: true` in frontmatter can mark any single entry as held back (renders
 * as a teaser). Currently everything is public — there is no subscription.
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
