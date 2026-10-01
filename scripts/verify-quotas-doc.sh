#!/usr/bin/env bash
# Verifies docs/quotas.md documents EVERY external host the app's source code talks to,
# and that each host's row is complete (service, host, use, limit, failure mode, mitigation).
#
# Run from the repo root in Git Bash:  bash scripts/verify-quotas-doc.sh
# Exit code 0 = all hosts documented, 1 = something is missing or incomplete.

set -u
cd "$(git rev-parse --show-toplevel)" || exit 2

DOC="docs/quotas.md"
REQUIRED_CELLS=6   # Service | Host | Used for | Limit | When it fails | Mitigation

# Hosts that are not real external dependencies (XML namespaces, local dev, placeholders).
IGNORE_REGEX='^(www\.w3\.org|localhost|127\.0\.0\.1|example\.com)$'

failures=0
pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

echo "== doc exists =="
if [ ! -f "$DOC" ]; then
  fail "$DOC does not exist"
fi

echo "== external hosts found in tracked source files =="
# Only tracked files (so git-ignored js/config.js is excluded); skip docs/ and scripts/ themselves.
hosts="$(git ls-files -- '*.html' '*.js' '*.json' '*.css' ':!:docs' ':!:scripts' \
  | xargs grep -ohE 'https?://[A-Za-z0-9.-]+' 2>/dev/null \
  | sed -E 's#^https?://##' | sort -u | grep -vE "$IGNORE_REGEX")"

if [ -z "$hosts" ]; then
  fail "no external hosts detected — the scan itself is broken"
else
  echo "$hosts" | sed 's/^/        /'
fi

echo "== every host has a complete row =="
for host in $hosts; do
  [ -f "$DOC" ] || { fail "$host (no doc)"; continue; }
  # table rows only: lines starting with '|' that mention the host
  row="$(grep -F "$host" "$DOC" | grep -E '^\s*\|' | head -1)"
  if [ -z "$row" ]; then
    fail "$host is not documented in a table row"
    continue
  fi
  cells="$(echo "$row" | awk -F'|' '{n=0; for(i=2;i<NF;i++){gsub(/^[ \t]+|[ \t]+$/,"",$i); if($i!="") n++}; print n}')"
  if [ "$cells" -ge "$REQUIRED_CELLS" ]; then
    pass "$host (row has $cells filled cells)"
  else
    fail "$host row has only $cells/$REQUIRED_CELLS filled cells"
  fi
done

echo
if [ "$failures" -eq 0 ]; then echo "ALL CHECKS PASSED"; exit 0; else echo "$failures CHECK(S) FAILED"; exit 1; fi
