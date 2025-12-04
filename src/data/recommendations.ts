// Logo.dev API configuration
// Get your free token at https://logo.dev
export const LOGO_DEV_TOKEN = 'pk_Kbm2p-lwRLqAPWM1uqumdg'

export const LOGO_DEV_CONFIG = {
  baseUrl: 'https://img.logo.dev',
  format: 'webp',
  size: 256,
  fallback: 'monogram',
} as const

export type Category = 'Tools' | 'Infrastructure' | 'Productivity' | 'Finance' | 'Design'

export interface Recommendation {
  id: string
  title: string
  description: string
  domain: string
  link: string
  category: Category
  badge?: string
  shareText?: string
}

export interface CategoryInfo {
  name: Category
  description: string
  icon: string
}

export const categories: CategoryInfo[] = [
  {name: 'Tools', description: 'Tools that make coding a breeze', icon: '⌨️'},
  {name: 'Infrastructure', description: 'Deploy and scale your apps', icon: '☁️'},
  {name: 'Productivity', description: 'Apps to get more done', icon: '⚡'},
  {name: 'Design', description: 'Create beautiful things', icon: '🎨'},
  {name: 'Finance', description: 'Manage your money wisely', icon: '💰'},
]

export const categoryColors: Record<Category, {bg: string; border: string; text: string}> = {
  'Tools': {bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa'},
  Infrastructure: {bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', text: '#22d3ee'},
  Productivity: {bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', text: '#4ade80'},
  Design: {bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc'},
  Finance: {bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24'},
}

export const recommendations: Recommendation[] = [
  // Tools
  {
    id: 'claude-code',
    title: 'Claude Code',
    description: 'AI-powered agentic coding tool by Anthropic that helps you write, edit, and understand code faster.',
    domain: 'anthropic.com',
    link: 'https://docs.anthropic.com/en/docs/claude-code',
    category: 'Tools',
  },
  {
    id: 'linear',
    title: 'Linear',
    description: 'The issue tracking tool you will enjoy using. Streamline software projects.',
    domain: 'linear.app',
    link: 'https://linear.app',
    category: 'Tools',
  },
  {
    id: 'warp',
    title: 'Warp',
    description:
      'The terminal reimagined with AI and collaborative features for modern developers.',
    domain: 'warp.dev',
    link: 'https://warp.dev',
    category: 'Tools',
  },
  {
    id: 'vscode',
    title: 'VSCode',
    description: 'Free, powerful code editor with extensions, debugging, and Git integration built-in.',
    domain: 'vscode.dev',
    link: 'https://code.visualstudio.com',
    category: 'Tools',
  },
  {
    id: 'tableplus',
    title: 'TablePlus',
    description: 'Modern, native database client with intuitive GUI for multiple databases.',
    domain: 'tableplus.com',
    link: 'https://tableplus.com',
    category: 'Tools',
  },

  // Infrastructure
  {
    id: 'cloudflare',
    title: 'Cloudflare',
    description: 'Global cloud platform for security, performance, and reliability.',
    domain: 'cloudflare.com',
    link: 'https://cloudflare.com',
    category: 'Infrastructure',
  },
  {
    id: 'vercel',
    title: 'Vercel',
    description: 'Deploy web projects with the best frontend developer experience.',
    domain: 'vercel.com',
    link: 'https://vercel.com',
    category: 'Infrastructure',
  },
  {
    id: 'railway',
    title: 'Railway',
    description: 'Instant deployments, effortless scaling. Infrastructure that just works.',
    domain: 'railway.app',
    link: 'https://railway.app',
    category: 'Infrastructure',
  },
  {
    id: 'aws',
    title: 'AWS',
    description: 'The most comprehensive cloud platform with 200+ services worldwide.',
    domain: 'aws.amazon.com',
    link: 'https://aws.amazon.com',
    category: 'Infrastructure',
  },
  {
    id: 'digitalocean',
    title: 'DigitalOcean',
    description: 'Cloud infrastructure for developers. Simple, scalable, and affordable.',
    domain: 'digitalocean.com',
    link: 'https://digitalocean.com',
    category: 'Infrastructure',
  },
  {
    id: 'netlify',
    title: 'Netlify',
    description: 'Build and deploy modern web projects with continuous deployment.',
    domain: 'netlify.com',
    link: 'https://netlify.com',
    category: 'Infrastructure',
  },

  // Productivity
  {
    id: 'raycast',
    title: 'Raycast',
    description: 'Blazingly fast, totally extendable launcher that supercharges your productivity.',
    domain: 'raycast.com',
    link: 'https://raycast.com',
    category: 'Productivity',
  },
  {
    id: 'brave',
    title: 'Brave',
    description: 'Fast, private browser that blocks ads and trackers by default.',
    domain: 'brave.com',
    link: 'https://brave.com',
    category: 'Productivity',
  },
  {
    id: 'notion',
    title: 'Notion',
    description: 'All-in-one workspace for notes, docs, wikis, and project management.',
    domain: 'notion.so',
    link: 'https://notion.so',
    category: 'Productivity',
  },
  {
    id: 'superhuman',
    title: 'Superhuman',
    description: 'The fastest email experience ever made. Fly through your inbox.',
    domain: 'superhuman.com',
    link: 'https://superhuman.com',
    category: 'Productivity',
    badge: 'Premium',
  },
  {
    id: 'cleanshot',
    title: 'CleanShot X',
    description: 'Capture your screen in a superior way. Screenshots and recordings made easy.',
    domain: 'cleanshot.com',
    link: 'https://cleanshot.com',
    category: 'Productivity',
  },
  {
    id: 'cron',
    title: 'Cron Calendar',
    description: 'The next-generation calendar for professionals and teams.',
    domain: 'cron.com',
    link: 'https://cron.com',
    category: 'Productivity',
  },

  // Design
  {
    id: 'figma',
    title: 'Figma',
    description:
      'The collaborative interface design tool that connects everyone in the design process.',
    domain: 'figma.com',
    link: 'https://figma.com',
    category: 'Design',
  },

  // Finance
  {
    id: 'zerodha',
    title: 'Zerodha',
    description:
      "India's largest stock broker offering the lowest brokerage. Invest in stocks, mutual funds, IPOs.",
    domain: 'zerodha.com',
    link: 'https://zerodha.com/?c=BP9835&s=CONSOLE',
    category: 'Finance',
    badge: 'Referral',
    shareText: `Start your investment journey with Zerodha — India's largest stock broker with the lowest brokerage fees. Sign up using my referral link: https://zerodha.com/?c=BP9835&s=CONSOLE`,
  },
  {
    id: 'smallcase',
    title: 'smallcase',
    description:
      "India's #1 model portfolios app. Invest in readymade portfolios, stocks, ETFs, mutual funds and FDs.",
    domain: 'smallcase.com',
    link: 'https://smlc.se/6YIuW',
    category: 'Finance',
    badge: 'Referral',
    shareText: `💌 Hey, think you'll love smallcase — India's #1 model portfolios app.

Invest in readymade portfolios, stocks, ETFs, mutual funds and FDs with ease. Get ₹500 cash & exclusive subscription discounts when you join https://smlc.se/6YIuW

*T&C apply`,
  },
  {
    id: 'indmoney',
    title: 'INDmoney',
    description:
      'Super app for all your finances. Track expenses, invest in US stocks, mutual funds, and more.',
    domain: 'indmoney.com',
    link: 'https://indmoney.onelink.me/RmHC/uxje2nn6',
    category: 'Finance',
    badge: '$10 Reward',
    shareText: `Soham is inviting you to INDmoney!

Hurry up claim your $10 reward before it's gone.
Sign Up on INDmoney app using the link/code below and claim your reward.

Reward code: SOH1D169USSR
https://indmoney.onelink.me/RmHC/uxje2nn6`,
  },
  {
    id: 'coinswitch',
    title: 'CoinSwitch',
    description:
      "India's biggest crypto investment app with 2 crore+ customers and 100+ top cryptos.",
    domain: 'coinswitch.co',
    link: 'https://coinswitch.co/in/refer?tag=Uifc5',
    category: 'Finance',
    badge: '₹200 Bitcoin',
    shareText: `Exciting news! CoinSwitch is giving ₹200 in Bitcoin to new customers. It's India's biggest crypto investment app with 2 crore customers and more than 100 top cryptos from around the world.

Hurry! Use my referral link to snap up this limited time offer: https://coinswitch.co/in/refer?tag=Uifc5`,
  },
  {
    id: 'wintwealth',
    title: 'Wint Wealth',
    description:
      'Earn 9–12% fixed returns on carefully handpicked assets. Backed by Zerodha, 0 defaults to date.',
    domain: 'wintwealth.com',
    link: 'https://www.wintwealth.com/bonds/referral/invite?referralCode=92949E',
    category: 'Finance',
    badge: 'Referral',
    shareText: `Hey, I came across Wint Wealth and thought of you!

They offer 9–12% fixed returns on carefully handpicked assets with 0 defaults to date. Backed by Zerodha and trusted by 80,000+ investors, it's a great way to earn stable returns in volatile markets and diversify your portfolio.

I've already been investing with them and highly recommend it.

Explore Now: https://www.wintwealth.com/bonds/referral/invite?referralCode=92949E`,
  },
  {
    id: 'cred',
    title: 'CRED',
    description:
      'Rewards app for credit card payments. Pay bills, earn rewards, and access exclusive deals.',
    domain: 'cred.club',
    link: 'https://app.cred.club/spQx/4z4x9ll7',
    category: 'Finance',
    badge: '₹50 Reward',
    shareText: `Sign up with my link and earn ₹50 on CRED.

Use it on payments of ₹100 or more to save on credit card and electricity bills or prepaid recharges https://app.cred.club/spQx/4z4x9ll7

My link works for 10 days, make the most of it!`,
  },
]

// Utility functions
export function getLogoUrl(domain: string): string {
  const {baseUrl, format, size, fallback} = LOGO_DEV_CONFIG
  return `${baseUrl}/${domain}?token=${LOGO_DEV_TOKEN}&format=${format}&size=${size}&fallback=${fallback}`
}

export function getRecommendationsByCategory(category: Category): Recommendation[] {
  return recommendations.filter(r => r.category === category)
}

export function getFeaturedRecommendations(count = 4): Recommendation[] {
  return recommendations.slice(0, count)
}

export function groupByCategory(): Record<Category, Recommendation[]> {
  return categories.reduce(
    (acc, cat) => {
      acc[cat.name] = getRecommendationsByCategory(cat.name)
      return acc
    },
    {} as Record<Category, Recommendation[]>,
  )
}

export function getDefaultShareText(rec: Recommendation): string {
  return `Check out ${rec.title} — ${rec.description}\n\n${rec.link}`
}
