// Monthly investment plan for Soham + wife, rendered at /invest.
// This file is the single source of truth for the page: edit amounts here,
// redeploy, done. Percentages are computed at render time — never hardcode them.

export type CategoryKey = 'india' | 'mfCore' | 'mfAggressive' | 'us' | 'dryPowder'

export const categories: Record<CategoryKey, {label: string; emoji: string; color: string}> = {
  india: {label: 'Direct Equity', emoji: '🇮🇳', color: '#3b82f6'},
  mfCore: {label: 'MF Core', emoji: '🔸', color: '#a5b4fc'},
  mfAggressive: {label: 'MF Aggressive', emoji: '🔸', color: '#c4b5fd'},
  us: {label: 'US Equity', emoji: '🇺🇸', color: '#93c5fd'},
  dryPowder: {label: 'Dry Powder (Arbitrage)', emoji: '💣', color: '#fbbf24'},
}

export type ScenarioId = 'ideal' | 'realistic' | 'worst'

export const scenarios: {id: ScenarioId; label: string; emoji: string}[] = [
  {id: 'ideal', label: 'Ideal', emoji: '💎'},
  {id: 'realistic', label: 'Realistic', emoji: '⚖️'},
  {id: 'worst', label: 'Worst', emoji: '🔴'},
]

export interface LineItem {
  category: CategoryKey
  amount: number // ₹ per month
  label?: string // display override for the category label
  note?: string
}

export interface Investor {
  name: string
  emoji: string
  plans: Record<ScenarioId, {items: LineItem[]}>
}

// Soham's direct equity runs through two smallcases — replace with the real names.
const SOHAM_SC_NOTE = 'SC: High Quality Right Price + GEM-Q Model'
const SOHAM_US_NOTE = 'Meta, Alphabet, Amazon, Cloudflare, Nvidia, Microsoft'

// Wife's funds differ from Soham's — same notes across all scenarios.
const WIFE_SC_NOTE = 'SC: Growth & Value Multicap'
const WIFE_MF_NOTE = 'Zerodha LargeMidcap 250 Index'
const WIFE_US_NOTE = 'Apple, Tesla/SpaceX'

export const investors: Investor[] = [
  {
    name: 'Soham',
    emoji: '🙋‍♂️',
    plans: {
      ideal: {
        items: [
          {category: 'india', amount: 95000, note: SOHAM_SC_NOTE},
          {category: 'mfCore', amount: 35000, note: 'Zerodha LargeMidcap 250 Index'},
          {category: 'mfAggressive', amount: 15000, note: 'Invesco India Smallcap'},
          {category: 'us', amount: 18000, note: SOHAM_US_NOTE},
          {category: 'dryPowder', amount: 32000, note: 'Mirae Asset Arb'},
        ],
      },
      realistic: {
        items: [
          {category: 'india', amount: 70000, note: SOHAM_SC_NOTE},
          {category: 'mfCore', amount: 30000, note: 'Zerodha LargeMidcap 250 Index'},
          {category: 'mfAggressive', amount: 15000, note: 'Invesco India Smallcap'},
          {category: 'us', amount: 15000, note: SOHAM_US_NOTE},
          {category: 'dryPowder', amount: 15000, note: 'Mirae Asset Arb'},
        ],
      },
      worst: {
        items: [
          {category: 'india', amount: 50000, note: SOHAM_SC_NOTE},
          {category: 'mfCore', amount: 45000, note: 'Zerodha LargeMidcap 250 Index'},
          {category: 'us', amount: 11000, note: SOHAM_US_NOTE},
          {category: 'dryPowder', amount: 14000, note: 'Mirae Asset Arb'},
        ],
      },
    },
  },
  {
    name: 'Wife',
    emoji: '🙋‍♀️',
    plans: {
      ideal: {
        items: [
          {category: 'india', amount: 50000, note: WIFE_SC_NOTE},
          {category: 'mfCore', label: 'Mutual Funds', amount: 36000, note: WIFE_MF_NOTE},
          {category: 'us', amount: 15000, note: WIFE_US_NOTE},
          {category: 'dryPowder', amount: 11000, note: 'Mirae Asset Arb'},
        ],
      },
      realistic: {
        items: [
          {category: 'india', amount: 40000, note: WIFE_SC_NOTE},
          {category: 'mfCore', label: 'Mutual Funds', amount: 30000, note: WIFE_MF_NOTE},
          {category: 'us', amount: 10000, note: WIFE_US_NOTE},
          {category: 'dryPowder', amount: 11000, note: 'Mirae Asset Arb'},
        ],
      },
      worst: {
        items: [
          {category: 'india', amount: 25000, note: WIFE_SC_NOTE},
          {category: 'mfCore', label: 'Mutual Funds', amount: 18000, note: WIFE_MF_NOTE},
          {category: 'us', amount: 5000, note: WIFE_US_NOTE},
          {category: 'dryPowder', amount: 8000, note: 'Mirae Asset Arb'},
        ],
      },
    },
  },
]

// 📉 How the dry powder gets deployed.
export const dryPowderTiers = [
  {
    name: 'Flash Cash',
    vehicle: 'Liquid',
    use: 'Intraday drops < 5–10% · Mirae Asset Liquid',
  },
  {
    name: 'Deep Storage',
    vehicle: 'Arbitrage',
    use: 'Corrections > 10–30% (T+2 settlement) · Mirae Asset Arbitrage',
  },
]

export const emergencyFund = 800000 // current EF value, ₹
export const emergencyFundNote = 'Entirely in Mirae Asset Liquid'
