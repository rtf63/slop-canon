#!/bin/bash
# Vercel "Ignored Build Step" guard.
#   exit 0  -> SKIP the deploy (build ignored)
#   exit 1  -> proceed with the deploy
#
# Purpose: the daily poem routine may only ever change poem entries. If a
# commit authored by the routine touches anything else (site code, config,
# this file), don't deploy it.
#
# Honest limits (documented on purpose):
# - The routine pushes with the same account as the human, so this keys on the
#   commit AUTHOR (Claude <noreply@anthropic.com>), which a sufficiently
#   clever prompt-injected agent could spoof. This guard is friction, not
#   proof; the strict CSP in vercel.json is the harder backstop (injected
#   inline scripts won't execute in browsers).
# - Only the HEAD commit of a push is inspected (Vercel builds the head).

set -u

AUTHOR_EMAIL=$(git log -1 --format='%ae' 2>/dev/null || echo "")

# Human-authored commits always deploy.
if [ "$AUTHOR_EMAIL" != "noreply@anthropic.com" ]; then
  exit 1
fi

# Shallow-clone edge case: no parent to diff against -> allow the build.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  exit 1
fi

BAD=$(git diff --name-only HEAD^ HEAD | grep -vE '^src/content/entries/[^/]+\.md$' || true)

if [ -n "$BAD" ]; then
  echo "deploy-guard: BLOCKED — routine-authored commit touches non-entry files:"
  echo "$BAD"
  exit 0 # skip the deploy
fi

exit 1 # entries-only change from the routine: deploy it
