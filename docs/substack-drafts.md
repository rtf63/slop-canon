# Automated Substack drafts

Every time the daily routine pushes a new poem, a GitHub Action creates a
**draft** in your Substack — never a published post. You review it and hit
**Publish** yourself. That one tap is the daily editorial glance (and the
heavy-day gate: on a hard-news day you want eyes on it before it sends).

Pieces:
- `scripts/substack_draft.py` — formats the newest poem (verse, receipt, linked
  sources, footer) and creates the draft.
- `.github/workflows/substack-draft.yml` — runs the script when a new entry is
  pushed to `main`.

## Why a cookie (and not an API key)

Substack has **no official publishing API** — the 2026 Developer API only does
profile lookups. Automating drafts therefore requires your **`substack.sid`
session cookie**, which is what your logged-in browser uses. Treat it like a
password: anyone who has it has full account access. It's stored as an encrypted
GitHub Actions secret; it's never committed to the repo.

## Enable it (one-time)

1. **Get your `substack.sid`:**
   - Log in to Substack in your browser.
   - Open DevTools → Application (or Storage) → Cookies → `https://substack.com`.
   - Copy the **Value** of the `substack.sid` cookie.
2. **Add two repo secrets** at
   `https://github.com/rtf63/slop-canon/settings/secrets/actions`:
   - `SUBSTACK_SID` = the cookie value from step 1
   - `SUBSTACK_PUBLICATION_URL` = `https://slopcanon.substack.com`
3. Done. The next time the routine publishes a poem, a draft appears in your
   Substack dashboard.

Until those secrets exist, the workflow still runs but **skips cleanly** (stays
green) — so nothing breaks in the meantime.

## Preview locally (no Substack needed)

```bash
DRY_RUN=1 python3 scripts/substack_draft.py
```

Prints the exact title, subtitle, and post body it would create.

## Maintenance & caveats

- **The cookie expires** every so often. When drafts stop appearing, re-grab
  `substack.sid` (step 1) and update the `SUBSTACK_SID` secret.
- **It's unofficial.** Substack can change its internals and break this; and
  automating your own account is a grey area under Substack's ToS. Low practical
  risk for personal use, but real.
- **Draft-only by design.** The script never publishes. If you ever want fully
  hands-off sending, that's a deliberate change — and not recommended on
  heavy-news days.
- **First run:** watch the first real draft to confirm formatting and that the
  draft endpoint still matches (the one part that can't be tested without your
  cookie).
