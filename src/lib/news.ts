import { promises as fs } from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'
import { URL as NodeURL } from 'node:url'

/** Raw GET using node:http/https — tolerates non-standard status codes (LinkedIn 999). */
function rawGet(url: string, headers: Record<string, string> = {}, maxRedirects = 4): Promise<string | null> {
  return new Promise((resolve) => {
    const go = (u: string, hops: number) => {
      try {
        const parsed = new NodeURL(u)
        const lib = parsed.protocol === 'https:' ? https : http
        const req = lib.request({
          method: 'GET',
          host: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          headers,
          timeout: 10_000
        }, (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode ?? 0) && res.headers.location && hops > 0) {
            const next = new NodeURL(res.headers.location, u).toString()
            res.resume()
            go(next, hops - 1)
            return
          }
          if ((res.statusCode ?? 0) >= 400) { res.resume(); return resolve(null) }
          const chunks: Buffer[] = []
          res.on('data', (b) => chunks.push(b))
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
          res.on('error', () => resolve(null))
        })
        req.on('error', () => resolve(null))
        req.on('timeout', () => { req.destroy(); resolve(null) })
        req.end()
      } catch { resolve(null) }
    }
    go(url, maxRedirects)
  })
}

/**
 * News feed aggregator: combines GitHub public events + LinkedIn profile scrape.
 *
 * - GitHub events via unauthenticated API (60 req/h per IP). Reliable JSON.
 * - LinkedIn: public profile pages reject bot user-agents and require auth for
 *   activity/posts. We do a best-effort fetch of the landing HTML and pull
 *   the OpenGraph meta tags (name, tagline, photo) — that's usually all a
 *   logged-out request sees. The aside falls back to GitHub-only if LinkedIn
 *   blocks us, and labels the source of each item so the UI stays honest.
 *
 * Cache: in-memory (TTL) + disk (NEWS_CACHE_DIR, writable volume in Docker).
 */

export type NewsItem = {
  id: string
  source: 'github' | 'linkedin'
  kind: string            // 'PushEvent', 'CreateEvent', 'profile', 'post', 'certification', 'recommendation'
  title: string
  detail?: string
  url?: string
  at: string              // ISO timestamp
  repo?: string
  avatar?: string
  tags?: string[]
}

export type NewsFeed = {
  updatedAt: string
  ok: boolean
  items: NewsItem[]
  errors?: string[]
  profile?: { name?: string; headline?: string; photo?: string; url: string }
}

const GITHUB_USER = process.env.NEWS_GITHUB_USER ?? 'EdvardKS'
const LINKEDIN_URL = process.env.NEWS_LINKEDIN_URL ?? 'https://www.linkedin.com/in/edvardks/'
const TTL_MS = Number(process.env.NEWS_TTL_MS ?? 30 * 60 * 1000)      // 30 min
const CACHE_DIR = process.env.NEWS_CACHE_DIR ?? path.join(process.cwd(), 'public', 'news-cache')
const CACHE_FILE = path.join(CACHE_DIR, 'feed.json')

let mem: { feed: NewsFeed; at: number } | null = null

async function readDiskCache(): Promise<NewsFeed | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    const feed = JSON.parse(raw) as NewsFeed
    return feed
  } catch { return null }
}

async function writeDiskCache(feed: NewsFeed) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
    await fs.writeFile(CACHE_FILE, JSON.stringify(feed, null, 2), 'utf8')
  } catch (e) { console.warn('[news] disk cache write failed', e) }
}

async function fetchGitHubEvents(): Promise<{ items: NewsItem[]; error?: string }> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(GITHUB_USER)}/events/public`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'edvardks-portfolio/2.0'
      }
    })
    if (!res.ok) return { items: [], error: `GitHub ${res.status}` }
    const events = await res.json() as Array<{
      id: string; type: string; created_at: string
      repo: { name: string; url: string }
      payload: { ref?: string; ref_type?: string; commits?: { message: string; sha: string }[]; action?: string; pull_request?: { title: string; html_url: string } }
    }>
    const items: NewsItem[] = []
    for (const e of events.slice(0, 30)) {
      const repoUrl = `https://github.com/${e.repo.name}`
      switch (e.type) {
        case 'PushEvent': {
          const msgs = (e.payload.commits ?? []).map(c => c.message.split('\n')[0]).slice(0, 2)
          items.push({
            id: `gh-${e.id}`,
            source: 'github',
            kind: 'push',
            title: `Push a ${e.repo.name}`,
            detail: msgs.join(' · ') || e.payload.ref?.replace('refs/heads/', '') || '',
            url: repoUrl,
            repo: e.repo.name,
            at: e.created_at
          })
          break
        }
        case 'CreateEvent': {
          const kind = e.payload.ref_type ?? 'ref'
          items.push({
            id: `gh-${e.id}`,
            source: 'github',
            kind: 'create',
            title: `Creó ${kind} en ${e.repo.name}`,
            detail: e.payload.ref ?? '',
            url: repoUrl,
            repo: e.repo.name,
            at: e.created_at
          })
          break
        }
        case 'PullRequestEvent': {
          const pr = e.payload.pull_request
          items.push({
            id: `gh-${e.id}`,
            source: 'github',
            kind: 'pr',
            title: `PR ${e.payload.action ?? ''}: ${pr?.title ?? ''}`,
            detail: e.repo.name,
            url: pr?.html_url ?? repoUrl,
            repo: e.repo.name,
            at: e.created_at
          })
          break
        }
        case 'WatchEvent': {
          items.push({
            id: `gh-${e.id}`,
            source: 'github',
            kind: 'star',
            title: `⭐ ${e.repo.name}`,
            url: repoUrl,
            repo: e.repo.name,
            at: e.created_at
          })
          break
        }
        case 'IssuesEvent':
        case 'IssueCommentEvent': {
          items.push({
            id: `gh-${e.id}`,
            source: 'github',
            kind: 'issue',
            title: `Issue en ${e.repo.name}`,
            detail: e.payload.action,
            url: repoUrl,
            repo: e.repo.name,
            at: e.created_at
          })
          break
        }
        // Ignore other event types (Release, Fork, …) unless we want them.
      }
    }
    return { items }
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) }
  }
}

/** Extract og:* / twitter:* meta tags from raw HTML. */
function parseMeta(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /<meta\s+[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) out[m[1].toLowerCase()] = m[2]
  // Also handle content-first ordering
  const re2 = /<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']([^"']+)["'][^>]*>/gi
  while ((m = re2.exec(html))) {
    const k = m[2].toLowerCase()
    if (!out[k]) out[k] = m[1]
  }
  return out
}

async function fetchLinkedInProfile(): Promise<{ items: NewsItem[]; profile?: NewsFeed['profile']; error?: string }> {
  try {
    // Undici (Next.js fetch) rejects non-standard HTTP status codes. LinkedIn
    // returns 999 to anonymous bots, which throws — fall back to node:http.
    const html = await rawGet(LINKEDIN_URL, {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    })
    if (!html) return { items: [], error: 'LinkedIn bloquea scraping anónimo (999)' }
    const meta = parseMeta(html)
    const name = meta['og:title'] ?? meta['twitter:title']
    const headline = meta['og:description'] ?? meta['twitter:description']
    const photo = meta['og:image'] ?? meta['twitter:image']
    const profile = { name, headline, photo, url: LINKEDIN_URL }
    const items: NewsItem[] = []
    if (name) {
      items.push({
        id: 'li-profile',
        source: 'linkedin',
        kind: 'profile',
        title: name,
        detail: headline,
        url: LINKEDIN_URL,
        avatar: photo,
        at: new Date().toISOString()
      })
    }
    return { items, profile }
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) }
  }
}

async function loadCuratedLinkedIn(): Promise<NewsItem[]> {
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'linkedin-posts.json')
    const raw = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(raw) as Array<{
      id: string; at: string; title: string; detail?: string; url?: string; tags?: string[]; kind?: string
    }>
    return parsed.map(p => ({
      id: p.id,
      source: 'linkedin' as const,
      kind: p.kind ?? 'post',
      title: p.title,
      detail: p.detail,
      url: p.url ?? LINKEDIN_URL,
      at: p.at,
      tags: p.tags
    }))
  } catch (e) {
    console.warn('[news] curated linkedin posts missing:', e)
    return []
  }
}

export async function buildFeed(): Promise<NewsFeed> {
  const errors: string[] = []
  const [gh, li, curated] = await Promise.all([
    fetchGitHubEvents(),
    fetchLinkedInProfile(),
    loadCuratedLinkedIn()
  ])
  if (gh.error) errors.push(`github: ${gh.error}`)
  if (li.error) errors.push(`linkedin: ${li.error}`)
  // LinkedIn blocks anonymous scraping of activity/posts; merge the curated
  // list (maintained manually from the user's actual LinkedIn feed) with any
  // profile snippet that might have come through OG meta.
  // Ordering: LinkedIn first (hand-picked highlights, higher editorial
  // value), then GitHub events underneath. Within each group sorted by
  // recency.
  const linkedin = [...li.items, ...curated].sort((a, b) => b.at.localeCompare(a.at))
  const github = gh.items.sort((a, b) => b.at.localeCompare(a.at))
  const items = [...linkedin, ...github]
  return {
    updatedAt: new Date().toISOString(),
    ok: items.length > 0,
    items,
    errors: errors.length ? errors : undefined,
    profile: li.profile
  }
}

export async function getFeed(opts: { force?: boolean } = {}): Promise<NewsFeed> {
  const now = Date.now()
  if (!opts.force && mem && now - mem.at < TTL_MS) return mem.feed
  if (!opts.force && !mem) {
    const disk = await readDiskCache()
    if (disk) {
      const ageMs = now - new Date(disk.updatedAt).getTime()
      if (ageMs < TTL_MS) {
        mem = { feed: disk, at: now - ageMs }
        return disk
      }
    }
  }
  const feed = await buildFeed()
  mem = { feed, at: now }
  // If rebuild failed and we still have a disk snapshot, return the stale one
  // instead of propagating the error to the UI.
  if (!feed.ok && !opts.force) {
    const disk = await readDiskCache()
    if (disk && disk.ok) return disk
  }
  await writeDiskCache(feed)
  return feed
}
