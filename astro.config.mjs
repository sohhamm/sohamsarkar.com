import sitemap from '@astrojs/sitemap'
import {defineConfig} from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://sohamsarkar.com',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        // Set different priorities for different pages
        if (item.url.includes('/blog/')) {
          item.priority = 0.8
          item.changefreq = 'monthly'
        } else if (item.url.includes('/projects')) {
          item.priority = 0.9
          item.changefreq = 'monthly'
        } else if (item.url.endsWith('/')) {
          // Homepage
          item.priority = 1.0
          item.changefreq = 'weekly'
        } else if (item.url.includes('/about')) {
          item.priority = 0.8
          item.changefreq = 'monthly'
        }
        return item
      },
      // Filter out any unwanted pages
      // filter: (page) => {
      //   // Include all pages except those with 'noindex' or private paths
      //   return !page.includes('/admin/') && !page.includes('/private/')
      // }
    }),
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
