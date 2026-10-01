#!/usr/bin/env bash
# Verifies that the MapTiler key in js/config.js is origin-restricted and is not a leaked key.
# It reads the key from the local, git-ignored js/config.js and NEVER prints it.
#
# Usage (Git Bash, from the repo root):
#   bash scripts/verify-maptiler-key.sh
#   OLD_MAPTILER_KEY=<previously leaked key> bash scripts/verify-maptiler-key.sh
#
# Optional env vars:
#   OLD_MAPTILER_KEY  a revoked/leaked key: asserts config.js no longer uses it,
#                     and that MapTiler rejects it.
#   DEV_ORIGIN        the origin your dev server uses (default http://localhost:5500)

set -u
cd "$(git rev-parse --show-toplevel)" || exit 2

CONFIG="js/config.js"
DEV_ORIGIN="${DEV_ORIGIN:-http://localhost:5500}"
STYLE_URL="https://api.maptiler.com/maps/streets-v2/style.json"

failures=0
pass() { echo "  PASS  $1"; }
fail() { echo "  FAIL  $1"; failures=$((failures + 1)); }

# Prints only the HTTP status code. Arguments: <key> [origin]. No origin = no Origin header.
status() {
  local key="$1" origin="${2:-}"
  if [ -n "$origin" ]; then
    curl -s -o /dev/null -w "%{http_code}" -H "Origin: $origin" "$STYLE_URL?key=$key"
  else
    curl -s -o /dev/null -w "%{http_code}" "$STYLE_URL?key=$key"
  fi
}

expect() { # expect <description> <actual> <accepted codes...>
  local desc="$1" actual="$2"; shift 2
  for ok in "$@"; do
    if [ "$actual" = "$ok" ]; then pass "$desc (HTTP $actual)"; return; fi
  done
  fail "$desc — got HTTP $actual, expected one of: $*"
}

echo "== config file =="
if [ ! -f "$CONFIG" ]; then fail "$CONFIG not found (copy js/config.example.js to js/config.js)"; echo; echo "$failures CHECK(S) FAILED"; exit 1; fi

KEY="$(sed -n 's/.*MAPTILER_KEY *= *"\([^"]*\)".*/\1/p' "$CONFIG" | head -1)"
WINDOW_KEY="$(sed -n 's/.*window\.MAPTILER_KEY *= *"\([^"]*\)".*/\1/p' "$CONFIG" | head -1)"

if [ -z "$KEY" ]; then fail "no MAPTILER_KEY found in $CONFIG"; echo; echo "$failures CHECK(S) FAILED"; exit 1; fi
pass "found MAPTILER_KEY (${#KEY} characters)"

if [ "$KEY" = "$WINDOW_KEY" ]; then pass "export and window.MAPTILER_KEY are the same key"; else fail "export and window.MAPTILER_KEY differ — update BOTH lines"; fi

if [ -n "${OLD_MAPTILER_KEY:-}" ]; then
  if [ "$KEY" = "$OLD_MAPTILER_KEY" ]; then fail "$CONFIG still contains the OLD leaked key"; else pass "$CONFIG no longer uses the old key"; fi
else
  echo "  SKIP  old-key checks (set OLD_MAPTILER_KEY to enable)"
fi

echo "== key works from allowed origins =="
expect "origin http://localhost"   "$(status "$KEY" http://localhost)"   200
expect "origin http://127.0.0.1"   "$(status "$KEY" http://127.0.0.1)"   200
expect "origin $DEV_ORIGIN"        "$(status "$KEY" "$DEV_ORIGIN")"      200

echo "== key is refused from other places =="
expect "origin https://evil.example"   "$(status "$KEY" https://evil.example)"   401 403
expect "origin http://localhost.evil.example (look-alike)" "$(status "$KEY" http://localhost.evil.example)" 401 403
expect "no Origin header (unknown origin)" "$(status "$KEY")"                    401 403

if [ -n "${OLD_MAPTILER_KEY:-}" ]; then
  echo "== old key is dead =="
  expect "old key from localhost" "$(status "$OLD_MAPTILER_KEY" http://localhost)" 401 403
fi

echo
if [ "$failures" -eq 0 ]; then echo "ALL CHECKS PASSED"; exit 0; else echo "$failures CHECK(S) FAILED"; exit 1; fi
