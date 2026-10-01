#!/usr/bin/env bash
# Repository hygiene checks. Each section guards one rule so it cannot quietly regress.
# Run from the repo root in Git Bash:  bash scripts/verify-repo-hygiene.sh
# Exit code 0 = all checks passed, 1 = at least one failed.

set -u
cd "$(git rev-parse --show-toplevel)" || exit 2

failures=0
pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

echo "== no stray or junk files are tracked =="
# Names that are almost always accidents: editor/OS leftovers, scratch files, unnamed files.
stray="$(git ls-files | grep -iE '(^|/)(untitled[^/]*|new file[^/]*|thumbs\.db|\.ds_store|[^/]*\.(bak|tmp|orig|rej|swp)|[^/]*~)$')"
if [ -z "$stray" ]; then
  pass "no stray files tracked"
else
  while IFS= read -r f; do fail "stray file tracked: $f (remove with: git rm \"$f\")"; done <<< "$stray"
fi

echo
if [ "$failures" -eq 0 ]; then echo "ALL CHECKS PASSED"; exit 0; else echo "$failures CHECK(S) FAILED"; exit 1; fi
