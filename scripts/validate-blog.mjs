import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POSTS_FILE = path.join(ROOT, 'src', 'lib', 'blog', 'posts.json')
const MIN_IMAGE_BYTES = 8 * 1024

export function validatePosts(posts) {
  const problems = []
  const slugs = new Set()

  for (const post of posts) {
    const where = post?.slug ?? '(sin slug)'
    const fail = message => problems.push(`${where}: ${message}`)

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug ?? '')) fail('slug no válido')
    if (slugs.has(post.slug)) fail('slug repetido')
    slugs.add(post.slug)
    if (!post.title || post.title.length < 20) fail('título demasiado corto')
    if (!post.description || post.description.length < 60) fail('descripción demasiado corta')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date ?? '')) fail('fecha no válida')
    if (!Array.isArray(post.tags) || post.tags.length === 0) fail('sin etiquetas')
    if (!Array.isArray(post.body) || post.body.length < 4) fail('cuerpo demasiado corto')

    const cover = post.cover
    if (!cover?.src) {
      fail('falta la imagen de portada')
      continue
    }
    if (!cover.alt || cover.alt.length < 10) fail('la imagen no tiene texto alternativo')
    if (!cover.credit?.label || !/^https?:\/\//.test(cover.credit?.href ?? '')) fail('la imagen no tiene crédito con enlace')
    const file = path.join(ROOT, 'public', cover.src)
    if (!existsSync(file)) fail(`no existe el fichero de imagen ${cover.src}`)
    else if (statSync(file).size < MIN_IMAGE_BYTES) fail(`la imagen ${cover.src} parece vacía`)
  }

  return problems
}

export function readPosts() {
  return JSON.parse(readFileSync(POSTS_FILE, 'utf8'))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = validatePosts(readPosts())
  if (problems.length > 0) {
    console.error('[blog] entradas no válidas:\n' + problems.map(problem => `  - ${problem}`).join('\n'))
    process.exit(1)
  }
  console.log(`[blog] ${readPosts().length} entradas válidas, todas con imagen`)
}
