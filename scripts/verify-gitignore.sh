#!/usr/bin/env bash
# CF-001 — verifies that .gitignore is readable by git and really protects secrets.
# Run from anywhere inside the repo:  bash scripts/verify-gitignore.sh
# Exit code 0 = all checks passed, 1 = at least one failed.

set -u
cd "$(git rev-parse --show-toplevel)" || exit 2

failures=0
pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

echo "== .gitignore encoding =="

# UTF-16 files are full of NUL bytes; git cannot parse them. tr strips NULs, cmp compares.
if tr -d '\000' < .gitignore | cmp -s - .gitignore; then
  pass "no NUL bytes (not UTF-16/UTF-32)"
else
  fail "contains NUL bytes — file is UTF-16/UTF-32, git will ignore every rule"
fi

# A byte-order mark at the start can corrupt the first rule. Check UTF-8 / UTF-16 BOMs.
first_bytes="$(head -c 3 .gitignore | od -An -tx1 | tr -d ' \n')"
case "$first_bytes" in
  efbbbf*|fffe*|feff*) fail "starts with a byte-order mark ($first_bytes)" ;;
  *)                   pass "no byte-order mark" ;;
esac

echo "== paths that MUST be ignored =="
# --no-index: judge the rules themselves, even for files git already tracks.
must_ignore=(
  js/config.js
  .env
  .env.local
  .env.production
  .env.staging
  node_modules/some-package/index.js
  dist/index.html
  .firebase/hosting.cache
  debug.log
  .DS_Store
)
for p in "${must_ignore[@]}"; do
  if git check-ignore -q --no-index "$p"; then pass "$p is ignored"; else fail "$p is NOT ignored"; fi
done

echo "== paths that MUST stay tracked-able =="
must_not_ignore=(
  js/config.example.js
  .env.example
  index.html
  README.md
)
for p in "${must_not_ignore[@]}"; do
  if git check-ignore -q --no-index "$p"; then fail "$p is wrongly ignored"; else pass "$p is not ignored"; fi
done

echo "== secrets must not be tracked =="
if git ls-files --error-unmatch js/config.js >/dev/null 2>&1; then
  fail "js/config.js is tracked by git (run: git rm --cached js/config.js)"
else
  pass "js/config.js is not tracked"
fi

echo
if [ "$failures" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  exit 0
else
  echo "$failures CHECK(S) FAILED"
  exit 1
fi
