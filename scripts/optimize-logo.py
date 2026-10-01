"""Shrink a large source logo into a small, sharp web image.

Needs Python 3 with Pillow:  pip install pillow

Usage (from the repo root):
    python scripts/optimize-logo.py <source image> <output .webp> [width] [quality]

Example:
    python scripts/optimize-logo.py Logo.png Logo.webp 600 85

The page shows the logo at 200 CSS pixels wide. Phones draw up to 3 device pixels per CSS
pixel, so 600 px is enough to stay sharp. Anything bigger only costs bandwidth.
The source file is never modified.
"""

import sys
from pathlib import Path

from PIL import Image


def optimize(source: Path, output: Path, width: int, quality: int) -> None:
    if not source.is_file():
        sys.exit(f"source not found: {source}")
    if source.resolve() == output.resolve():
        sys.exit("refusing to overwrite the source image; choose a different output path")

    with Image.open(source) as img:
        img = img.convert("RGB")  # the logo has no transparency
        height = round(img.height * width / img.width)  # keep the aspect ratio
        # LANCZOS is the high-quality resampling filter for shrinking images.
        small = img.resize((width, height), Image.Resampling.LANCZOS)
        # method=6 spends more time to get a smaller file at the same visual quality.
        small.save(output, format="WEBP", quality=quality, method=6)

    before = source.stat().st_size / 1024
    after = output.stat().st_size / 1024
    print(f"{source.name}: {before:,.0f} KB -> {output.name}: {after:,.0f} KB ({width}x{height} px)")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    optimize(
        Path(args[0]),
        Path(args[1]),
        int(args[2]) if len(args) > 2 else 600,
        int(args[3]) if len(args) > 3 else 85,
    )
