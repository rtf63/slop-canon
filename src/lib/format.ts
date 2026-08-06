/** Shared formatting helpers so every surface labels entries the same way. */

/** Zero-padded issue number, e.g. 0 -> "000", 214 -> "214". Used in URLs + labels. */
export const issueSlug = (n: number) => String(n).padStart(3, '0');
export const issueLabel = (n: number) => `Nº${issueSlug(n)}`;

// Dates are authored as YYYY-MM-DD and parsed to UTC midnight, so we format in
// UTC too — otherwise a build machine behind UTC renders the day one off.
export const longDate = (d: Date) =>
  d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).toUpperCase();

export const dayLabel = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Newest first, by issue number. */
export const byIssueDesc = <T extends { data: { issue: number } }>(a: T, b: T) =>
  b.data.issue - a.data.issue;
