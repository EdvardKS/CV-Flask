import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readPosts, validatePosts } from './validate-blog.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POSTS_FILE = path.join(ROOT, 'src', 'lib', 'blog', 'posts.json')
const VOICE_FILE = path.join(ROOT, 'scripts', 'weekly-post-voice.md')
const IMAGE_DIR = path.join(ROOT, 'public', 'blog')
const CLAUDE = process.env.WEEKLY_POST_CLAUDE ?? '/home/ubuntu/.local/bin/claude'
const MODEL = process.env.WEEKLY_POST_MODEL ?? 'opus'
const SITE = 'https://edvardks.com'
const DRY_RUN = process.argv.includes('--dry-run')
const USER_AGENT = 'edvardks-blog/1.0 (info@edvardks.com)'
const FREE_LICENSE = /^(CC0|Public domain|CC BY( |-)?\d|CC BY-SA)/

const TOPICS = ['Big data', 'Machine learning', 'Cloud', 'Deep learning']

const FALLBACK_COVERS = {
  'Big data': {
    src: '/blog/marenostrum-supercomputador.webp',
    alt: 'Supercomputador MareNostrum 4 en el Barcelona Supercomputing Center',
    credit: {
      label: 'Martidaniel, CC BY-SA 4.0, vía Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:2017_BSC_Superordenador_MareNostrum-4_Barcelona-Supercomputing-Center.jpg'
    }
  },
  'Machine learning': {
    src: '/blog/codigo-en-monitor.webp',
    alt: 'Código fuente en la pantalla de un ordenador',
    credit: {
      label: 'Markus Spiske, CC0, vía Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Code_on_computer_monitor_(Unsplash).jpg'
    }
  },
  Cloud: {
    src: '/blog/marenostrum-supercomputador.webp',
    alt: 'Supercomputador MareNostrum 4 en el Barcelona Supercomputing Center',
    credit: {
      label: 'Martidaniel, CC BY-SA 4.0, vía Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:2017_BSC_Superordenador_MareNostrum-4_Barcelona-Supercomputing-Center.jpg'
    }
  },
  'Deep learning': {
    src: '/blog/red-neuronal-chip.webp',
    alt: 'Ilustración de una red neuronal con forma de cerebro alrededor de un chip',
    credit: {
      label: 'mikemacmarketing, CC BY 2.0, vía Wikimedia Commons',
      href: 'https://commons.wikimedia.org/wiki/File:Artificial_Neural_Network_with_Chip.jpg'
    }
  }
}

const SCHEMA = {
  type: 'object',
  required: ['title', 'slug', 'description', 'topic', 'tags', 'intro', 'news', 'takeaways', 'imageQueries', 'imageAlt'],
  properties: {
    title: { type: 'string', description: 'Titular llamativo y concreto, de 50 a 90 caracteres, sin dos puntos seguidos de subtítulo genérico' },
    slug: { type: 'string', description: 'Slug en minúsculas con guiones, sin tildes, de 3 a 7 palabras' },
    description: { type: 'string', description: 'Resumen para buscadores, de 120 a 170 caracteres' },
    topic: { type: 'string', enum: TOPICS },
    tags: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'string' } },
    intro: { type: 'string', description: 'Párrafo de entrada en primera persona, de 2 a 4 frases' },
    news: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        required: ['headline', 'whatHappened', 'myTake', 'sourceLabel', 'sourceUrl'],
        properties: {
          headline: { type: 'string', description: 'Subtítulo de la noticia, corto' },
          whatHappened: { type: 'string', description: 'Qué ha pasado, de 3 a 5 frases, con la fecha y con cautela si la fuente es la propia empresa' },
          myTake: { type: 'string', description: 'Opinión en primera persona, de 3 a 6 frases, sin empezar por «Mi opinión»' },
          sourceLabel: { type: 'string', description: 'Medio y titular breve de la fuente' },
          sourceUrl: { type: 'string', description: 'URL exacta de la fuente, que has abierto y comprobado' }
        }
      }
    },
    takeaways: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
    imageQueries: {
      type: 'array',
      minItems: 3,
      maxItems: 5,
      items: { type: 'string' },
      description: 'Búsquedas en inglés para Wikimedia Commons de una foto que ilustre el tema: objetos, lugares o edificios concretos, no conceptos abstractos'
    },
    imageAlt: { type: 'string', description: 'Texto alternativo genérico en español para la foto que saldría de esas búsquedas' }
  }
}

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.slice(0, 3).join(' ')}: ${(result.stderr || result.stdout || '').trim().slice(-600)}`)
  }
  return result.stdout
}

function askForDraft(existingTitles) {
  const today = new Date().toISOString().slice(0, 10)
  const prompt = [
    `Hoy es ${today}. Busca en la web las noticias de los últimos siete días sobre big data, machine learning, cloud y deep learning.`,
    'Elige las tres que más cambian el trabajo real de un ingeniero de datos o de una empresa pequeña, de fuentes distintas, y abre cada fuente para comprobar lo que dice antes de usarla.',
    'Escribe la entrada semanal siguiendo las instrucciones del sistema y devuelve solo el objeto pedido.',
    'No repitas temas ya tratados en estas entradas:',
    ...existingTitles.map(title => `- ${title}`)
  ].join('\n')

  const result = spawnSync(
    CLAUDE,
    [
      '-p', prompt,
      '--tools', 'WebSearch,WebFetch',
      '--allowedTools', 'WebSearch,WebFetch',
      '--strict-mcp-config',
      '--no-session-persistence',
      '--setting-sources', '',
      '--model', MODEL,
      '--system-prompt', readFileSync(VOICE_FILE, 'utf8'),
      '--output-format', 'json',
      '--json-schema', JSON.stringify(SCHEMA)
    ],
    { cwd: '/tmp', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 25 * 60 * 1000, stdio: ['ignore', 'pipe', 'pipe'] }
  )
  if (result.status !== 0) throw new Error(`claude: ${(result.stderr || result.stdout || '').trim().slice(-600)}`)

  const envelope = JSON.parse(result.stdout)
  if (envelope.is_error) throw new Error(`claude: ${String(envelope.result).slice(0, 400)}`)
  const draft = typeof envelope.structured_output === 'string' ? JSON.parse(envelope.structured_output) : envelope.structured_output
  if (!draft?.news) throw new Error('claude no devolvió un borrador estructurado')
  return draft
}

async function sourceResponds(url) {
  if (!/^https:\/\//.test(url)) return false
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; edvardks-blog/1.0)' },
      signal: AbortSignal.timeout(20000)
    })
    return response.status < 400 || response.status === 403 || response.status === 429
  } catch {
    return false
  }
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '')
}

async function findFreeImage(queries, slug) {
  for (const query of queries) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',
      gsrnamespace: '6',
      gsrlimit: '12',
      gsrsearch: `${query} filetype:bitmap`,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size',
      iiurlwidth: '1280'
    })
    let pages = []
    try {
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(20000)
      })
      pages = Object.values((await response.json()).query?.pages ?? {})
    } catch {
      continue
    }

    for (const page of pages) {
      const info = page.imageinfo?.[0]
      const license = info?.extmetadata?.LicenseShortName?.value ?? ''
      if (!info || !FREE_LICENSE.test(license)) continue
      if (info.width < 1400 || info.width < info.height * 1.25) continue

      const artist = (info.extmetadata?.Artist?.value ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60)
      if (!artist) continue

      const temporary = path.join('/tmp', `weekly-post-${slug}.img`)
      const target = path.join(IMAGE_DIR, `${slug}.webp`)
      try {
        const image = await fetch(info.thumburl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(40000) })
        if (!image.ok) continue
        writeFileSync(temporary, Buffer.from(await image.arrayBuffer()))
        run('ffmpeg', ['-loglevel', 'error', '-y', '-i', temporary, '-vf', 'scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800', '-quality', '78', target])
        return {
          file: target,
          src: `/blog/${slug}.webp`,
          credit: { label: `${artist}, ${license}, vía Wikimedia Commons`, href: info.descriptionurl }
        }
      } catch {
        rmSync(target, { force: true })
      } finally {
        rmSync(temporary, { force: true })
      }
    }
  }
  return null
}

function buildBody(draft, news) {
  const body = [{ type: 'p', text: draft.intro }]
  for (const item of news) {
    body.push({ type: 'h2', text: item.headline })
    body.push({ type: 'p', text: item.whatHappened })
    body.push({ type: 'p', text: `Mi opinión: ${item.myTake}` })
  }
  body.push({ type: 'h2', text: 'Lo que me llevo' })
  body.push({ type: 'ul', items: draft.takeaways })
  body.push({ type: 'links', title: 'Fuentes', items: news.map(item => ({ label: item.sourceLabel, href: item.sourceUrl })) })
  return body
}

// Desde el 16-10-2026 el servidor no compila (modo release): el push a master
// lanza el CI (.github/workflows/release.yml), que publica la rama `release`, y
// el panel la despliega al recibir el webhook. Aquí solo se espera a que la
// entrada responda.
function waitPublished(slug) {
  log('esperando a que el CI y el despliegue la publiquen')
  for (let attempt = 0; attempt < 60; attempt += 1) {
    spawnSync('sleep', ['30'])
    const status = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', `${SITE}/blog/${slug}`], { encoding: 'utf8' }).stdout
    if (status === '200') return
  }
  throw new Error('la entrada no responde 200 media hora después del push: revisa el CI en GitHub y el panel')
}

async function main() {
  run('git', ['pull', '-q', '--ff-only'])
  const posts = readPosts()
  const original = readFileSync(POSTS_FILE, 'utf8')
  const today = new Date().toISOString().slice(0, 10)

  log(`pidiendo el borrador (${MODEL})`)
  const draft = askForDraft(posts.map(post => post.title))

  const news = []
  const seenHosts = new Set()
  for (const item of draft.news) {
    const host = (() => {
      try {
        return new URL(item.sourceUrl).host
      } catch {
        return ''
      }
    })()
    if (!host || seenHosts.has(host)) continue
    if (!(await sourceResponds(item.sourceUrl))) {
      log(`fuente descartada, no responde: ${item.sourceUrl}`)
      continue
    }
    seenHosts.add(host)
    news.push(item)
  }
  if (news.length < 2) throw new Error('menos de dos noticias con fuente comprobable')

  let slug = slugify(draft.slug || draft.title)
  if (posts.some(post => post.slug === slug)) slug = `${slug}-${today}`

  const image = await findFreeImage(draft.imageQueries, slug)
  const cover = image
    ? { src: image.src, alt: draft.imageAlt, credit: image.credit }
    : FALLBACK_COVERS[draft.topic] ?? FALLBACK_COVERS['Machine learning']
  log(image ? `imagen libre: ${image.credit.label}` : 'sin imagen libre nueva, se usa la de reserva del tema')

  const body = buildBody(draft, news)
  const words = body.map(block => (block.text ?? (block.items ?? []).map(entry => entry.label ?? entry).join(' '))).join(' ').split(/\s+/).length
  const post = {
    slug,
    title: draft.title,
    description: draft.description,
    date: today,
    topic: draft.topic,
    readingMinutes: Math.max(3, Math.round(words / 200)),
    tags: draft.tags,
    cover,
    body
  }

  const next = [...posts, post]
  const problems = validatePosts(next)
  if (problems.length > 0) {
    if (image) rmSync(image.file, { force: true })
    throw new Error(`entrada no válida: ${problems.join('; ')}`)
  }

  if (DRY_RUN) {
    if (image) rmSync(image.file, { force: true })
    console.log(JSON.stringify(post, null, 2))
    return
  }

  writeFileSync(POSTS_FILE, `${JSON.stringify(next, null, 2)}\n`)
  let committed = false
  try {
    const files = ['src/lib/blog/posts.json']
    if (image && existsSync(image.file)) files.push(path.relative(ROOT, image.file))
    run('git', ['add', ...files])
    run('git', ['commit', '-q', '-m', `Blog: entrada semanal «${post.title}»`])
    committed = true
    run('git', ['push', '-q', 'origin', 'HEAD'])
  } catch (error) {
    if (committed) run('git', ['reset', '-q', 'HEAD~1'])
    writeFileSync(POSTS_FILE, original)
    if (image) rmSync(image.file, { force: true })
    throw error
  }
  waitPublished(slug)
  log(`publicada ${SITE}/blog/${slug}`)
}

main().catch(error => {
  log(`ERROR ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
