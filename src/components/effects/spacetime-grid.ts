// The products bend spacetime.
//
// A lattice behind the Products section, where every product row is a mass:
// the grid pinches toward it and lights warm around it, the way the hero's
// black hole bends everything near it. Your cursor is a smaller mass moving
// through the same field.
//
// It is the hero's physics continued rather than the hero's dust repeated —
// and because it lives behind the content at a very low luminance, it can
// never touch the legibility of the artwork or the type above it.
//
// The masses are read from the DOM, so the field is registered to the actual
// rows. Add a fourth product and a fourth well appears with no code change.

import {createProgram, ratio, resize, uniforms, visibleLoop, wantsMotion} from './gl'

/** Product masses plus the cursor. Must match MASSES in the shader. */
const MAX_MASSES = 6
/** Target lattice cell in CSS pixels. */
const CELL = 46
const INTRO_MS = 2000
/**
 * This is the one effect on the site that covers the whole viewport, so it is
 * also the one paying the most for pixels. It is thin lines at three per cent
 * alpha sitting behind the content — there is no detail in it that a third
 * device pixel could carry, and the drawing buffer shrinks by 44% against the
 * 2x the artwork-registered effects need.
 */
const DPR_CAP = 1.5
/**
 * Idle cadence. At rest the whole field is a 0.42 rad/s breath; thirty frames
 * a second is more than enough to carry it, and it halves both the GPU work
 * and the main-thread work for the state the section spends most of its life
 * in. Full rate resumes the moment the pointer is in the section.
 */
const IDLE_FRAME_MS = 1000 / 30

const vertexSource = `
  attribute vec2 a_position; // lattice coordinate in 0..1 section space

  uniform vec3 u_mass[${MAX_MASSES}]; // x, y, strength (0 disables)
  uniform float u_aspect;
  uniform float u_intro;

  varying float v_alpha;
  varying float v_warm;

  void main() {
    vec2 p = a_position;
    vec2 shift = vec2(0.0);
    float well = 0.0;

    for (int i = 0; i < ${MAX_MASSES}; i++) {
      vec3 mass = u_mass[i];
      // Aspect-corrected into units of section height, so a well is round on
      // a page that is far taller than it is wide.
      vec2 d = (p - mass.xy) * vec2(u_aspect, 1.0);
      float r2 = dot(d, d);
      float pull = mass.z / (r2 * 70.0 + 1.0);
      // Toward the mass. inversesqrt beats normalize() here because r2 is
      // already in hand and the zero case needs guarding anyway.
      shift -= d * inversesqrt(max(r2, 1e-8)) * pull;
      well += pull;
    }

    p += vec2(shift.x / u_aspect, shift.y) * u_intro;

    gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);

    // Far from any product the lattice is barely there; near one it lifts.
    v_alpha = (0.030 + well * 1.15) * u_intro;
    v_warm = clamp(well * 3.4, 0.0, 1.0);
  }
`

const fragmentSource = `
  precision mediump float;
  varying float v_alpha;
  varying float v_warm;

  void main() {
    // Cool graphite at rest, the hero's amber where a product sits.
    vec3 color = mix(vec3(0.52, 0.56, 0.64), vec3(1.0, 0.72, 0.42), v_warm);
    float a = clamp(v_alpha, 0.0, 1.0);
    gl_FragColor = vec4(color * a, a);
  }
`

/** Lattice as GL_LINES pairs across 0..1, sized to keep cells roughly square. */
function lattice(width: number, height: number): Float32Array {
  const cols = Math.max(4, Math.min(64, Math.round(width / CELL)))
  const rows = Math.max(4, Math.min(140, Math.round(height / CELL)))
  const points: number[] = []

  for (let c = 0; c <= cols; c++) {
    const x = c / cols
    for (let r = 0; r < rows; r++) {
      points.push(x, r / rows, x, (r + 1) / rows)
    }
  }
  for (let r = 0; r <= rows; r++) {
    const y = r / rows
    for (let c = 0; c < cols; c++) {
      points.push(c / cols, y, (c + 1) / cols, y)
    }
  }
  return new Float32Array(points)
}

const claimed = new WeakSet<HTMLCanvasElement>()

export function mountSpacetimeGrid(canvas: HTMLCanvasElement): void {
  if (claimed.has(canvas) || !wantsMotion()) return
  claimed.add(canvas)

  const section = canvas.closest('section')
  if (!section) return

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
  })
  if (!gl) return

  const program = createProgram(gl, vertexSource, fragmentSource)
  if (!program) return

  canvas.dataset.mounted = 'true'

  const buffer = gl.createBuffer()
  let vertexCount = 0
  const position = gl.getAttribLocation(program, 'a_position')
  const u = uniforms(gl, program, ['u_aspect', 'u_intro'])
  // Array uniforms resolve per element in WebGL 1.
  const massLocations = Array.from({length: MAX_MASSES}, (_, i) =>
    gl.getUniformLocation(program, `u_mass[${i}]`),
  )

  // Each product's artwork is the mass. The canvas is sticky and one viewport
  // tall, so the rows scroll through it and their position in canvas space
  // changes every frame — but their position *within the section* does not.
  // That part is measured once per layout; the frame only needs to know where
  // the section and the canvas currently are, which is two rect reads however
  // many products there are.
  const art = [...section.querySelectorAll('.product-visual')].slice(0, MAX_MASSES - 1)
  const anchors = art.map(() => ({x: 0, y: 0}))
  const wells: Array<{x: number; y: number}> = art.map(() => ({x: 0.5, y: 0.5}))
  /** Canvas CSS box, so the frame never asks the DOM for it. */
  const box = {width: 0, height: 0}

  const measure = () => {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return false
    box.width = rect.width
    box.height = rect.height
    const origin = section.getBoundingClientRect()
    art.forEach((node, i) => {
      const cell = node.getBoundingClientRect()
      anchors[i].x = cell.left + cell.width / 2 - origin.left
      anchors[i].y = cell.top + cell.height / 2 - origin.top
    })
    return true
  }

  const locate = (rect: DOMRect, origin: DOMRect) => {
    for (let i = 0; i < anchors.length; i++) {
      wells[i].x = (origin.left + anchors[i].x - rect.left) / rect.width
      wells[i].y = (origin.top + anchors[i].y - rect.top) / rect.height
    }
  }

  // The lattice only depends on the canvas box, so it is rebuilt on resize.
  const build = () => {
    if (!measure()) return
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const points = lattice(box.width, box.height)
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW)
    vertexCount = points.length / 2
  }
  build()

  const pointer = {x: 0.5, y: 0.5, presence: 0}
  const target = {x: 0.5, y: 0.5, presence: 0}
  const start = performance.now()
  let revealed = false
  let drawn = 0
  // Raw client coordinates from the last pointermove, mapped inside the frame
  // — see the listener below.
  let pending: {x: number; y: number} | null = null

  const {stop, wake} = visibleLoop(section, now => {
    const intro = Math.min(1, (now - start) / INTRO_MS)
    // Half rate once the field has settled and nothing is being pointed at.
    const busy = intro < 1 || target.presence > 0 || pointer.presence > 0.01 || !!pending
    if (!busy && now - drawn < IDLE_FRAME_MS) return
    drawn = now

    const dpr = ratio(DPR_CAP)
    if (resize(canvas, dpr, box.width, box.height)) build()

    const rect = canvas.getBoundingClientRect()
    const origin = section.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    locate(rect, origin)

    if (pending) {
      target.x = (pending.x - rect.left) / rect.width
      target.y = (pending.y - rect.top) / rect.height
      target.presence = 1
      pending = null
    }

    pointer.x += (target.x - pointer.x) * 0.08
    pointer.y += (target.y - pointer.y) * 0.08
    pointer.presence += (target.presence - pointer.presence) * 0.05

    const time = (now - start) / 1000

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)

    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < MAX_MASSES; i++) {
      const location = massLocations[i]
      if (!location) continue
      if (i < wells.length) {
        // Each well breathes on its own phase, so the field is alive while
        // the page is still without anything visibly moving.
        const breath = 0.86 + 0.14 * Math.sin(time * 0.42 + i * 2.1)
        gl.uniform3f(location, wells[i].x, wells[i].y, 0.02 * breath)
      } else if (i === MAX_MASSES - 1) {
        gl.uniform3f(location, pointer.x, pointer.y, 0.012 * pointer.presence)
      } else {
        gl.uniform3f(location, 0, 0, 0)
      }
    }

    gl.uniform1f(u.u_aspect, box.width / Math.max(1, box.height))
    gl.uniform1f(u.u_intro, intro)
    gl.drawArrays(gl.LINES, 0, vertexCount)

    // Once, not per frame: a class write here would invalidate layout and turn
    // the next frame's rect reads into a forced reflow, every frame.
    if (!revealed) {
      revealed = true
      canvas.classList.add('is-ready')
    }
  })

  // Record only. Reading a rect in here would be a forced layout on any frame
  // where something else has already written a style, and pointermove is the
  // event where other things do. The frame reads its rect once and maps this.
  const onMove = (event: PointerEvent) => {
    pending = {x: event.clientX, y: event.clientY}
    wake()
  }
  const onLeave = () => {
    target.presence = 0
  }

  section.addEventListener('pointermove', onMove, {passive: true})
  section.addEventListener('pointerleave', onLeave, {passive: true})
  const resizeObserver = new ResizeObserver(() => {
    build()
    wake()
  })
  resizeObserver.observe(section)
  // The canvas is 100vh, so a viewport that gets shorter without getting
  // narrower — a phone's URL bar collapsing — never touches the section's box.
  // Now that the frame trusts the cached size, that has to be caught here.
  resizeObserver.observe(canvas)

  document.addEventListener(
    'astro:before-swap',
    () => {
      stop()
      resizeObserver.disconnect()
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
    {once: true},
  )
}
