import type { APIRoute } from 'astro';
import { getEntries } from '../lib/entries';
import { issueLabel } from '../lib/format';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Hand-rolled RSS so the site stays dependency-light. Only public (un-gated)
// entries are syndicated in full; gated days appear as a teaser + subscribe nudge.
export const GET: APIRoute = async ({ site }) => {
  const base = site?.href.replace(/\/$/, '') ?? '';
  const entries = await getEntries();

  const items = entries
    .map(({ entry, gated }) => {
      const d = entry.data;
      const url = `${base}/day/${d.issue}`;
      const body = gated
        ? `A poem for subscribers. Read it in the archive.`
        : `${d.poem}\n\n— ${d.provenance.madeBy}`;
      return `    <item>
      <title>${esc(`${issueLabel(d.issue)} · ${d.title}`)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${d.date.toUTCString()}</pubDate>
      <description>${esc(body)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Slop Canon</title>
    <link>${base}</link>
    <description>One machine-written poem each morning, informed by the day's news.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
