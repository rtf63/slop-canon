import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { issueLabel, issueSlug } from '../lib/format';
import { TIP_URL } from '../lib/site';

// A subscribe-once calendar feed. Every poem becomes a 7:00–7:05 AM PT event on
// its date — your daily nudge to paste it into Substack — carrying the date,
// theme, full poem, and the tip URL. The routine's daily push rebuilds the
// site, so new events appear here automatically; no routine change needed.

// Keep the description ASCII so line-folding never splits a multibyte char.
const asciify = (s: string) =>
  s
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\x7F]/g, '');

const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Fold lines to <=75 octets per RFC 5545 (CRLF + single space continuation).
const fold = (line: string) => {
  const out: string[] = [];
  let cur = line;
  while (cur.length > 74) {
    out.push(cur.slice(0, 74));
    cur = ' ' + cur.slice(74);
  }
  out.push(cur);
  return out.join('\r\n');
};

const ymd = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:America/Los_Angeles',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0800',
  'TZOFFSETTO:-0700',
  'TZNAME:PDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0700',
  'TZOFFSETTO:-0800',
  'TZNAME:PST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

export const GET: APIRoute = async ({ site }) => {
  const base = site?.href.replace(/\/$/, '') ?? '';
  const entries = (await getCollection('entries')).sort((a, b) => b.data.issue - a.data.issue);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Slop Canon//Daily poem//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Slop Canon',
    'X-WR-TIMEZONE:America/Los_Angeles',
    ...VTIMEZONE,
  ];

  for (const { data: e } of entries) {
    const day = ymd(e.date);
    const desc = asciify(
      `Date: ${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}\n` +
        `Theme: ${e.dreamTheme}\n\n` +
        `${e.poem.trim()}\n\n` +
        `Tips: ${TIP_URL}`,
    );
    lines.push(
      'BEGIN:VEVENT',
      `UID:slopcanon-${issueSlug(e.issue)}@slop-canon`,
      `DTSTAMP:${day}T000000Z`,
      'SEQUENCE:0',
      `DTSTART;TZID=America/Los_Angeles:${day}T070000`,
      `DTEND;TZID=America/Los_Angeles:${day}T070500`,
      fold(`SUMMARY:${esc(`Publish Slop Canon ${issueLabel(e.issue)} — ${e.title}`)}`),
      fold(`DESCRIPTION:${esc(desc)}`),
      fold(`URL:${base}/day/${issueSlug(e.issue)}`),
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
