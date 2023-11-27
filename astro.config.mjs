import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import {defineConfig} from 'astro/config'

import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  site: 'https://sohamsarkar.com',
  integrations: [tailwind(), sitemap(), react({include: ['**/react/*']})],
})
