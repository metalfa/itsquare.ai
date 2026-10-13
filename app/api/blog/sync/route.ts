import { NextResponse } from "next/server"
import { createWordPressPost, requireSyncSecret } from "@/lib/blog"

export const runtime = "nodejs"

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

export async function POST(request: Request) {
  try {
    if (!requireSyncSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const source = process.env.TECHTRIBE_API_URL
    const apiKey = process.env.TechTribe_API_KEY
    if (!source || !apiKey) return NextResponse.json({ error: "Tech Tribe sync is not configured" }, { status: 503 })

    const upstream = await fetch(source, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey },
      cache: "no-store",
    })
    if (!upstream.ok) return NextResponse.json({ error: `Tech Tribe returned ${upstream.status}` }, { status: 502 })

    const payload = await upstream.json()
    const sourcePosts = Array.isArray(payload) ? payload : Array.isArray(payload.posts) ? payload.posts : []
    const posts = await Promise.all(sourcePosts.slice(0, 10).map(async (item: Record<string, unknown>) => {
      const title = text(item.title) || text(item.name)
      const content = text(item.content) || text(item.body) || text(item.description)
      if (!title || !content) return { skipped: true }
      const created = await createWordPressPost({ title, content, excerpt: text(item.excerpt), status: "draft" })
      return { skipped: false, id: created.id, slug: created.slug }
    }))

    return NextResponse.json({ imported: posts.filter((post) => !post.skipped).length, skipped: posts.filter((post) => post.skipped).length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sync failed" }, { status: 500 })
  }
}
