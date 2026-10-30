"""Rebuilds every contour of the window SVGs as a rounder shape with the same bounding box.
Usage (after a fresh export from Figma): python3 scripts/round-window.py src/assets/window/{frame,rim,glass-mask}.svg

Shape: straight sides with half-ellipse caps on top and bottom (vertical semi-axis = K × half-width),
measured on the reference porthole. Each evenodd ring keeps its two contours, so gradients,
strokes, shadows and highlights from Figma stay untouched; only the curvature changes.
"""
import re, sys

K = 0.9          # cap height / half-width, from the reference (0.88–0.9)
C = 0.5522847    # cubic Bezier quarter-ellipse constant

def contours(d):
    toks = re.findall(r'[MLHVCZmlhvcz]|-?\d*\.?\d+(?:e-?\d+)?', d)
    out, cur, x, y, i, cmd = [], None, 0.0, 0.0, 0, None
    def add(px, py): cur.append((px, py))
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
            if cmd in 'Zz':
                continue
            if cmd == 'M':
                cur = []; out.append(cur)
            continue
        if cmd in ('M', 'L'):
            x, y = float(toks[i]), float(toks[i + 1]); i += 2; add(x, y)
            if cmd == 'M': cmd = 'L'
        elif cmd == 'H':
            x = float(toks[i]); i += 1; add(x, y)
        elif cmd == 'V':
            y = float(toks[i]); i += 1; add(x, y)
        elif cmd == 'C':
            for k in range(3):
                add(float(toks[i + 2 * k]), float(toks[i + 2 * k + 1]))
            x, y = cur[-1]; i += 6
        else:
            raise ValueError('unsupported command ' + cmd)
    return out

def f(v):
    return f'{v:.4f}'.rstrip('0').rstrip('.')

def shape(x0, y0, x1, y1):
    a = (x1 - x0) / 2
    cx = (x0 + x1) / 2
    b = min(K * a, (y1 - y0) / 2)
    yt, yb = y0 + b, y1 - b
    return (
        f'M{f(cx)} {f(y0)}'
        f'C{f(cx + C * a)} {f(y0)} {f(x1)} {f(yt - C * b)} {f(x1)} {f(yt)}'
        f'L{f(x1)} {f(yb)}'
        f'C{f(x1)} {f(yb + C * b)} {f(cx + C * a)} {f(y1)} {f(cx)} {f(y1)}'
        f'C{f(cx - C * a)} {f(y1)} {f(x0)} {f(yb + C * b)} {f(x0)} {f(yb)}'
        f'L{f(x0)} {f(yt)}'
        f'C{f(x0)} {f(yt - C * b)} {f(cx - C * a)} {f(y0)} {f(cx)} {f(y0)}Z'
    )

def rebuild(d):
    parts = []
    for pts in contours(d):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        parts.append(shape(min(xs), min(ys), max(xs), max(ys)))
    return ''.join(parts)

for path in sys.argv[1:]:
    s = open(path).read()
    n = 0
    def sub(m):
        global n; n += 1
        return f' d="{rebuild(m.group(1))}"'
    s = re.sub(r' d="([^"]+)"', sub, s)
    open(path, 'w').write(s)
    print(path, n, 'paths')
