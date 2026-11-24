import {readdirSync, readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const ENDPOINT = 'https://api.indexnow.org/indexnow'
const KEY_FILE_RE = /^([0-9a-f]{32})\.txt$/
const SITEMAP_INDEX_RE = /<sitemapindex[\s>]/
const LOC_RE = /<loc>\s*([^<]+?)\s*<\/loc>/g
const MAX_URLS_PER_REQUEST = 10_000

const PUBLIC_DIRS = ['public']

const SITES = [
  {origin: 'https://sohamsarkar.com', sitemap: 'https://sohamsarkar.com/sitemap-index.xml'},
]

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function indexNowKey(): string {
  const keys = new Set<string>()
  for (const dir of PUBLIC_DIRS) {
    const publicDir = resolve(repositoryRoot, dir)
    const matches = readdirSync(publicDir).flatMap(name => KEY_FILE_RE.exec(name)?.[1] ?? [])
    if (matches.length !== 1) throw new Error(`${dir} must hold exactly one IndexNow key file`)
    const [key] = matches
    if (!key) throw new Error(`${dir} must hold exactly one IndexNow key file`)
    const content = readFileSync(resolve(publicDir, `${key}.txt`), 'utf8')
    if (content !== key) {
      throw new Error(`${dir}/${key}.txt contents must match its filename exactly`)
    }
    keys.add(key)
  }
  const [resolvedKey] = keys
  if (keys.size !== 1 || !resolvedKey) {
    throw new Error('public directories serve different IndexNow keys')
  }
  return resolvedKey
}

function decodeXml(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {redirect: 'follow'})
  if (!response.ok) throw new Error(`GET ${url} answered ${response.status}`)
  return response.text()
}

async function sitemapUrls(sitemap: string, seen = new Set<string>()): Promise<string[]> {
  if (seen.has(sitemap)) return []
  seen.add(sitemap)
  const xml = await fetchText(sitemap)
  const locations = [...xml.matchAll(LOC_RE)].flatMap(match =>
    match[1] ? [decodeXml(match[1])] : [],
  )
  if (!SITEMAP_INDEX_RE.test(xml)) return locations
  const nested = await Promise.all(locations.map(child => sitemapUrls(child, seen)))
  return nested.flat()
}

async function keyIsLive(keyLocation: string, key: string): Promise<boolean> {
  try {
    return (await fetchText(keyLocation)).trim() === key
  } catch {
    return false
  }
}

async function submit(host: string, key: string, keyLocation: string, urlList: string[]) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json; charset=utf-8'},
    body: JSON.stringify({host, key, keyLocation, urlList}),
  })
  const body = (await response.text()).trim()
  const outcome = `${response.status}${body ? ` ${body.slice(0, 200)}` : ''}`
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected ${urlList.length} ${host} URLs: ${outcome}`)
  }
  process.stdout.write(`  submitted ${urlList.length} URLs: ${outcome}\n`)
}

const dryRun = process.argv.includes('--dry-run')
const key = indexNowKey()
let failed = false

for (const site of SITES) {
  const {host} = new URL(site.origin)
  const keyLocation = `${site.origin}/${key}.txt`
  const urls = [...new Set(await sitemapUrls(site.sitemap))]
  const foreign = urls.filter(url => new URL(url).host !== host)
  const urlList = urls.filter(url => new URL(url).host === host)
  const live = await keyIsLive(keyLocation, key)

  process.stdout.write(`${host}: ${urlList.length} URLs from ${site.sitemap}\n`)
  process.stdout.write(`  key ${keyLocation} ${live ? 'is live' : 'is NOT live'}\n`)
  if (foreign.length > 0) {
    process.stdout.write(`  skipped ${foreign.length} URLs on other hosts\n`)
  }

  if (dryRun) {
    for (const url of urlList) process.stdout.write(`  ${url}\n`)
    continue
  }
  if (!live) {
    process.stderr.write(`  refusing to submit: deploy the key file first\n`)
    failed = true
    continue
  }
  for (let start = 0; start < urlList.length; start += MAX_URLS_PER_REQUEST) {
    await submit(host, key, keyLocation, urlList.slice(start, start + MAX_URLS_PER_REQUEST))
  }
}

if (failed) process.exitCode = 1
