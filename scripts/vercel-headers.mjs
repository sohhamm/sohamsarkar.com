// Patches .vercel/output/config.json after `astro build`.
//
// Two things the Vercel adapter does not emit:
//
// 1. /fonts/* cache headers. The adapter only marks /_astro/* (content-hashed)
//    as immutable. /fonts/* ships with no cache header from the origin, so every
//    CDN in front revalidates 150 KB of woff2 against Vercel on a cold edge —
//    the slowest requests in the Lighthouse waterfall. The font files are
//    versionless but effectively frozen (a new cut would ship under a new
//    filename via scripts/subset-fonts.mjs), so a year + immutable is safe.
//
// 2. A www -> apex redirect. www.sohamsarkar.com is attached to the same Vercel
//    project and was answering 200 with the full site, so every page existed at
//    two hostnames; Google had crawled https://www.sohamsarkar.com/ and filed it
//    under "Alternate page with proper canonical tag". The rel=canonical was
//    saving us, but a canonical is a hint and it still burns crawl budget on a
//    mirror. Only .vercel/output/config.json can express this — vercel.json's
//    `redirects` are inert on a Build Output API v3 deploy, and _redirects/
//    Astro `redirects` cannot match on host at all.
import {readFileSync, writeFileSync} from 'node:fs'

const CONFIG = new URL('../.vercel/output/config.json', import.meta.url)

const config = JSON.parse(readFileSync(CONFIG, 'utf8'))
const changes = []

const IMMUTABLE = {'cache-control': 'public, max-age=31536000, immutable'}

if (!config.routes.some(r => r.src === '^/fonts/(.*)$')) {
  // Same phase and shape as the adapter's own /_astro/* header route.
  const astroRoute = config.routes.findIndex(r => r.src === '^/_astro/(.*)$')
  const fontsRoute = {src: '^/fonts/(.*)$', headers: IMMUTABLE, continue: true}
  config.routes.splice(astroRoute === -1 ? config.routes.length - 1 : astroRoute + 1, 0, fontsRoute)
  changes.push('immutable cache-control for /fonts/*')
}

const WWW_HOST = 'www.sohamsarkar.com'

if (!config.routes.some(r => r.has?.some(h => h.type === 'host' && h.value === WWW_HOST))) {
  // Must run before `handle: filesystem`, otherwise the www request is served
  // rather than redirected. 308 (not 302) so Google consolidates the two hosts
  // permanently, and the path + query are carried across so deep links survive.
  //
  // It goes *after* the adapter's /.well-known passthrough, which exists so ACME
  // challenges are never rewritten; bouncing those to the apex would break cert
  // renewal on the www domain.
  const wellKnown = config.routes.findIndex(r => r.src?.includes('.well-known'))
  config.routes.splice(wellKnown + 1, 0, {
    src: '/(.*)',
    has: [{type: 'host', value: WWW_HOST}],
    headers: {Location: 'https://sohamsarkar.com/$1'},
    status: 308,
  })
  changes.push(`308 ${WWW_HOST} -> apex`)
}

if (changes.length) {
  writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n')
  console.log(`vercel-headers: added ${changes.join(', ')}`)
} else {
  console.log('vercel-headers: routes already present')
}
