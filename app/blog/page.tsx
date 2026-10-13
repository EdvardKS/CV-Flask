import type { Metadata } from 'next'
import Link from 'next/link'
import { DocShell } from '@components/site/DocShell'
import { BLOG_POSTS, blogPath } from '@lib/blog/posts'

const BASE = 'https://edvardks.com'

export const metadata: Metadata = {
  title: 'Blog — machine learning, deep learning y cómo trabajo con IA',
  description:
    'Notas de Edvard Khachatryan Sahakyan sobre machine learning, deep learning, RAG, agentes de IA y su forma de trabajar: lo que funciona en producción y lo que piensa de la actualidad.',
  alternates: { canonical: '/blog' },
  openGraph: { type: 'website', url: `${BASE}/blog`, title: 'Blog de Edvard Khachatryan Sahakyan' }
}

export default function BlogIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de Edvard Khachatryan Sahakyan',
    url: `${BASE}/blog`,
    inLanguage: 'es-ES',
    author: { '@type': 'Person', name: 'Edvard Khachatryan Sahakyan', url: BASE },
    blogPost: BLOG_POSTS.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${BASE}${blogPath(post.slug)}`,
      datePublished: post.date
    }))
  }

  return (
    <DocShell>
      <article className="doc-article">
        <p className="doc-eyebrow">Blog</p>
        <h1>Lo que pienso y cómo trabajo</h1>
        <p className="doc-lead">
          Machine learning, deep learning, modelos en local y agentes de IA, contados desde lo que he puesto en
          producción. Sin humo y con enlace al código cuando lo hay.
        </p>
      </article>

      <ul className="doc-post-list">
        {BLOG_POSTS.map(post => (
          <li key={post.slug}>
            <Link href={blogPath(post.slug)}>
              <img className="doc-post-thumb" src={post.cover.src} alt={post.cover.alt} width={1280} height={800} loading="lazy" />
              <span className="doc-post-meta">
                {post.topic} · {post.date} · {post.readingMinutes} min
              </span>
              <strong>{post.title}</strong>
              <span>{post.description}</span>
            </Link>
          </li>
        ))}
      </ul>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </DocShell>
  )
}
