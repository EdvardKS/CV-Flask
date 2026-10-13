import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocShell } from '@components/site/DocShell'
import { BLOG_POSTS, blogPath, getBlogPost, type BlogBlock } from '@lib/blog/posts'

const BASE = 'https://edvardks.com'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return BLOG_POSTS.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: 'Entrada no encontrada', robots: { index: false } }
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: blogPath(post.slug) },
    openGraph: {
      type: 'article',
      url: `${BASE}${blogPath(post.slug)}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: ['Edvard Khachatryan Sahakyan'],
      tags: post.tags,
      images: [{ url: post.cover.src, alt: post.cover.alt }]
    }
  }
}

function Block({ block }: { block: BlogBlock }) {
  if (block.type === 'h2') return <h2>{block.text}</h2>
  if (block.type === 'ul') {
    return (
      <ul className="doc-list">
        {block.items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'links') {
    return (
      <aside className="doc-links">
        <h2>{block.title}</h2>
        <ul>
          {block.items.map(item => (
            <li key={item.href}>
              {item.href.startsWith('/') ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <a href={item.href} target="_blank" rel="noopener">
                  {item.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </aside>
    )
  }
  return <p>{block.text}</p>
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  const url = `${BASE}${blogPath(post.slug)}`
  const others = BLOG_POSTS.filter(other => other.slug !== post.slug)

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: 'es-ES',
      keywords: post.tags.join(', '),
      mainEntityOfPage: url,
      image: `${BASE}${post.cover.src}`,
      author: { '@type': 'Person', name: 'Edvard Khachatryan Sahakyan', url: BASE },
      publisher: { '@type': 'Person', name: 'Edvard Khachatryan Sahakyan', url: BASE }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url }
      ]
    }
  ]

  return (
    <DocShell>
      <nav className="doc-crumbs" aria-label="Ruta">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
      </nav>

      <article className="doc-article">
        <p className="doc-eyebrow">
          {post.topic} · {post.date} · {post.readingMinutes} min
        </p>
        <h1>{post.title}</h1>
        <p className="doc-lead">{post.description}</p>
        <figure className="doc-figure">
          <img className="doc-cover" src={post.cover.src} alt={post.cover.alt} width={1280} height={800} />
          <figcaption>
            Foto:{' '}
            <a href={post.cover.credit.href} target="_blank" rel="noopener nofollow">
              {post.cover.credit.label}
            </a>
          </figcaption>
        </figure>
        {post.body.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </article>

      <section className="doc-related">
        <h2>Más entradas</h2>
        <ul>
          {others.map(other => (
            <li key={other.slug}>
              <Link href={blogPath(other.slug)}>
                <strong>{other.title}</strong>
                <span>{other.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {jsonLd.map((data, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
    </DocShell>
  )
}
