// The hero's accretion disk, set in motion.
//
// The plate underneath is never redrawn or replaced — it stays the LCP image
// and the entire no-JS / reduced-motion experience. This adds two additive
// passes on a transparent canvas laid exactly over it:
//
//   1. dust seeded on the plate's own bright cells and advected along the
//      disk's flow, so the arc visibly streams, and
//   2. a breathing photon ring at the shadow's edge plus a pointer light that
//      only lifts what the artwork already holds.
//
// Everything is registered to the artwork through a build-time luminance grid
// (scripts/luma-grid.mjs), so the motion sits on the disk rather than near it.

import {createProgram, ratio, resize, uniforms, visibleLoop, wantsMotion} from './gl'

type Grid = {cols: number; rows: number; cells: number[]}

// Measured off the plate's own luminance grid, in image uv:
//   u  — the mirror-symmetry axis of the field
//   v  — midway between the upper arc (v 0.289) and the front of the disk
//        (v 0.556), which is where the shadow sits
//   R  — half that separation, corroborated by a radial edge scan (~0.125)
//
// The shadow is a circle in pixels, so its radius is in units of image HEIGHT,
// which is also the aspect-corrected space every angular term below works in.
const CENTER_U = 0.508
const CENTER_V = 0.423
const SHADOW_R = 0.128

const SPAWN_FLOOR = 0.22 // luma below this is background, not disk
const TRAVEL = 0.12 // how far dust drifts over one life, in image heights
const INTRO_MS = 1800

const vertexSource = `
  attribute vec4 a_seed; // spawn u, spawn v, phase, cycles per second
  attribute vec4 a_flow; // tangent u, tangent v, brightness, size

  uniform float u_time;
  uniform float u_aspect;
  uniform float u_dpr;
  uniform float u_intro;
  uniform float u_presence;
  uniform vec2 u_pointer;
  uniform vec2 u_center;

  varying float v_alpha;
  varying float v_heat;

  void main() {
    float life = fract(u_time * a_seed.w + a_seed.z);

    // Along the ridge first: the tangent was baked from the artwork's own
    // luminance gradient, so dust follows whatever shape the disk is.
    vec2 pos = a_seed.xy + a_flow.xy * (life * ${TRAVEL.toFixed(3)});

    // Then a little curvature about the hole. Aspect-corrected, because the
    // shadow is a circle in pixels and an ellipse in uv.
    vec2 r = vec2((pos.x - u_center.x) * u_aspect, pos.y - u_center.y);
    float dist = max(length(r), 0.03);
    // Differential rotation — inner dust swings harder than outer, which is
    // the thing that reads as orbit rather than as a pan.
    float curl = life * 0.30 / (dist * 9.0 + 1.0);
    float s = sin(curl);
    float c = cos(curl);
    r = vec2(r.x * c - r.y * s, r.x * s + r.y * c);
    pos = u_center + vec2(r.x / u_aspect, r.y);

    // The pointer is a small mass passing through: dust leans into it.
    vec2 d = vec2((pos.x - u_pointer.x) * u_aspect, pos.y - u_pointer.y);
    float grip = exp(-dot(d, d) * 70.0) * u_presence;
    pos -= vec2(d.x / u_aspect, d.y) * grip * 0.16;

    // The canvas is registered to the image box, so image uv IS canvas uv.
    gl_Position = vec4(pos.x * 2.0 - 1.0, 1.0 - pos.y * 2.0, 0.0, 1.0);

    float fade = sin(life * 3.14159265);
    v_alpha = fade * a_flow.z * u_intro * (1.0 + grip * 1.4);
    // Relativistic beaming on the cheap: what moves fastest burns whitest.
    v_heat = smoothstep(0.03, 0.16, a_seed.w) + grip * 0.4;
    gl_PointSize = (a_flow.w + grip * 2.2) * u_dpr;
  }
`

const fragmentSource = `
  precision mediump float;
  varying float v_alpha;
  varying float v_heat;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = core * core * v_alpha;
    // The plate's own palette: amber at rest, near-white at the hot end.
    vec3 color = mix(vec3(1.0, 0.83, 0.66), vec3(1.0, 0.97, 0.92), clamp(v_heat, 0.0, 1.0));
    gl_FragColor = vec4(color * a, a);
  }
`

const glowVertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const glowFragmentSource = `
  precision mediump float;
  varying vec2 v_uv;

  uniform sampler2D u_luma;
  uniform vec2 u_pointer;
  uniform vec2 u_center;
  uniform float u_radius;
  uniform float u_presence;
  uniform float u_aspect;
  uniform float u_time;
  uniform float u_intro;

  void main() {
    vec2 img = vec2(v_uv.x, 1.0 - v_uv.y);
    float luma = texture2D(u_luma, img).r;

    // Pointer light, weighted by the plate: it reveals what is already lit
    // and does nothing at all to the black. Never a spotlight.
    vec2 pd = vec2((img.x - u_pointer.x) * u_aspect, img.y - u_pointer.y);
    float a = exp(-dot(pd, pd) * 80.0) * u_presence * (0.012 + luma * 0.12);

    // Photon ring: a slow breath at the shadow's edge. Weighted by the plate
    // as well, because the shadow is only approximately a circle (~20% radial
    // scatter) — so a few percent of misfit costs brightness instead of
    // showing up as a wrong arc drawn over the artwork.
    vec2 r = vec2((img.x - u_center.x) * u_aspect, img.y - u_center.y);
    float edge = (length(r) - u_radius) * 18.0;
    a += exp(-edge * edge) * luma * (0.10 + 0.06 * sin(u_time * 0.55)) * u_intro;

    vec3 color = mix(vec3(1.0, 0.86, 0.70), vec3(1.0, 0.97, 0.92), luma);
    gl_FragColor = vec4(color * a, a);
  }
`

function lumaTexture(gl: WebGLRenderingContext, grid: Grid): WebGLTexture | null {
  const texture = gl.createTexture()
  if (!texture) return null
  const data = new Uint8Array(grid.cols * grid.rows * 4)
  for (let i = 0; i < grid.cells.length; i++) {
    const channel = Math.round(Math.min(1, Math.max(0, grid.cells[i])) * 255)
    data[i * 4] = channel
    data[i * 4 + 1] = channel
    data[i * 4 + 2] = channel
    data[i * 4 + 3] = 255
  }
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, grid.cols, grid.rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
  return texture
}

/**
 * Places `count` dust motes on the disk.
 *
 * Spawn is luminance-weighted so dust only exists where the artwork glows.
 * Each mote's travel direction is the perpendicular of the local luminance
 * gradient — i.e. along the ridge it sits on — which is what makes the arc
 * stream instead of smearing outward. The grid is square-celled in
 * aspect-corrected space, so gradients in cell units need no correction.
 */
function seedDisk(grid: Grid, count: number, aspect: number) {
  const {cols, rows, cells} = grid
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= cols || y >= rows ? 0 : cells[y * cols + x]

  // Cumulative distribution over the lit cells, weighted toward the brightest.
  const index: number[] = []
  const cumulative: number[] = []
  let total = 0
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] < SPAWN_FLOOR) continue
    total += cells[i] * cells[i]
    index.push(i)
    cumulative.push(total)
  }
  if (!index.length) return null

  const seeds = new Float32Array(count * 4)
  const flows = new Float32Array(count * 4)

  for (let n = 0; n < count; n++) {
    // Binary search the CDF.
    const pick = Math.random() * total
    let lo = 0
    let hi = cumulative.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cumulative[mid] < pick) lo = mid + 1
      else hi = mid
    }
    const cell = index[lo]
    const cx = cell % cols
    const cy = (cell / cols) | 0
    const luma = cells[cell]

    // Jitter within the cell so the grid never shows through as a lattice.
    const u = (cx + Math.random()) / cols
    const v = (cy + Math.random()) / rows

    // Aspect-corrected offset from the hole, used for both the fallback
    // direction and the speed falloff.
    const rx = (u - CENTER_U) * aspect
    const ry = v - CENTER_V
    const dist = Math.hypot(rx, ry) || 1e-4

    const gx = at(cx + 1, cy) - at(cx - 1, cy)
    const gy = at(cx, cy + 1) - at(cx, cy - 1)
    const slope = Math.hypot(gx, gy)

    // Orbital direction (counter-clockwise) is both the fallback for flat
    // regions and the tiebreaker that keeps the whole disk circulating one
    // way — a gradient perpendicular is ambiguous by 180 degrees.
    const ox = -ry / dist
    const oy = rx / dist

    let tx = ox
    let ty = oy
    if (slope > 1e-3) {
      const px = -gy / slope
      const py = gx / slope
      const sign = px * ox + py * oy >= 0 ? 1 : -1
      tx = px * sign
      ty = py * sign
    }

    seeds[n * 4] = u
    seeds[n * 4 + 1] = v
    seeds[n * 4 + 2] = Math.random() // phase, so nothing pulses in unison
    // Keplerian in spirit: the closer in, the faster round. 6–25 s per life.
    seeds[n * 4 + 3] = (0.04 + 0.13 / (dist * 8 + 1)) * (0.7 + Math.random() * 0.6)

    // Tangent is in aspect-corrected space; the shader adds it in uv.
    flows[n * 4] = tx / aspect
    flows[n * 4 + 1] = ty
    flows[n * 4 + 2] = 0.25 + luma * 0.75
    flows[n * 4 + 3] = 1.1 + luma * 1.4 + Math.random() * 0.9
  }

  return {seeds, flows}
}

// Claimed synchronously, because the data-mounted attribute below is only set
// after the grid fetch resolves. astro:page-load fires on the initial load as
// well as on navigations, so mount can be called twice for one canvas — and
// getContext() would hand both calls the same context to drive.
const claimed = new WeakSet<HTMLCanvasElement>()

export async function mountHeroField(canvas: HTMLCanvasElement): Promise<void> {
  if (claimed.has(canvas)) return
  claimed.add(canvas)

  const source = canvas.dataset.gridSrc
  const plate = canvas.parentElement
  // The canvas takes its box from the plate's <img>, so image uv and canvas uv
  // are the same space. That keeps every breakpoint's crop out of the shaders.
  const image = plate?.querySelector('img')
  if (!source || !plate || !image || !wantsMotion()) return

  const response = await fetch(source)
  if (!response.ok) return
  const grid = (await response.json()) as Grid
  if (!grid?.cells?.length) return

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  })
  if (!gl) return

  const dustProgram = createProgram(gl, vertexSource, fragmentSource)
  const glowProgram = createProgram(gl, glowVertexSource, glowFragmentSource)
  const luma = lumaTexture(gl, grid)
  if (!dustProgram || !glowProgram || !luma) return

  const aspect = grid.cols / grid.rows
  const narrow = window.matchMedia('(max-width: 768px)').matches
  const count = narrow ? 380 : 900
  const seeded = seedDisk(grid, count, aspect)
  if (!seeded) return

  canvas.dataset.mounted = 'true'

  const seedBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, seeded.seeds, gl.STATIC_DRAW)
  const flowBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, flowBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, seeded.flows, gl.STATIC_DRAW)
  const quadBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

  const dust = uniforms(gl, dustProgram, [
    'u_time',
    'u_aspect',
    'u_dpr',
    'u_intro',
    'u_presence',
    'u_pointer',
    'u_center',
  ])
  const glow = uniforms(gl, glowProgram, [
    'u_luma',
    'u_pointer',
    'u_center',
    'u_radius',
    'u_presence',
    'u_aspect',
    'u_time',
    'u_intro',
  ])
  const seedAttribute = gl.getAttribLocation(dustProgram, 'a_seed')
  const flowAttribute = gl.getAttribLocation(dustProgram, 'a_flow')
  const quadAttribute = gl.getAttribLocation(glowProgram, 'a_position')

  // The <img> is positioned differently at every breakpoint. Rather than
  // mirror that table in here, measure it — the canvas then lands on the
  // artwork exactly, and future layout edits need no change to this file.
  //
  // Rects, not offsetLeft: the image is centred with `translate: -50% -50%`,
  // and offset* reports the pre-transform layout box. The plate's own
  // transform is a pure translation, so the difference of the two rects is
  // the image's position inside it.
  //
  // The box it lands on is kept here too, so the frame never has to ask the
  // DOM how big the canvas is.
  const box = {width: 0, height: 0}
  const register = () => {
    const plateRect = plate.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    canvas.style.left = `${imageRect.left - plateRect.left}px`
    canvas.style.top = `${imageRect.top - plateRect.top}px`
    canvas.style.width = `${imageRect.width}px`
    canvas.style.height = `${imageRect.height}px`
    box.width = imageRect.width
    box.height = imageRect.height
  }
  register()
  const resizeObserver = new ResizeObserver(register)
  resizeObserver.observe(image)
  resizeObserver.observe(plate)

  const target = {x: CENTER_U, y: CENTER_V, presence: 0}
  const current = {...target}
  const start = performance.now()
  let revealed = false
  // Raw client coordinates from the last pointermove, mapped inside the frame.
  // See the listener below for why this is not done in the event.
  let pending: {x: number; y: number} | null = null

  const {stop} = visibleLoop(plate, now => {
    const dpr = ratio()
    resize(canvas, dpr, box.width, box.height)

    if (pending) {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        target.x = (pending.x - rect.left) / rect.width
        target.y = (pending.y - rect.top) / rect.height
        target.presence = 1
      }
      pending = null
    }

    current.x += (target.x - current.x) * 0.08
    current.y += (target.y - current.y) * 0.08
    current.presence += (target.presence - current.presence) * 0.06

    const time = (now - start) / 1000
    const intro = Math.min(1, (now - start) / INTRO_MS)

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    // Premultiplied source-over for the glow, then straight additive for the
    // dust so overlapping motes accumulate into brighter cores.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    gl.useProgram(glowProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(quadAttribute)
    gl.vertexAttribPointer(quadAttribute, 2, gl.FLOAT, false, 0, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, luma)
    gl.uniform1i(glow.u_luma, 0)
    gl.uniform2f(glow.u_pointer, current.x, current.y)
    gl.uniform2f(glow.u_center, CENTER_U, CENTER_V)
    gl.uniform1f(glow.u_radius, SHADOW_R)
    gl.uniform1f(glow.u_presence, current.presence)
    gl.uniform1f(glow.u_aspect, aspect)
    gl.uniform1f(glow.u_time, time)
    gl.uniform1f(glow.u_intro, intro)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.disableVertexAttribArray(quadAttribute)

    gl.blendFunc(gl.ONE, gl.ONE)
    gl.useProgram(dustProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer)
    gl.enableVertexAttribArray(seedAttribute)
    gl.vertexAttribPointer(seedAttribute, 4, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, flowBuffer)
    gl.enableVertexAttribArray(flowAttribute)
    gl.vertexAttribPointer(flowAttribute, 4, gl.FLOAT, false, 0, 0)
    gl.uniform1f(dust.u_time, time)
    gl.uniform1f(dust.u_aspect, aspect)
    gl.uniform1f(dust.u_dpr, dpr)
    gl.uniform1f(dust.u_intro, intro)
    gl.uniform1f(dust.u_presence, current.presence)
    gl.uniform2f(dust.u_pointer, current.x, current.y)
    gl.uniform2f(dust.u_center, CENTER_U, CENTER_V)
    gl.drawArrays(gl.POINTS, 0, count)

    // Only reveal the canvas once it has something on it, so the effect never
    // flashes an empty layer over the plate.
    if (!revealed) {
      revealed = true
      canvas.classList.add('is-ready')
    }
  })

  // The plate is pointer-events: none, so listen on the section that holds it.
  const host = plate.closest('section') ?? plate
  // Record only. Reading a rect here would be a forced layout on any frame
  // where something else has already written a style — and pointermove is
  // exactly the event where other things do. The frame maps it instead, at
  // most one rect per frame however fast the mouse is polled.
  const onMove = (event: PointerEvent) => {
    pending = {x: event.clientX, y: event.clientY}
  }
  const onLeave = () => {
    target.presence = 0
  }
  host.addEventListener('pointermove', onMove, {passive: true})
  host.addEventListener('pointerleave', onLeave, {passive: true})

  document.addEventListener(
    'astro:before-swap',
    () => {
      stop()
      resizeObserver.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
    {once: true},
  )
}
