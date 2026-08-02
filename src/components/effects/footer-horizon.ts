// The sign-off, given the same gravity as the hero.
//
// The wordmark at the foot of every page was a static plate. It still is: the
// <img> underneath is the entire experience without JS, without WebGL, or with
// reduced motion asked for, and it is never redrawn or replaced. This lays a
// canvas over it, registered to the image's own fitted box, and adds three
// things the plate cannot do:
//
//   1. a soft mass that follows the pointer and bends the letterforms as it
//      passes — with the chromatic fringe you get for free when a pure-white
//      glyph is sampled three times at three deflections,
//   2. a shed along the glyphs' lower contour: the name frays into embers that
//      fall past the bottom of the page, and
//   3. an arrival — the fray closes and one light crosses the name the first
//      time the wordmark actually reaches the floor of the viewport.
//
// Ink extent and ember spawn are both measured off the artwork at mount, so
// swapping the plate for a different wordmark needs no change in here.

import {createProgram, ratio, resize, uniforms, visibleLoop, wantsMotion} from './gl'

const SWEEP_MS = 1500
const INTRO_MS = 1400
/** Width the alpha field is read back at. Only ember spawn reads it. */
const SAMPLE_COLS = 768
/** Below this the pixel is background, not ink. */
const INK_FLOOR = 0.12

const wordVertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// The plate is uploaded with FLIP_Y, so v_uv is the artwork upright: v 0 is the
// bottom of the band and v 1 the top. Everything below works in CSS pixels
// (u_size) rather than uv — the band is ~14:1, and an aspect-corrected uv would
// make every radius in here unreadable.
const wordFragmentSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  varying vec2 v_uv;

  uniform sampler2D u_word;
  uniform vec2 u_size;    // canvas box, CSS px
  uniform vec2 u_lens;    // pointer, in v_uv
  uniform float u_grip;   // 0 at rest .. 1 with the pointer present
  uniform float u_core;   // lens core radius, px
  uniform float u_mass;   // peak deflection, px
  uniform float u_time;
  uniform float u_settle; // 0 approaching .. 1 arrived at the floor
  uniform float u_sweep;  // < 0 idle, else 0..1 position of the arrival light
  uniform float u_intro;
  uniform float u_inkHigh;
  uniform float u_inkLow;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Coverage at a deflection scaled by k, and nothing outside the plate —
  // CLAMP_TO_EDGE would otherwise smear the first and last letter sideways.
  float cover(vec2 px, vec2 dir, float defl, float k) {
    vec2 s = (px + dir * defl * k) / u_size;
    vec2 inside = step(vec2(0.0), s) * step(s, vec2(1.0));
    return texture2D(u_word, s).a * inside.x * inside.y;
  }

  void main() {
    vec2 px = v_uv * u_size;
    float base = texture2D(u_word, v_uv).a;

    // At rest every term below is either zero or a multiple of the plate's own
    // coverage, so a pixel the artwork does not touch cannot produce anything.
    // The wordmark is thin letterforms across a very wide band — most of this
    // canvas is that pixel, on most frames.
    bool lensed = u_grip > 0.002;
    if (!lensed && base < 0.002) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float a;
    vec3 weight;
    float heat = 0.0;
    float ring = 0.0;

    if (lensed) {
      vec2 d = px - u_lens * u_size;
      float r = max(length(d), 0.001);
      vec2 dir = d / r;

      // Softened point mass: linear near the core, 1/r beyond it, peaking at
      // exactly u_mass when r == u_core. A true 1/r would blow up at the
      // centre. Gated on the pointer, so the name is never bent at rest.
      float defl = 2.0 * u_core * u_mass * u_grip * r / (r * r + u_core * u_core);

      // Sampling *further out* than the pixel sits pulls the artwork inward,
      // which is the void-and-ring a mass makes — not a magnifier's bulge.
      // The plate is pure white, so three taps at three strengths IS
      // dispersion: the fringe is the artwork's own edges separating, not a
      // tint added over. Kept low deliberately: the separation rides on defl,
      // which is already ~16 px at the core, and much past this the fringe
      // stops reading as dispersion and starts reading as a mis-registered
      // RGB channel.
      float split = 0.038 * u_grip;
      vec3 cov = vec3(
        cover(px, dir, defl, 1.0 + split),
        cover(px, dir, defl, 1.0),
        cover(px, dir, defl, 1.0 - split)
      );
      a = max(max(cov.r, cov.g), cov.b);
      weight = cov / max(a, 1e-4);

      // Beaming: what the mass bends, it also burns.
      heat = exp(-r * r / (u_core * u_core * 2.4)) * u_grip;

      // Photon ring at the deflection's peak, weighted almost entirely by the
      // plate's own ink — where the ring misses a letter that costs brightness
      // instead of drawing a visible arc across the black.
      ring = exp(-pow((r - u_core) / (u_core * 0.28), 2.0)) * u_grip;
    } else {
      // No pointer, so no deflection: all three chromatic taps land on the
      // same texel the base sample already read, and both the beaming and the
      // ring are identically zero. One tap is the entire answer.
      a = base;
      weight = vec3(1.0);
    }

    // The shed. Depth is measured against the glyphs' real extent, not the
    // canvas, because the plate carries empty rows under the baseline.
    float band = clamp((u_inkHigh - v_uv.y) / max(1e-4, u_inkHigh - u_inkLow), 0.0, 1.0);
    float bite = smoothstep(1.0 - mix(0.20, 0.07, u_settle), 1.0, band);
    // Two octaves of value noise is eight sines, and bite is the only thing
    // that ever reads it — zero outside the bottom fifth of the ink, and
    // outside the bottom fourteenth once the name has settled.
    // (No backticks in here: this whole shader is a template literal.)
    if (bite > 0.0) {
      float grain =
        noise(vec2(v_uv.x * 120.0 + u_time * 0.20, v_uv.y * 30.0)) * 0.7 +
        noise(vec2(v_uv.x * 260.0 - u_time * 0.11, v_uv.y * 62.0)) * 0.3;
      a *= 1.0 - bite * smoothstep(0.28, 0.80, grain) * mix(0.80, 0.34, u_settle) * u_intro;
    }

    // Arrival: one light crosses the name, once.
    float sweep = u_sweep < 0.0 ? 0.0 : exp(-pow((v_uv.x - u_sweep) * 4.5, 2.0)) * u_intro;

    a = min(1.0, a * (1.0 + heat * 0.85 + sweep * 1.30) + ring * (base * 0.42 + 0.05));

    // Neutral until gravity touches it, amber when it does — the hero's palette
    // arriving on the name rather than being painted onto it.
    vec3 tint = mix(vec3(1.0, 0.98, 0.96), vec3(1.0, 0.90, 0.79), clamp(heat + sweep, 0.0, 1.0));
    gl_FragColor = vec4(tint * weight * a, a);
  }
`

const emberVertexSource = `
  attribute vec4 a_seed;  // u, v (both in v_uv), phase, cycles per second
  attribute vec2 a_trait; // brightness, size

  uniform vec2 u_size;
  uniform vec2 u_lens;
  uniform float u_time;
  uniform float u_dpr;
  uniform float u_intro;
  uniform float u_settle;
  uniform float u_grip;
  uniform float u_core;

  varying float v_alpha;
  varying float v_heat;

  void main() {
    float life = fract(u_time * a_seed.w + a_seed.z);
    vec2 px = a_seed.xy * u_size;

    // Falling, and accelerating as it goes — constant speed reads as a scroll,
    // acceleration reads as weight. Less of it once the name has settled.
    px.y -= life * life * mix(30.0, 12.0, u_settle);
    px.x += sin(a_seed.z * 6.2831853 + u_time * 0.5) * life * 7.0;

    // The same mass that bends the letters bends what falls off them.
    vec2 d = px - u_lens * u_size;
    float r = max(length(d), 0.001);
    float grip = exp(-r * r / (u_core * u_core * 2.6)) * u_grip;
    px -= (d / r) * grip * u_core * 0.42;

    vec2 uv = px / u_size;
    gl_Position = vec4(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0, 0.0, 1.0);

    float fade = sin(life * 3.14159265);
    v_alpha = fade * fade * a_trait.x * u_intro * mix(0.34, 0.16, u_settle) * (1.0 + grip * 2.2);
    v_heat = grip;
    gl_PointSize = (a_trait.y + grip * 2.0) * u_dpr;
  }
`

const emberFragmentSource = `
  precision mediump float;
  varying float v_alpha;
  varying float v_heat;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = core * core * v_alpha;
    vec3 color = mix(vec3(1.0, 0.88, 0.74), vec3(1.0, 0.97, 0.92), clamp(v_heat, 0.0, 1.0));
    gl_FragColor = vec4(color * a, a);
  }
`

type Ink = {
  seeds: Float32Array
  traits: Float32Array
  /** Glyph extent in v_uv: high is the top of the ascenders, low the baseline. */
  high: number
  low: number
}

/**
 * Reads the plate's alpha once and turns it into ember spawn points plus the
 * glyphs' real vertical extent.
 *
 * Spawn is weighted toward cells that have ink with nothing under them — the
 * lower contour of the letterforms — because that is the edge that sheds. A
 * flat alpha weighting would scatter embers evenly through the strokes, which
 * reads as a texture over the name rather than as something coming off it.
 * That test fires on every downward-facing edge, counters and arches included,
 * so the whole wordmark sheds rather than only its baseline.
 *
 * Note for anyone checking the extent it returns: today's plate is drawn with
 * a vertical alpha ramp of its own (~0.68 at the ascenders down to ~0.33 at
 * the foot) and its glyphs fill the file, so `high`/`low` come back as 1 and 0
 * and the normalisation below is an identity. That is a property of this
 * artwork, not a broken measurement — a plate with real padding will measure
 * it, which is the whole reason this is read rather than hard-coded.
 */
function readInk(image: HTMLImageElement, count: number): Ink | null {
  const cols = Math.min(SAMPLE_COLS, image.naturalWidth)
  const rows = Math.max(1, Math.round((image.naturalHeight / image.naturalWidth) * cols))

  const scratch = document.createElement('canvas')
  scratch.width = cols
  scratch.height = rows
  const context = scratch.getContext('2d')
  if (!context) return null
  context.drawImage(image, 0, 0, cols, rows)

  let pixels: Uint8ClampedArray
  try {
    pixels = context.getImageData(0, 0, cols, rows).data
  } catch {
    return null
  }

  const alpha = (x: number, y: number) =>
    x < 0 || y < 0 || x >= cols || y >= rows ? 0 : pixels[(y * cols + x) * 4 + 3] / 255

  let first = -1
  let last = -1
  const index: number[] = []
  const cumulative: number[] = []
  let total = 0

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const a = alpha(x, y)
      if (a < INK_FLOOR) continue
      if (first < 0) first = y
      last = y
      // Ink with air two rows below it is a bottom edge.
      const weight = a * (0.1 + 0.9 * Math.max(0, a - alpha(x, y + 2)))
      total += weight
      index.push(y * cols + x)
      cumulative.push(total)
    }
  }
  if (!index.length || total <= 0) return null

  const seeds = new Float32Array(count * 4)
  const traits = new Float32Array(count * 2)

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
    const a = alpha(cx, cy)

    // Jitter inside the cell so the sampling grid never shows as a lattice.
    seeds[n * 4] = (cx + Math.random()) / cols
    seeds[n * 4 + 1] = 1 - (cy + Math.random()) / rows
    seeds[n * 4 + 2] = Math.random() // phase, so nothing pulses in unison
    seeds[n * 4 + 3] = 0.16 + Math.random() * 0.26 // 2.4–6 s per life
    traits[n * 2] = 0.35 + a * 0.65
    traits[n * 2 + 1] = 0.9 + Math.random() * 1.5
  }

  return {seeds, traits, high: 1 - first / rows, low: 1 - (last + 1) / rows}
}

/**
 * Uploads the plate. WebGL 1 has no mipmaps for non-power-of-two textures, so
 * this is LINEAR + CLAMP_TO_EDGE — fine here, because the quad is drawn at the
 * artwork's own size and the deflection is smooth enough not to change the
 * sampling rate. Only the max-size guard is real work.
 */
function plateTexture(gl: WebGLRenderingContext, image: HTMLImageElement): WebGLTexture | null {
  const texture = gl.createTexture()
  if (!texture) return null

  const limit = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
  let source: TexImageSource = image
  if (image.naturalWidth > limit || image.naturalHeight > limit) {
    const scale = limit / Math.max(image.naturalWidth, image.naturalHeight)
    const down = document.createElement('canvas')
    down.width = Math.max(1, Math.floor(image.naturalWidth * scale))
    down.height = Math.max(1, Math.floor(image.naturalHeight * scale))
    down.getContext('2d')?.drawImage(image, 0, 0, down.width, down.height)
    source = down
  }

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
  return texture
}

// Claimed synchronously: the host's data-mounted flag is only set after the
// image decodes, and astro:page-load fires on the initial load as well as on
// navigations, so mount can be called twice for one host.
const claimed = new WeakSet<HTMLElement>()

export async function mountFooterHorizon(host: HTMLElement): Promise<void> {
  if (claimed.has(host)) return
  claimed.add(host)

  const image = host.querySelector('img')
  const canvas = host.querySelector('canvas')
  if (!image || !canvas || !wantsMotion()) return

  try {
    await image.decode()
  } catch {
    return // the plate stands on its own
  }
  if (!image.naturalWidth) return

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  })
  if (!gl) return

  const wordProgram = createProgram(gl, wordVertexSource, wordFragmentSource)
  const emberProgram = createProgram(gl, emberVertexSource, emberFragmentSource)
  const plate = plateTexture(gl, image)
  if (!wordProgram || !emberProgram || !plate) return

  const narrow = window.matchMedia('(max-width: 768px)').matches
  const count = narrow ? 700 : 1800
  const ink = readInk(image, count)
  if (!ink) return

  host.dataset.mounted = 'true'

  const quadBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const seedBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, ink.seeds, gl.STATIC_DRAW)
  const traitBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, traitBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, ink.traits, gl.STATIC_DRAW)

  const word = uniforms(gl, wordProgram, [
    'u_word',
    'u_size',
    'u_lens',
    'u_grip',
    'u_core',
    'u_mass',
    'u_time',
    'u_settle',
    'u_sweep',
    'u_intro',
    'u_inkHigh',
    'u_inkLow',
  ])
  const ember = uniforms(gl, emberProgram, [
    'u_size',
    'u_lens',
    'u_time',
    'u_dpr',
    'u_intro',
    'u_settle',
    'u_grip',
    'u_core',
  ])
  const quadAttribute = gl.getAttribLocation(wordProgram, 'a_position')
  const seedAttribute = gl.getAttribLocation(emberProgram, 'a_seed')
  const traitAttribute = gl.getAttribLocation(emberProgram, 'a_trait')

  // The plate is `object-fit: contain` inside a fixed-height band, so its
  // rendered box is smaller than its element box. Reproduce that fit rather
  // than mirroring the CSS — the canvas then lands on the artwork exactly and
  // a change to the band's height needs no change in here.
  //
  // The fitted box is kept, so the frame never has to ask the DOM how big the
  // canvas is in order to size its drawing buffer.
  const box = {width: 0, height: 0}
  const fit = () => {
    const outer = host.getBoundingClientRect()
    const scale = Math.min(outer.width / image.naturalWidth, outer.height / image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    canvas.style.left = `${(outer.width - width) / 2}px`
    canvas.style.top = `${outer.height - height}px`
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    box.width = width
    box.height = height
  }

  const target = {x: 0.5, y: 0.5, grip: 0}
  const current = {...target}
  const start = performance.now()
  let bounds = canvas.getBoundingClientRect()
  let settleTarget = 0
  let settle = 0
  let sweepStart = -1
  let armed = true
  let revealed = false

  // Measured at the top of the frame, and only while the frame is running.
  // This used to hang off a scroll listener, which meant a layout read on
  // every scroll event of every page on the site — including the whole time
  // the footer was nowhere near the viewport and the loop was stopped. It is
  // one rect, and the only moment its value matters is a moment this effect
  // is already drawing.
  //
  // Settle runs over the band's own arrival: 0 while it is still entirely
  // under the fold, 1 once all of it has cleared. Scaling to the band rather
  // than to some constant number of pixels is what keeps the whole range
  // reachable — the page ends at this element, so anything larger than the
  // band's height would spend most of its travel off screen and the name
  // would never be seen anywhere near its unsettled state.
  const measure = () => {
    bounds = canvas.getBoundingClientRect()
    const cleared = (window.innerHeight - bounds.top) / Math.max(1, bounds.height)
    settleTarget = Math.min(1, Math.max(0, cleared))
  }
  const remeasure = () => {
    fit()
    measure()
  }

  const onMove = (event: PointerEvent) => {
    if (!bounds.width || !bounds.height) return
    target.x = (event.clientX - bounds.left) / bounds.width
    // v_uv is the artwork upright, so screen-down is v-down.
    target.y = 1 - (event.clientY - bounds.top) / bounds.height
    target.grip = 1
  }
  const onLeave = () => {
    target.grip = 0
  }

  remeasure()
  const resizeObserver = new ResizeObserver(remeasure)
  resizeObserver.observe(host)
  window.addEventListener('resize', remeasure, {passive: true})
  window.addEventListener('pointermove', onMove, {passive: true})
  document.addEventListener('pointerleave', onLeave, {passive: true})

  const {stop} = visibleLoop(host, now => {
    const dpr = ratio()
    resize(canvas, dpr, box.width, box.height)
    measure()

    current.x += (target.x - current.x) * 0.1
    current.y += (target.y - current.y) * 0.1
    current.grip += (target.grip - current.grip) * 0.07
    settle += (settleTarget - settle) * 0.08

    const time = (now - start) / 1000
    const intro = Math.min(1, (now - start) / INTRO_MS)

    // The arrival fires once per approach, and re-arms only after you have
    // left properly — so it stays an event, not a twitch at the scroll's end.
    if (armed && settleTarget > 0.995) {
      sweepStart = now
      armed = false
    } else if (settleTarget < 0.5) {
      armed = true
    }
    let sweep = -1
    if (sweepStart >= 0) {
      const progress = (now - sweepStart) / SWEEP_MS
      if (progress >= 1) sweepStart = -1
      // Enters from just off the left edge and leaves past the right.
      else sweep = progress * 1.3 - 0.15
    }

    const width = box.width
    const height = box.height
    const core = height * 0.5
    const grip = current.grip * intro

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    // Premultiplied source-over for the plate, then straight additive for the
    // embers so overlapping motes accumulate into brighter cores.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    gl.useProgram(wordProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer)
    gl.enableVertexAttribArray(quadAttribute)
    gl.vertexAttribPointer(quadAttribute, 2, gl.FLOAT, false, 0, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, plate)
    gl.uniform1i(word.u_word, 0)
    gl.uniform2f(word.u_size, width, height)
    gl.uniform2f(word.u_lens, current.x, current.y)
    gl.uniform1f(word.u_grip, grip)
    gl.uniform1f(word.u_core, core)
    gl.uniform1f(word.u_mass, height * 0.16)
    gl.uniform1f(word.u_time, time)
    gl.uniform1f(word.u_settle, settle)
    gl.uniform1f(word.u_sweep, sweep)
    gl.uniform1f(word.u_intro, intro)
    gl.uniform1f(word.u_inkHigh, ink.high)
    gl.uniform1f(word.u_inkLow, ink.low)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.disableVertexAttribArray(quadAttribute)

    gl.blendFunc(gl.ONE, gl.ONE)
    gl.useProgram(emberProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer)
    gl.enableVertexAttribArray(seedAttribute)
    gl.vertexAttribPointer(seedAttribute, 4, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, traitBuffer)
    gl.enableVertexAttribArray(traitAttribute)
    gl.vertexAttribPointer(traitAttribute, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(ember.u_size, width, height)
    gl.uniform2f(ember.u_lens, current.x, current.y)
    gl.uniform1f(ember.u_time, time)
    gl.uniform1f(ember.u_dpr, dpr)
    gl.uniform1f(ember.u_intro, intro)
    gl.uniform1f(ember.u_settle, settle)
    gl.uniform1f(ember.u_grip, grip)
    gl.uniform1f(ember.u_core, core)
    gl.drawArrays(gl.POINTS, 0, count)

    // The swap is deliberately not a crossfade. At u_intro 0 this canvas is
    // the plate pixel for pixel, so hiding the <img> in the same frame is
    // invisible — where dissolving two copies of one artwork would dip the
    // whole wordmark's brightness on the way through.
    if (!revealed) {
      revealed = true
      host.classList.add('is-ready')
    }
  })

  // The host carries transition:persist, so it survives a view transition and
  // keeps running across navigations. Only a real unload tears it down.
  window.addEventListener(
    'pagehide',
    () => {
      stop()
      resizeObserver.disconnect()
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    },
    {once: true},
  )
}
