-- Glass of the airplane window: daytime sky, two banks of cumulus drifting left and the wing,
-- all clipped to the opening. A port of src/components/PlaneWindow/cloudSky.ts (same seeds and
-- generator, so the clouds match the web version) and of the wing flex in PlaneWindow.module.css.
-- Coordinates are Figma glass units, 70.0864 × 91.5712, origin at the glass's top-left: place the
-- node at (19.884, 25.175) on the 109.856 × 148 window artboard.

local GLASS_W = 70.0864
local GLASS_H = 91.5712
local K = 0.5522847 -- cubic Bézier constant for a quarter circle

-- Same stops as SKY_STOPS on the web.
local SKY_STOPS = {
  { 0, 69, 150, 240 },
  { 0.07, 76, 157, 246 },
  { 0.45, 98, 174, 248 },
  { 0.66, 134, 193, 250 },
  { 0.78, 185, 219, 252 },
  { 0.88, 220, 237, 253 },
  { 1, 237, 245, 254 },
}

type Layer = {
  speed: number,
  count: number,
  width: { number },
  top: { number },
  drop: number,
  bump: { number },
  light: { number },
  dark: { number },
  crease: { number },
  seed: number,
}

-- Far bank: big soft masses, a touch darker, slow.
local BACK: Layer = {
  speed = 8,
  count = 3,
  width = { 34, 46 },
  top = { 67, 72 },
  drop = 6,
  bump = { 7.5, 13.5 },
  light = { 244, 248, 253 },
  dark = { 195, 209, 227 },
  crease = { 138, 160, 190 },
  seed = 7,
}

-- Near bank under the wing: three or four round bumps per cloud, brightest, fast.
local FRONT: Layer = {
  speed = 22,
  count = 3,
  width = { 40, 52 },
  top = { 75, 80 },
  drop = 7,
  bump = { 10, 17 },
  light = { 255, 255, 255 },
  dark = { 211, 222, 235 },
  crease = { 148, 168, 196 },
  seed = 20,
}

-- The wing image (wing.png, 280 × 399, 4×) covers the glass by width, centred vertically.
local WING_SCALE = GLASS_W / 280
local WING_TOP = -4.066
-- It flexes about its root, off the glass on the right: 105 % / 70 % of the wing box.
local WING_PIVOT_X = GLASS_W * 1.05
local WING_PIVOT_Y = WING_TOP + 399 * WING_SCALE * 0.7
local WING_ANGLE = -0.45 * math.pi / 180
local WING_LIFT = -0.15
local WING_HALF_PERIOD = 4.8

type Shade = { path: Path, paint: Paint }

type Bump = { x: number, y: number, r: number }

type Cloud = {
  silhouette: Path,
  fill: Paint,
  shades: { Shade },
  minY: number,
  w: number,
  speed: number,
  lo: number,
  x0: number,
  span: number,
}

type PlaneGlass = {
  speed: Input<number>,
  time: number,
  glass: Path,
  sky: Path,
  skyPaint: Paint,
  haze: Path,
  hazePaint: Paint,
  layers: { { Cloud } },
  wing: Image?,
  sampler: ImageSampler?,
}

local function lerp(a: number, b: number, t: number): number
  return a + (b - a) * t
end

local function rgba(c: { number }, alpha: number): Color
  return Color.rgba(c[1], c[2], c[3], math.floor(alpha * 255 + 0.5))
end

-- mulberry32 with JavaScript's 32-bit integer maths, so the clouds come out as on the web.
local function imul(a: number, b: number): number
  local ah, al = bit32.rshift(a, 16), bit32.band(a, 0xFFFF)
  local bh, bl = bit32.rshift(b, 16), bit32.band(b, 0xFFFF)
  return bit32.band(al * bl + bit32.lshift(bit32.band(ah * bl + al * bh, 0xFFFF), 16), 0xFFFFFFFF)
end

local function mulberry32(seed: number): () -> number
  local a = bit32.band(seed, 0xFFFFFFFF)
  return function(): number
    a = bit32.band(a + 0x6D2B79F5, 0xFFFFFFFF)
    local t = imul(bit32.bxor(a, bit32.rshift(a, 15)), bit32.bor(a, 1))
    t = bit32.bxor(t, bit32.band(t + imul(bit32.bxor(t, bit32.rshift(t, 7)), bit32.bor(t, 61)), 0xFFFFFFFF))
    return bit32.bxor(t, bit32.rshift(t, 14)) / 4294967296
  end
end

local function addCircle(path: Path, cx: number, cy: number, r: number)
  local k = r * K
  path:moveTo(Vector.xy(cx + r, cy))
  path:cubicTo(Vector.xy(cx + r, cy + k), Vector.xy(cx + k, cy + r), Vector.xy(cx, cy + r))
  path:cubicTo(Vector.xy(cx - k, cy + r), Vector.xy(cx - r, cy + k), Vector.xy(cx - r, cy))
  path:cubicTo(Vector.xy(cx - r, cy - k), Vector.xy(cx - k, cy - r), Vector.xy(cx, cy - r))
  path:cubicTo(Vector.xy(cx + k, cy - r), Vector.xy(cx + r, cy - k), Vector.xy(cx + r, cy))
  path:close()
end

-- A round spot that fades out to its edge, as the radial gradients in cloudSky.ts.
local function spot(cx: number, cy: number, r: number, c: { number }, alpha: number): Shade
  local path = Path.new()
  addCircle(path, cx, cy, r)
  local paint = Paint.with({
    style = 'fill',
    gradient = Gradient.radial(Vector.xy(cx, cy), r, {
      { position = 0, color = rgba(c, alpha) },
      { position = 1, color = rgba(c, 0) },
    }),
  })
  return { path = path, paint = paint }
end

-- One cumulus: a row of round bumps peaking in the middle, filled down past the glass bottom.
local function makeCloud(spec: Layer, rand: () -> number): Cloud
  local width = lerp(spec.width[1], spec.width[2], rand())
  local top = lerp(spec.top[1], spec.top[2], rand())
  local avg = (spec.bump[1] + spec.bump[2]) / 2
  local n = math.max(3, math.floor(width / (avg * 1.25) + 0.5))

  local bumps: { Bump } = {}
  for i = 0, n - 1 do
    local t = i / (n - 1)
    -- Taller in the middle, with some irregularity so the banks don't look stamped.
    local envelope = math.sin(math.pi * (0.1 + 0.8 * t)) ^ 0.8
    local r = lerp(spec.bump[1], spec.bump[2], envelope * (0.72 + 0.28 * rand()))
    local bumpTop = top + (1 - envelope) * spec.drop + (rand() - 0.5) * 1.2
    table.insert(bumps, { x = t * width + (rand() - 0.5) * avg * 0.3, y = bumpTop + r, r = r })
  end

  -- Body under the bumps: big circles along a line below the glass, rounded at both ends.
  local all: { Bump } = table.clone(bumps)
  local bodyY = GLASS_H + spec.bump[2] * 0.6
  local x: number = bumps[1].x
  while x <= bumps[n].x + 0.01 do
    table.insert(all, { x = x, y = bodyY, r = spec.bump[2] * 1.25 })
    x += spec.bump[2]
  end

  local minX, maxX, minY = math.huge, -math.huge, math.huge
  for _, b in all do
    minX = math.min(minX, b.x - b.r)
    maxX = math.max(maxX, b.x + b.r)
  end
  for _, b in bumps do
    minY = math.min(minY, b.y - b.r)
  end
  minX -= 0.5
  maxX += 0.5
  minY -= 0.5

  -- Silhouette with a top-to-base gradient.
  local silhouette = Path.new()
  for _, b in all do
    addCircle(silhouette, b.x, b.y, b.r)
  end
  local fill = Paint.with({
    style = 'fill',
    gradient = Gradient.linear(Vector.xy(0, minY), Vector.xy(0, GLASS_H), {
      { position = 0, color = rgba(spec.light, 1) },
      { position = 0.35, color = rgba(spec.light, 1) },
      { position = 1, color = rgba(spec.dark, 1) },
    }),
  })

  -- Shaded creases where each bump tucks under the previous one and under every bump, then the
  -- sunlit top-left of every bump. They are drawn clipped to the silhouette.
  local shades = {}
  for i, b in bumps do
    table.insert(shades, spot(b.x - b.r * 0.78, b.y + b.r * 0.4, b.r * 0.95, spec.crease, if i == 1 then 0.25 else 0.5))
    table.insert(shades, spot(b.x + b.r * 0.15, b.y + b.r * 0.95, b.r * 0.9, spec.crease, 0.32))
  end
  for _, b in bumps do
    table.insert(shades, spot(b.x - b.r * 0.3, b.y - b.r * 0.45, b.r * 0.9, { 255, 255, 255 }, 0.85))
  end

  return {
    silhouette = silhouette,
    fill = fill,
    shades = shades,
    minY = minY,
    w = maxX - minX,
    speed = spec.speed,
    lo = -maxX,
    x0 = 0,
    span = 0,
  }
end

local function buildLayer(spec: Layer): { Cloud }
  local rand = mulberry32(spec.seed)
  local clouds = {}
  local widest = 0
  for _ = 1, spec.count do
    local c = makeCloud(spec, rand)
    widest = math.max(widest, c.w)
    table.insert(clouds, c)
  end
  -- One period for the whole layer, long enough for the widest cloud to leave before it returns.
  local span = GLASS_W + widest
  local step = span / spec.count
  for i, c in clouds do
    c.span = span
    c.x0 = (i - 1) * step + (rand() - 0.5) * step * 0.3
  end
  -- Taller clouds behind: the ones with the highest tops are drawn first.
  table.sort(clouds, function(a: Cloud, b: Cloud): boolean
    return a.minY < b.minY
  end)
  return clouds
end

local function glassPath(): Path
  local p = Path.new()
  p:moveTo(Vector.xy(35.0432, 0))
  p:cubicTo(Vector.xy(54.397, 0), Vector.xy(70.0864, 14.1204), Vector.xy(70.0864, 31.5389))
  p:lineTo(Vector.xy(70.0864, 60.0323))
  p:cubicTo(Vector.xy(70.0864, 77.4508), Vector.xy(54.397, 91.5712), Vector.xy(35.0432, 91.5712))
  p:cubicTo(Vector.xy(15.6894, 91.5712), Vector.xy(0, 77.4508), Vector.xy(0, 60.0323))
  p:lineTo(Vector.xy(0, 31.5389))
  p:cubicTo(Vector.xy(0, 14.1204), Vector.xy(15.6894, 0), Vector.xy(35.0432, 0))
  p:close()
  return p
end

function init(self: PlaneGlass, context: Context): boolean
  self.glass = glassPath()

  self.sky = Path.new()
  self.sky:moveTo(Vector.xy(0, 0))
  self.sky:lineTo(Vector.xy(GLASS_W, 0))
  self.sky:lineTo(Vector.xy(GLASS_W, GLASS_H))
  self.sky:lineTo(Vector.xy(0, GLASS_H))
  self.sky:close()
  local stops = {}
  for _, s in SKY_STOPS do
    table.insert(stops, { position = s[1], color = Color.rgb(s[2], s[3], s[4]) })
  end
  self.skyPaint = Paint.with({
    style = 'fill',
    gradient = Gradient.linear(Vector.xy(0, 0), Vector.xy(0, GLASS_H), stops),
  })

  -- Haze over the cloud tops: a unit circle stretched into a flat ellipse when drawn.
  self.haze = Path.new()
  addCircle(self.haze, 0, 0, 1)
  self.hazePaint = Paint.with({
    style = 'fill',
    gradient = Gradient.radial(Vector.xy(0, 0), 1, {
      { position = 0, color = Color.rgba(244, 249, 255, 179) },
      { position = 1, color = Color.rgba(244, 249, 255, 0) },
    }),
  })

  self.layers = { buildLayer(BACK), buildLayer(FRONT) }

  self.wing = context:image('wing')
  self.sampler = ImageSampler('clamp', 'clamp', 'bilinear')
  return true
end

function advance(self: PlaneGlass, seconds: number): boolean
  -- Same clamp as the web: a dropped frame never makes the clouds jump.
  self.time += math.min(seconds, 1 / 30)
  return true
end

function update(self: PlaneGlass) end

local function wingMatrix(time: number): Mat2D
  -- 4.8 s each way, ease-in-out, like `wing-flex … infinite alternate`.
  local p = (time % (WING_HALF_PERIOD * 2)) / WING_HALF_PERIOD
  if p > 1 then
    p = 2 - p
  end
  local e = 0.5 - 0.5 * math.cos(math.pi * p)
  return Mat2D.withTranslation(WING_PIVOT_X, WING_PIVOT_Y)
    * Mat2D.withRotation(WING_ANGLE * e)
    * Mat2D.withTranslation(0, WING_LIFT * e)
    * Mat2D.withTranslation(-WING_PIVOT_X, -WING_PIVOT_Y)
    * Mat2D.withScaleAndTranslation(WING_SCALE, WING_SCALE, 0, WING_TOP)
end

function draw(self: PlaneGlass, renderer: Renderer)
  renderer:save()
  renderer:clipPath(self.glass)

  renderer:drawPath(self.sky, self.skyPaint)
  renderer:save()
  renderer:transform(Mat2D.withScaleAndTranslation(GLASS_W * 0.75, 7, GLASS_W / 2, 72))
  renderer:drawPath(self.haze, self.hazePaint)
  renderer:restore()

  local t = self.time * self.speed
  for _, layer in self.layers do
    for _, c in layer do
      -- Wraps only while fully outside the glass: x runs over [lo, lo + span).
      local x = (c.x0 - c.speed * t - c.lo) % c.span + c.lo
      renderer:save()
      renderer:transform(Mat2D.withTranslation(x, 0))
      renderer:drawPath(c.silhouette, c.fill)
      renderer:save()
      renderer:clipPath(c.silhouette)
      for _, s in c.shades do
        renderer:drawPath(s.path, s.paint)
      end
      renderer:restore()
      renderer:restore()
    end
  end

  local wing = self.wing
  local sampler = self.sampler
  if wing and sampler then
    renderer:save()
    renderer:transform(wingMatrix(self.time))
    renderer:drawImage(wing, sampler, 'srcOver', 1)
    renderer:restore()
  end

  renderer:restore()
end

return function(): Node<PlaneGlass>
  return {
    -- Cloud speed multiplier: 1 is the web speed (near 22, far 8 glass px/s).
    speed = 1,
    -- Seconds of flight so far; starts mid-way so the first frame already looks scattered.
    time = 37,
    glass = Path.new(),
    sky = Path.new(),
    skyPaint = Paint.new(),
    haze = Path.new(),
    hazePaint = Paint.new(),
    layers = {},
    wing = nil,
    sampler = nil,
    init = init,
    advance = advance,
    update = update,
    draw = draw,
  }
end