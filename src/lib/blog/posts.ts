import posts from './posts.json'

export type BlogLink = { label: string; href: string }

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'links'; title: string; items: BlogLink[] }

export type BlogCover = { src: string; alt: string; credit: BlogLink }

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  topic: string
  readingMinutes: number
  tags: string[]
  cover: BlogCover
  body: BlogBlock[]
}

export const BLOG_POSTS: BlogPost[] = [...(posts as BlogPost[])].sort((a, b) => (a.date < b.date ? 1 : -1))

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(post => post.slug === slug)
}

export function blogPath(slug: string): string {
  return `/blog/${slug}`
}
