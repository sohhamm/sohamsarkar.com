// Cuts the shipped Victor Mono files down to the characters this site can
// actually render.
//
//   bun scripts/subset-fonts.mjs
//
// Sources live in fonts/ (the untouched upstream files, never served) and the
// subsets are written to public/fonts/, which is what @font-face points at.
//
// The full family is ~1,270 codepoints — Greek, Cyrillic, IPA, box drawing,
// hundreds of arrows and math symbols — and none of it is reachable from this
// site. Five faces at ~78 KB each is ~390 KB of font on a page whose Regular
// face is `font-display: block`, so it gates first paint of every word.
//
// The kept set is deliberately wider than the ~93 codepoints the built pages
// use today, because the alternative is a font that silently loses a glyph the
// first time a project description gains an accent or a currency symbol:
//
//   Latin-1            everything a Western European name or word needs
//   U+2000–206F        the punctuation the copy is written with — the em dash
//                      in "01 —— PERSONAL FINANCE", the middot between product
//                      highlights, curly quotes, the ellipsis
//   U+20A0–20BF        every currency sign (₹ is already on the page)
//   arrows, minus      ← ↑ → ↓ − ∕, used in links and captions
//   U+FFFD             so a decoding accident renders a box, not nothing
//
// Ligatures and kerning survive: subset-font keeps the layout tables for the
// glyphs it retains, which is what preserves Victor Mono's cursive italic.

import {readFile, writeFile, readdir, mkdir} from 'node:fs/promises'
import {join} from 'node:path'
import subsetFont from 'subset-font'

const SOURCE = 'fonts'
const OUTPUT = 'public/fonts'

const range = (start, end) =>
  Array.from({length: end - start + 1}, (_, i) => String.fromCodePoint(start + i)).join('')

const KEEP = [
  range(0x0020, 0x00ff), // Latin-1
  'ıŒœƒˆ˚˜ʻʼ', // stragglers common in Latin text
  range(0x2000, 0x206f), // general punctuation
  range(0x20a0, 0x20bf), // currency
  '←↑→↓−∕⁴™©®°',
  '�',
].join('')

const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`

await mkdir(OUTPUT, {recursive: true})

const faces = (await readdir(SOURCE)).filter(name => name.endsWith('.woff2')).sort()
if (!faces.length) throw new Error(`No .woff2 files in ${SOURCE}/`)

let before = 0
let after = 0

for (const face of faces) {
  const original = await readFile(join(SOURCE, face))
  const subset = await subsetFont(original, KEEP, {targetFormat: 'woff2'})
  await writeFile(join(OUTPUT, face), subset)
  before += original.length
  after += subset.length
  console.log(
    `${face.padEnd(30)} ${kb(original.length).padStart(9)} -> ${kb(subset.length).padStart(9)}`,
  )
}

console.log(`\n${faces.length} faces: ${kb(before)} -> ${kb(after)} (${kb(before - after)} saved)`)
