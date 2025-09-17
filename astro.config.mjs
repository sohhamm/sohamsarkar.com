import vercel from '@astrojs/vercel'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import {defineConfig} from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://sohamsarkar.com',
  output: 'server',
  adapter: vercel(),
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        if (item.url.includes('/blog/')) {
          item.priority = 0.8
          item.changefreq = 'monthly'
        } else if (item.url.includes('/projects')) {
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
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['motion'],
          },
        },
      },
    },
  },
})
