import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import {defineConfig} from 'astro/config'
import icon from 'astro-icon'

import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  site: 'https://sohamsarkar.com',
  integrations: [
    tailwind(),
    sitemap(),
    react({include: ['**/react/*']}),
    icon({
      include: {
        // Include only three `mdi` icons in the bundle
        // mdi: ['account', 'account-plus', 'account-minus'],
        ri: ['*'],
      },
    }),
  ],
})
