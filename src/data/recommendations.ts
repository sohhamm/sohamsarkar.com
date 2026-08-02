export {LOGO_DEV_TOKEN, LOGO_DEV_CONFIG, getLogoUrl} from '../utils/logo'

export type Category = 'Finance'

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
  {name: 'Finance', description: 'Apps I use to manage my money', icon: '💰'},
]

export const categoryColors: Record<Category, {bg: string; border: string; text: string}> = {
  Finance: {bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24'},
}

export const recommendations: Recommendation[] = [
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

export function getRecommendationsByCategory(category: Category): Recommendation[] {
  return recommendations.filter(r => r.category === category)
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
