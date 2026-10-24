import {fileURLToPath} from 'node:url'
import {statSync} from 'node:fs'
import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import {defineConfig} from 'astro/config'

const PAGES_DIR = fileURLToPath(new URL('./src/pages', import.meta.url))

const urlToPageFile = url => {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '') || 'index'
  for (const ext of ['.astro', '/index.astro']) {
    try {
      const file = `${PAGES_DIR}/${path}${ext}`
      return statSync(file).mtime
    } catch {}
  }
  return null
}

// Pages that exist but are not for the public. This list only keeps them out of
// the sitemap — the `noindex: true` in each page's `content` is what actually
// keeps them out of the index, and both are required. Search Console was filing
// /music, /resume and /referrals as "Discovered - currently not indexed" because
// they were submitted here while nothing on the site linked to them, and /resume
// and /referrals had been indexed outright.
//
// Deliberately NOT mirrored into robots.txt: a Disallow stops Googlebot from
// fetching the page, which means it never sees the noindex, and an already-
// indexed URL then stays in the index as a bare link. Crawlable + noindex is the
// only combination that removes a page that is already in there.
const NOINDEXED = [
  '/invest',
  '/payments',
  '/pochita-technologies',
  '/twitter',
  '/x',
  '/github',
  '/linkedin',
  '/peerlist',
  '/music',
  '/resume',
  '/referrals',
]

// https://astro.build/config
export default defineConfig({
  site: 'https://sohamsarkar.com',
  output: 'static',
  adapter: vercel(),
  // Every page has exactly one URL, and it ends in a slash.
  //
  // Astro's default ('ignore') let Vercel answer both /about and /about/ with a
  // 200, so Google crawled each page twice and filed the slashless copy under
  // "Alternate page with proper canonical tag" — /about, /projects and
  // /recommendations all landed there. Worse, on /referrals and /resume Google
  // overrode the rel=canonical and indexed BOTH forms, splitting the signals for
  // one page across two URLs.
  //
  // 'always' is the form the sitemap, the rel=canonical in MainHead.astro and the
  // og:url already emit, so this makes the server agree with what the pages have
  // been claiming rather than re-pointing Google at new URLs. The Vercel adapter
  // turns it into `"trailingSlash": true` in .vercel/output/config.json, which is
  // what actually makes the edge 308 the slashless form. Note that vercel.json's
  // own `trailingSlash`/`cleanUrls` keys are inert here: a Build Output API v3
  // deploy is routed entirely by config.json.
  trailingSlash: 'always',
  // /recommendations was live and may be linked externally. Target the slashed
  // form so the hop lands on the canonical URL instead of chaining into the
  // trailing-slash redirect.
  redirects: {'/recommendations': '/referrals/'},
  build: {
    // All of this site's CSS is ~5 KB gzipped, and 'auto' still left the two
    // page stylesheets as separate <link>s — two render-blocking round trips
    // that cost ~1s of first paint on a throttled mobile connection. Inlined,
    // the HTML document is the only thing standing between the network and
    // first paint.
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      filter: page => !NOINDEXED.some(p => page.includes(p)),
      serialize(item) {
        const mtime = urlToPageFile(item.url)
        if (mtime) item.lastmod = mtime.toISOString()

        if (item.url.includes('/projects')) {
          item.priority = 0.9
          item.changefreq = 'monthly'
        } else if (item.url.endsWith('/')) {
          item.priority = 1.0
          item.changefreq = 'weekly'
        } else if (item.url.includes('/about')) {
          item.priority = 0.8
          item.changefreq = 'monthly'
        }
        return item
      },
    }),
    icon(),
  ],
})
