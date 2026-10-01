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
echo "== no oversized tracked files =="
MAX_BYTES=$((500 * 1024))
oversized=0
while IFS= read -r f; do
  [ -f "$f" ] || continue
  size="$(wc -c < "$f")"
  if [ "$size" -gt "$MAX_BYTES" ]; then
    fail "$f is $((size / 1024)) KB (limit $((MAX_BYTES / 1024)) KB)"
    oversized=1
  fi
done < <(git ls-files)
[ "$oversized" -eq 0 ] && pass "every tracked file is under $((MAX_BYTES / 1024)) KB"

echo
echo "== local files referenced by the HTML pages exist =="
# js/config.js is local-only (git-ignored on purpose), so a fresh clone legitimately lacks it.
missing=0
while IFS= read -r html; do
  refs="$( { grep -oE '(src|href)="[^"]+"' "$html" | sed -E 's/^(src|href)="//; s/"$//';
             grep -oE "url\('[^']+'\)" "$html" | sed -E "s/^url\('//; s/'\)$//"; } | sort -u )"
  while IFS= read -r ref; do
    [ -z "$ref" ] && continue
    case "$ref" in http://*|https://*|data:*|\#*|mailto:*|js/config.js) continue ;; esac
    if [ ! -f "$ref" ]; then fail "$html references missing file: $ref"; missing=1; fi
  done <<< "$refs"
done < <(git ls-files -- '*.html')
[ "$missing" -eq 0 ] && pass "all referenced local files exist"

echo
echo "== login logo is web-sized (small file, still sharp) =="
LOGO="$(grep -oE 'src="Logo[^"]*"' index.html | head -1 | sed -E 's/^src="//; s/"$//')"
MAX_LOGO_BYTES=$((100 * 1024))
MIN_LOGO_WIDTH=400    # shown at 200 CSS px; 2x is the minimum for sharp phone screens
MAX_LOGO_WIDTH=1200   # anything wider is wasted bytes
if [ -z "$LOGO" ] || [ ! -f "$LOGO" ]; then
  fail "index.html does not reference an existing logo file"
else
  size="$(wc -c < "$LOGO")"
  if [ "$size" -le "$MAX_LOGO_BYTES" ]; then pass "$LOGO is $((size / 1024)) KB (limit $((MAX_LOGO_BYTES / 1024)) KB)"; else fail "$LOGO is $((size / 1024)) KB (limit $((MAX_LOGO_BYTES / 1024)) KB)"; fi
  if command -v python >/dev/null 2>&1 && python -c "import PIL" 2>/dev/null; then
    width="$(python -c "from PIL import Image; import sys; print(Image.open(sys.argv[1]).size[0])" "$LOGO")"
    if [ "$width" -ge "$MIN_LOGO_WIDTH" ] && [ "$width" -le "$MAX_LOGO_WIDTH" ]; then
      pass "$LOGO is ${width}px wide (between $MIN_LOGO_WIDTH and $MAX_LOGO_WIDTH)"
    else
      fail "$LOGO is ${width}px wide (want $MIN_LOGO_WIDTH-$MAX_LOGO_WIDTH)"
    fi
  else
    echo "  SKIP  width check (needs Python with Pillow)"
  fi
fi

echo
if [ "$failures" -eq 0 ]; then echo "ALL CHECKS PASSED"; exit 0; else echo "$failures CHECK(S) FAILED"; exit 1; fi
