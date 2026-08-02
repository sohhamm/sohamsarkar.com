// Minimum viable WebGL. Both effects on this site are a couple of shaders and
// one static buffer each, so there is no framework here on purpose — three.js
// would be ~150 KB to draw some points.

export type Uniforms = Record<string, WebGLUniformLocation | null>

function shader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const item = gl.createShader(type)
  if (!item) return null
  gl.shaderSource(item, source)
  gl.compileShader(item)
  if (gl.getShaderParameter(item, gl.COMPILE_STATUS)) return item
  // Never throw: a shader that won't compile just means the static page stands.
  console.warn('WebGL effect disabled:', gl.getShaderInfoLog(item))
  gl.deleteShader(item)
  return null
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertex = shader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = shader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertex || !fragment) return null
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program
  console.warn('WebGL effect disabled:', gl.getProgramInfoLog(program))
  return null
}

// Uniform lookups are string-keyed map hits in the driver — resolve once at
// mount instead of ~15 times per frame.
export function uniforms(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  names: readonly string[],
): Uniforms {
  const map: Uniforms = {}
  for (const name of names) map[name] = gl.getUniformLocation(program, name)
  return map
}

/**
 * Device pixel ratio, capped — past 2 the cost is real and nobody can see it.
 *
 * Fill rate goes with the square of this, so an effect that covers a lot of
 * screen and draws something soft can afford a lower cap than one sitting on
 * artwork the viewer is looking straight at.
 */
export function ratio(cap = 2): number {
  return Math.min(window.devicePixelRatio || 1, cap)
}

/**
 * Resizes the drawing buffer to the element's CSS box. Returns true on change.
 *
 * Pass the box when the caller already knows it. This runs every frame, and
 * `clientWidth` is a layout read — harmless while layout is clean, but a
 * forced reflow the moment anything on the page has written a style since the
 * last frame. Callers that measure on resize anyway should hand the size in
 * rather than ask the DOM for it sixty times a second.
 */
export function resize(
  canvas: HTMLCanvasElement,
  dpr: number,
  cssWidth = canvas.clientWidth,
  cssHeight = canvas.clientHeight,
): boolean {
  const width = Math.max(1, Math.round(cssWidth * dpr))
  const height = Math.max(1, Math.round(cssHeight * dpr))
  if (canvas.width === width && canvas.height === height) return false
  canvas.width = width
  canvas.height = height
  return true
}

/**
 * A rAF loop that only runs when it can be seen: stopped while the host is off
 * screen and while the tab is hidden.
 *
 * A frame may also return `false` to park the loop — for effects that settle
 * into a still image and only need to run again on input. Call `wake()` to
 * restart one. `stop()` is the teardown for <ClientRouter /> swaps.
 */
export function visibleLoop(
  host: Element,
  frame: (now: number) => boolean | void,
): {stop: () => void; wake: () => void} {
  let raf = 0
  let onScreen = false
  let parked = false

  const tick = (now: number) => {
    raf = 0
    parked = frame(now) === false
    if (!parked && onScreen && !document.hidden) raf = requestAnimationFrame(tick)
  }
  const wake = () => {
    parked = false
    if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(tick)
  }

  const observer = new IntersectionObserver(entries => {
    onScreen = entries.some(entry => entry.isIntersecting)
    if (!parked) wake()
  })
  observer.observe(host)
  document.addEventListener('visibilitychange', wake)

  return {
    stop: () => {
      if (raf) cancelAnimationFrame(raf)
      observer.disconnect()
      document.removeEventListener('visibilitychange', wake)
    },
    wake,
  }
}

export const wantsMotion = (): boolean =>
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
