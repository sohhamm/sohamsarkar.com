// Reduce an image to a coarse luminance grid the WebGL hero reads at runtime.
//
// The hero's accretion particles need to know where the disk actually is —
// they're seeded on the art's own bright cells and advected along its flow,
// so the motion is registered to the picture instead of guessing at it.
//
// Usage: bun scripts/luma-grid.mjs <image> [--cols 128] [--gamma 1.0]
// Writes <image-basename>.json next to the source: {cols, rows, cells}.
//
// Keep --cols low. This ships to the browser, and the consumers (gradient
// sampling, weighted spawn) all want a smooth field, not detail.
import {readFile, writeFile} from 'node:fs/promises'
import {basename, dirname, extname, join} from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const input = args.find(a => !a.startsWith('--'))
if (!input) {
  console.error('usage: bun scripts/luma-grid.mjs <image> [--cols 128] [--gamma 1.0]')
  process.exit(1)
}

const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : args[i + 1]
}

const cols = Number(flag('cols', 128))
const gamma = Number(flag('gamma', 1))

const src = sharp(await readFile(input))
const meta = await src.metadata()
// Square cells — unlike an ASCII grid there is no character aspect to correct.
const rows = Math.max(1, Math.round((meta.height / meta.width) * cols))

const data = await src.resize(cols, rows, {fit: 'fill'}).grayscale().raw().toBuffer()

let peak = 0
const raw = new Float64Array(cols * rows)
for (let i = 0; i < raw.length; i++) {
  const value = Math.pow(data[i] / 255, gamma)
  raw[i] = value
  if (value > peak) peak = value
}

// Normalise to the plate's own peak so downstream thresholds are exposure
// independent, and round hard — two decimals is well past what a smooth
// field needs, and it roughly halves the payload.
const cells = Array.from(raw, value => Number((value / (peak || 1)).toFixed(2)))

const base = join(dirname(input), basename(input, extname(input)))
const json = JSON.stringify({cols, rows, cells})
await writeFile(`${base}.json`, json)
console.log(
  `${basename(base)}: ${cols}x${rows} grid -> ${base}.json (${(json.length / 1024).toFixed(1)} KB)`,
)
