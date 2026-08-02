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

const NOINDEXED = [
  '/invest',
  '/payments',
  '/pochita-technologies',
  '/twitter',
  '/x',
  '/github',
  '/linkedin',
  '/peerlist',
]

// https://astro.build/config
export default defineConfig({
  site: 'https://sohamsarkar.com',
  output: 'static',
  adapter: vercel(),
  // /recommendations was live and may be linked externally.
  redirects: {'/recommendations': '/referrals'},
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
