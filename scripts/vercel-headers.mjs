// Patches .vercel/output/config.json after `astro build`.
//
// The Vercel adapter only marks /_astro/* (content-hashed) as immutable.
// /fonts/* ships with no cache header from the origin, so every CDN in
// front revalidates 150 KB of woff2 against Vercel on a cold edge — the
// slowest requests in the Lighthouse waterfall. The font files are
// versionless but effectively frozen (a new cut would ship under a new
// filename via scripts/subset-fonts.mjs), so a year + immutable is safe.
import {readFileSync, writeFileSync} from 'node:fs'

const CONFIG = new URL('../.vercel/output/config.json', import.meta.url)

const config = JSON.parse(readFileSync(CONFIG, 'utf8'))

const IMMUTABLE = {'cache-control': 'public, max-age=31536000, immutable'}

const already = config.routes.some(r => r.src === '^/fonts/(.*)$')
if (!already) {
  // Same phase and shape as the adapter's own /_astro/* header route.
  const astroRoute = config.routes.findIndex(r => r.src === '^/_astro/(.*)$')
  const fontsRoute = {src: '^/fonts/(.*)$', headers: IMMUTABLE, continue: true}
  config.routes.splice(astroRoute === -1 ? config.routes.length - 1 : astroRoute + 1, 0, fontsRoute)
  writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n')
  console.log('vercel-headers: added immutable cache-control for /fonts/*')
} else {
  console.log('vercel-headers: /fonts/* route already present')
}
