// Logo.dev API configuration — shared by project tech tags and referral cards.
// Get your free token at https://logo.dev
export const LOGO_DEV_TOKEN = 'pk_Kbm2p-lwRLqAPWM1uqumdg'

export const LOGO_DEV_CONFIG = {
  baseUrl: 'https://img.logo.dev',
  format: 'webp',
  size: 256,
  fallback: 'monogram',
} as const

export function getLogoUrl(domain: string): string {
  const {baseUrl, format, size, fallback} = LOGO_DEV_CONFIG
  const params = new URLSearchParams({
    token: LOGO_DEV_TOKEN,
    format,
    size: String(size),
    fallback,
    // Several marks (SQLite especially) come back pixelated without this.
    retina: 'true',
  })

  return `${baseUrl}/${domain}?${params}`
}
