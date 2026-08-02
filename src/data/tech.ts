/**
 * Tech marks, bundled locally from svgl.app.
 *
 * These were previously fetched from logo.dev, which indexes *company* logos —
 * its dev-tool coverage is patchy (SQLite came back as an upscaled bitmap,
 * Drizzle as a stranger's LinkedIn avatar) and it bakes backgrounds into the
 * source art, so a row of chips could never be made to sit evenly. These are
 * real vectors on transparent backgrounds. logo.dev still serves the company
 * logos on /referrals, which is what it's good at.
 *
 * Files use the `_dark` svgl variant where one exists — the version intended
 * for dark backgrounds. They live in assets/, not icons/, because astro-icon
 * auto-scans src/icons and its SVGO pass loops forever on two of these.
 */
const ICONS = import.meta.glob<string>('../assets/tech/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** Tag as written in content/data -> icon file in src/assets/tech. */
const TECH_ICONS: Record<string, string> = {
  react: 'react',
  // React Native's official mark is the React atom; svgl has no separate entry.
  'react native': 'react',
  solidjs: 'solidjs',
  svelte: 'svelte',
  nextjs: 'nextjs',
  go: 'go',
  // Fiber has no svgl entry — the language mark is the honest stand-in.
  'go fiber': 'go',
  rust: 'rust',
  postgresql: 'postgresql',
  sqlite: 'sqlite',
  turso: 'turso',
  bun: 'bun',
  elysia: 'elysia',
  fastify: 'fastify',
  turborepo: 'turborepo',
  'chakra ui': 'chakra-ui',
  scss: 'sass',
  typescript: 'typescript',
  hono: 'hono',
  expo: 'expo',
  drizzle: 'drizzle',
  'better auth': 'better-auth',
  zod: 'zod',
}

/** Strips the XML prolog and comments so the markup can be inlined into HTML. */
function clean(svg: string): string {
  return svg
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
}

/**
 * Inline SVG markup for a tech tag, or null when there's no mark worth showing
 * (REST, Vanilla JS) — those render as plain text.
 */
export function getTechIcon(tag: string): string | null {
  const slug = TECH_ICONS[tag.trim().toLowerCase()]
  if (!slug) return null

  const entry = Object.entries(ICONS).find(([path]) => path.endsWith(`/${slug}.svg`))
  return entry ? clean(entry[1]) : null
}
