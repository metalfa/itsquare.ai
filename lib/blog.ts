import { timingSafeEqual } from "node:crypto"

export type BlogPost = {
  id: number
  date: string
  slug: string
  link: string
  title: { rendered: string }
  excerpt: { rendered: string }
  content?: { rendered: string }
  jetpack_featured_media_url?: string
  _embedded?: { ['wp:featuredmedia']?: Array<{ source_url?: string; alt_text?: string }> }
}

function wordpressUrl() {
  const value = process.env.WORDPRESS_URL
  if (!value) throw new Error("WORDPRESS_URL is not configured")
  return value.replace(/\/$/, "")
}

export async function getWordPressPosts(limit = 6) {
  const response = await fetch(`${wordpressUrl()}/wp-json/wp/v2/posts?per_page=${Math.min(Math.max(limit, 1), 12)}&_embed`, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  })
  if (!response.ok) throw new Error(`WordPress returned ${response.status}`)
  return (await response.json()) as BlogPost[]
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

export function postImage(post: BlogPost) {
  return post.jetpack_featured_media_url ?? post._embedded?.["wp:featuredmedia"]?.[0]?.source_url
}

function requireWordPressCredentials() {
  const username = process.env.WORDPRESS_USERNAME
  const password = process.env.WORDPRESS_APP_PASSWORD
  if (!username || !password) throw new Error("WordPress application credentials are not configured")
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

export async function createWordPressPost(post: { title: string; content: string; excerpt?: string; status?: "draft" | "publish" }) {
  const response = await fetch(`${wordpressUrl()}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { Authorization: requireWordPressCredentials(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ title: post.title, content: post.content, excerpt: post.excerpt, status: post.status ?? "draft" }),
  })
  if (!response.ok) throw new Error(`WordPress post creation failed with ${response.status}`)
  return (await response.json()) as BlogPost
}

export function requireSyncSecret(request: Request) {
  const expected = process.env.WORDPRESS_SYNC_SECRET ?? process.env.CRON_SECRET
  if (!expected) throw new Error("WORDPRESS_SYNC_SECRET is not configured")
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!supplied || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return false
  }
  return true
}
