"""Recolours the wing exported from Figma (lavender in the stock illustration) to the DS greys.

Every pixel becomes its own luma (Rec. 709), so the shading of the original stays, with a faint
cool tint like #F2F3F5 / #7E7F81; LIFT brightens the upper surface towards aluminium. Alpha is kept.
A .webp destination is written as WebP at quality 90 (about 5 KB instead of 21 KB as PNG, no
visible difference); anything else as PNG. Needs Pillow. Run after a new export from Figma:

    python3 scripts/gray-wing.py wing-figma.png src/assets/window/wing.webp
"""
import sys

from PIL import Image

TINT = (0.982, 0.988, 1.0)  # R, G, B multipliers: blue stays, red and green drop a little
LIFT = 1.06  # brightness of the lit surface; the dark underside barely moves


def gray(r, g, b):
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    luma = 255 * (luma / 255) ** (1 / LIFT)
    return tuple(min(255, round(luma * t)) for t in TINT)


def main(src, dst):
    im = Image.open(src).convert('RGBA')
    im.putdata([(*gray(r, g, b), a) for r, g, b, a in im.getdata()])
    if dst.endswith('.webp'):
        im.save(dst, 'WEBP', quality=90, method=6)
    else:
        im.save(dst, optimize=True)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
