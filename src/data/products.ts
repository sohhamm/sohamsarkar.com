import type {ImageMetadata} from 'astro'
import superdivideImage from '../assets/products/superdivide.webp'
import rituaImage from '../assets/products/ritua.webp'
import superslateImage from '../assets/products/superslate.webp'

export type ProductStatus = 'Live' | 'Beta' | 'Coming Soon'

export interface Product {
  id: number
  title: string
  tagline: string
  description: string
  image: ImageMetadata
  link: string
  status: ProductStatus
  category: string
  highlights: string[]
  /** Tech stack, rendered as logo-only chips. Every entry must resolve in tech.ts. */
  stack: string[]
  /**
   * How the art fills its panel. `contain` for brand banners that must not be
   * cropped; `cover` for full-bleed screenshots that are meant to be cropped.
   */
  fit: 'cover' | 'contain'
  /** Panel colour behind the art — sampled from the asset's own edges so
   * `contain` letterboxing is seamless. */
  panel: string
}

export const products: Product[] = [
  {
    id: 2,
    title: 'SuperDivide',
    tagline: 'Shared expenses, settled.',
    description:
      'A blazingly fast way to create, manage & settle shared expenses without any hassle.',
    image: superdivideImage,
    link: 'https://www.superdivide.com',
    status: 'Beta',
    category: 'Personal Finance',
    highlights: ['Split any expense', 'Group balances', 'One-tap settle up'],
    stack: ['Bun', 'Hono', 'React', 'PostgreSQL', 'Better Auth'],
    fit: 'cover',
    panel: '#000000',
  },
  {
    id: 1,
    title: 'Ritua',
    tagline: 'Build habits that actually last.',
    description:
      'A habit tracker that turns intention into a practice you can keep — streaks, habit scores, and planned rest, without the guilt spiral.',
    image: rituaImage,
    link: 'https://www.getritua.com',
    status: 'Live',
    category: 'Productivity',
    highlights: ['Streaks & rhythm', 'Habit score', 'Rest days planned', 'Free'],
    stack: ['Expo', 'React Native', 'TypeScript', 'SQLite', 'Drizzle'],
    fit: 'contain',
    panel: '#32241f',
  },
  {
    id: 3,
    title: 'Superslate',
    tagline: 'The SaaS boilerplate built for the agent era.',
    description:
      'A source-owned TypeScript SaaS foundation — Bun + Hono API, React 19 SPA, end-to-end typed contracts, auth, billing and guided cloud deploys.',
    image: superslateImage,
    link: 'https://superslate.dev',
    status: 'Coming Soon',
    category: 'Developer Tools',
    highlights: ['Bun + Hono', 'React 19 SPA', 'Typed end-to-end', 'You own the source'],
    stack: ['Bun', 'Hono', 'React', 'PostgreSQL', 'Zod'],
    fit: 'contain',
    panel: '#0a0806',
  },
]

/** Adds the referral param used to attribute traffic coming from this site. */
export function productUrl(link: string) {
  const url = new URL(link)
  url.searchParams.set('ref', 'sohamsarkar.com')
  return url.href
}

/** `https://www.superdivide.com` -> `superdivide.com` */
export function productDomain(link: string) {
  return new URL(link).hostname.replace(/^www\./, '')
}
