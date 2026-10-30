/**
 * Daytime sky behind the airplane window, drawn on a 2D canvas.
 *
 * Motion follows mikes.cv (react-three-fiber + drei <Clouds>): cloud banks in depth layers drift
 * left and wrap around, the near layer much faster than the far one. Speeds were measured on
 * that site frame by frame and scaled to this smaller window (glass 70 px wide vs 121 px).
 *
 * Look follows the illustration the user sent: flat cumulus at the bottom of the glass, round
 * bumps with a soft gradient and shaded creases, under a clear sky. Daylight palette instead of
 * its dusk pinks. Coordinates are glass units (Figma px of «Стекло», 70.086 × 91.571).
 */

export const GLASS_W = 70.0864;
export const GLASS_H = 91.5712;

/**
 * Top of the sky keeps the Figma blue (#4596F0). It stays saturated down to the wing, as in the
 * reference, so the silver wing reads against it; the horizon sits low, behind the clouds.
 */
export const SKY_STOPS: [number, string][] = [
  [0, '#4596F0'],
  [0.07, '#4C9DF6'],
  [0.45, '#62AEF8'],
  [0.66, '#86C1FA'],
  [0.78, '#B9DBFC'],
  [0.88, '#DCEDFD'],
  [1, '#EDF5FE'],
];

type CloudLayer = {
  /** Glass px per second, leftwards. */
  speed: number;
  /** Clouds per wrap span; banks overlap so the bottom never opens up. */
  count: number;
  width: [number, number];
  /** Where the highest bump of a cloud starts. */
  top: [number, number];
  /** How much lower the outer bumps sit than the middle ones. */
  drop: number;
  bump: [number, number];
  light: string;
  dark: string;
  crease: string;
};

/** Far bank: big soft masses, a touch darker, slow. */
const BACK: CloudLayer = {
  speed: 4,
  count: 3,
  width: [34, 46],
  top: [67, 72],
  drop: 6,
  bump: [7.5, 13.5],
  light: '#F4F8FD',
  dark: '#C3D1E3',
  crease: '138, 160, 190',
};

/** Near bank under the wing: three or four round bumps per cloud, brightest, fast. */
const FRONT: CloudLayer = {
  speed: 11,
  count: 3,
  width: [40, 52],
  top: [75, 80],
  drop: 7,
  bump: [10, 17],
  light: '#FFFFFF',
  dark: '#D3DEEB',
  crease: '148, 168, 196',
};

const LAYERS = [BACK, FRONT];

/* ---------- helpers ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/* ---------- clouds ---------- */

type Cloud = {
  image: HTMLCanvasElement;
  /** Image box: left edge at x + ox, top at oy, in glass units. */
  ox: number;
  oy: number;
  w: number;
  h: number;
  speed: number;
  /** x when the cloud has just fully left on the left; it re-enters at lo + span, fully off on the right. */
  lo: number;
  x0: number;
  span: number;
};

type Bump = { x: number; y: number; r: number };

/** One cumulus: a row of round bumps peaking in the middle, filled down past the glass bottom. */
function makeCloud(spec: CloudLayer, rand: () => number, dpr: number) {
  const width = lerp(spec.width[0], spec.width[1], rand());
  const top = lerp(spec.top[0], spec.top[1], rand());
  const avg = (spec.bump[0] + spec.bump[1]) / 2;
  const n = Math.max(3, Math.round(width / (avg * 1.25)));

  const bumps: Bump[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Taller in the middle, with some irregularity so the banks don't look stamped.
    const envelope = Math.pow(Math.sin(Math.PI * (0.1 + 0.8 * t)), 0.8);
    const r = lerp(spec.bump[0], spec.bump[1], envelope * (0.72 + 0.28 * rand()));
    const bumpTop = top + (1 - envelope) * spec.drop + (rand() - 0.5) * 1.2;
    bumps.push({ x: t * width + (rand() - 0.5) * avg * 0.3, y: bumpTop + r, r });
  }

  // Body under the bumps: big circles along a line below the glass, rounded at both ends.
  const bodyY = GLASS_H + spec.bump[1] * 0.6;
  const body: Bump[] = [];
  for (let x = bumps[0].x; x <= bumps[n - 1].x + 0.01; x += spec.bump[1]) {
    body.push({ x, y: bodyY, r: spec.bump[1] * 1.25 });
  }

  const all = [...bumps, ...body];
  const minX = Math.min(...all.map((b) => b.x - b.r)) - 0.5;
  const maxX = Math.max(...all.map((b) => b.x + b.r)) + 0.5;
  const minY = Math.min(...bumps.map((b) => b.y - b.r)) - 0.5;
  const maxY = GLASS_H + 1;

  const w = maxX - minX;
  const h = maxY - minY;
  const image = document.createElement('canvas');
  image.width = Math.ceil(w * dpr);
  image.height = Math.ceil(h * dpr);
  const ctx = image.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.translate(-minX, -minY);

  // Silhouette with a top-to-base gradient.
  ctx.beginPath();
  for (const b of all) {
    ctx.moveTo(b.x + b.r, b.y);
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  }
  const fill = ctx.createLinearGradient(0, minY, 0, GLASS_H);
  fill.addColorStop(0, spec.light);
  fill.addColorStop(0.35, spec.light);
  fill.addColorStop(1, spec.dark);
  ctx.fillStyle = fill;
  ctx.fill();

  // Shading stays inside the silhouette.
  ctx.globalCompositeOperation = 'source-atop';

  // Shaded creases where each bump tucks under the previous one, and under every bump.
  for (let i = 0; i < n; i++) {
    const b = bumps[i];
    const cx = b.x - b.r * 0.78;
    const cy = b.y + b.r * 0.4;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * 0.95);
    g.addColorStop(0, `rgba(${spec.crease}, ${i === 0 ? 0.25 : 0.5})`);
    g.addColorStop(1, `rgba(${spec.crease}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(cx - b.r, cy - b.r, b.r * 2, b.r * 2);

    const ux = b.x + b.r * 0.15;
    const uy = b.y + b.r * 0.95;
    const u = ctx.createRadialGradient(ux, uy, 0, ux, uy, b.r * 0.9);
    u.addColorStop(0, `rgba(${spec.crease}, 0.32)`);
    u.addColorStop(1, `rgba(${spec.crease}, 0)`);
    ctx.fillStyle = u;
    ctx.fillRect(ux - b.r, uy - b.r, b.r * 2, b.r * 2);
  }

  // Sunlit top-left of every bump.
  for (const b of bumps) {
    const hx = b.x - b.r * 0.3;
    const hy = b.y - b.r * 0.45;
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, b.r * 0.9);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(hx - b.r, hy - b.r, b.r * 2, b.r * 2);
  }

  return { image, w, h, ox: minX, oy: minY };
}

function buildLayer(spec: CloudLayer, seed: number, dpr: number): Cloud[] {
  const rand = mulberry32(seed);
  const made = Array.from({ length: spec.count }, () => makeCloud(spec, rand, dpr));
  // One period for the whole layer, long enough for the widest cloud to leave before it returns.
  const span = GLASS_W + Math.max(...made.map((m) => m.w));
  const step = span / spec.count;
  const clouds: Cloud[] = made.map((m, c) => ({
    image: m.image,
    ox: m.ox,
    oy: m.oy,
    w: m.w,
    h: m.h,
    speed: spec.speed,
    lo: -(m.ox + m.w),
    x0: c * step + (rand() - 0.5) * step * 0.3,
    span,
  }));
  // Taller clouds behind: draw the ones with the highest tops first.
  return clouds.sort((a, b) => a.oy - b.oy);
}

function drawSky(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, GLASS_H);
  for (const [o, c] of SKY_STOPS) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, GLASS_W, GLASS_H);

  // Haze over the cloud tops.
  ctx.save();
  ctx.translate(GLASS_W / 2, 72);
  ctx.scale(GLASS_W * 0.75, 7);
  const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  haze.addColorStop(0, 'rgba(244, 249, 255, 0.7)');
  haze.addColorStop(1, 'rgba(244, 249, 255, 0)');
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export class CloudSky {
  private ctx: CanvasRenderingContext2D;
  private sky: HTMLCanvasElement | null = null;
  private layers: Cloud[][] = [];
  private raf = 0;
  private last = 0;
  /** Seconds of flight so far; starts mid-way so the first frame already looks scattered. */
  private time = 37;
  private running = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  /** (Re)builds the sky and the cloud images for the current pixel ratio. */
  setPixelRatio(ratio: number) {
    const dpr = Math.min(3, Math.max(1, ratio));
    this.canvas.width = Math.round(GLASS_W * dpr);
    this.canvas.height = Math.round(GLASS_H * dpr);

    const sky = document.createElement('canvas');
    sky.width = this.canvas.width;
    sky.height = this.canvas.height;
    const sctx = sky.getContext('2d')!;
    sctx.scale(sky.width / GLASS_W, sky.height / GLASS_H);
    drawSky(sctx);
    this.sky = sky;

    this.layers = LAYERS.map((spec, i) => buildLayer(spec, 7 + i * 13, dpr));
    this.draw();
  }

  draw() {
    const { ctx, canvas } = this;
    if (!this.sky) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.sky, 0, 0);
    ctx.setTransform(canvas.width / GLASS_W, 0, 0, canvas.height / GLASS_H, 0, 0);
    for (const layer of this.layers) {
      for (const c of layer) {
        // Wraps only while fully outside the glass: x runs over [lo, lo + span).
        const x = mod(c.x0 - c.speed * this.time - c.lo, c.span) + c.lo;
        ctx.drawImage(c.image, x + c.ox, c.oy, c.w, c.h);
      }
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      // Same clamp as the reference: a dropped frame never makes the clouds jump.
      this.time += Math.min((now - this.last) / 1000, 1 / 30);
      this.last = now;
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
