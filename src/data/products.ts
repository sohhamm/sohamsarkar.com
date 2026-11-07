import type {ImageMetadata} from 'astro'
import superdivideImage from '../assets/products/superdivide.webp'
import rituaImage from '../assets/products/ritua.webp'
import superslateImage from '../assets/products/superslate.webp'
import saasclubImage from '../assets/products/saasclub.webp'
import testerswapImage from '../assets/products/testerswap.webp'
import ctcinhandImage from '../assets/products/ctcinhand.webp'

const WWW_PREFIX_RE = /^www\./

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
  /** Tech stack, rendered as a plain text line in the row's spec block. */
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
    link: 'https://superdivide.com',
    status: 'Live',
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
    link: 'https://getritua.com',
    status: 'Live',
    category: 'Productivity',
    highlights: ['Streaks & rhythm', 'Habit score', 'Rest days planned', 'Free'],
    stack: ['Expo', 'React Native', 'TypeScript', 'SQLite', 'Drizzle'],
    fit: 'contain',
    panel: '#32241f',
  },
  {
    id: 3,
    title: 'superslate',
    tagline: 'The SaaS boilerplate built for the agent era.',
    description:
      'A source-owned TypeScript SaaS foundation in three editions — React + Hono, TanStack Start and Expo — with auth, billing, teams and an Astro marketing site in every one.',
    image: superslateImage,
    link: 'https://superslate.dev',
    status: 'Live',
    category: 'Developer Tools',
    highlights: [
      'React + Hono on Bun & Postgres',
      'TanStack Start on Workers & D1',
      'Expo for mobile',
      'You own the source',
    ],
    stack: ['Bun', 'Hono', 'React', 'TanStack Start', 'Expo', 'Astro', 'PostgreSQL'],
    fit: 'contain',
    panel: '#0c1117',
  },
  {
    id: 6,
    title: 'saasclub',
    tagline: "You don't earn #1 here. You buy it.",
    description:
      'The paid product leaderboard — a dollar joins the club, and whatever you pay is your rank. No votes, no jury.',
    image: saasclubImage,
    link: 'https://saasclub.app',
    status: 'Live',
    category: 'Launch & Growth',
    highlights: ['Pay what you want', 'Rank is the bid', 'Top up the difference', 'No expiry'],
    stack: ['TanStack Start', 'React', 'Cloudflare Workers', 'D1', 'Dodo Payments'],
    fit: 'contain',
    panel: '#0b0b0e',
  },
  {
    id: 4,
    title: 'TesterSwap',
    tagline: 'Real installs, real testers, real reviews.',
    description:
      "A free exchange where developers install, use and honestly review each other's live apps — and get through Google Play's 14-day closed test together.",
    image: testerswapImage,
    link: 'https://testerswap.com',
    status: 'Live',
    category: 'App Testing',
    highlights: ['Google Play & App Store', 'TestFlight too', 'Test for test', 'Free'],
    stack: ['Bun', 'Hono', 'React', 'PostgreSQL', 'Better Auth'],
    fit: 'contain',
    panel: '#0c0c0f',
  },
  {
    id: 5,
    title: 'CTC in Hand',
    tagline: 'Your CTC, as the money that lands each month.',
    description:
      'An in-hand salary calculator for India — income tax, EPF and professional tax worked out, with the new and old regimes side by side.',
    image: ctcinhandImage,
    link: 'https://ctcinhand.in',
    status: 'Live',
    category: 'Personal Finance',
    highlights: ['CTC to monthly in-hand', 'New vs old regime', 'Salary slip & hike tools', 'Free'],
    stack: ['TanStack Start', 'React', 'Cloudflare Workers', 'D1', 'Better Auth'],
    fit: 'contain',
    panel: '#0b0f0d',
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
  return new URL(link).hostname.replace(WWW_PREFIX_RE, '')
}
