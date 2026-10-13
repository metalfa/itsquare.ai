import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { sanityWriteClient } from "@/lib/sanity"
import { requireSyncSecret } from "@/lib/blog"

export const runtime = "nodejs"

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 96)
}

function htmlToPortableText(html: string) {
  const blocks = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").split(/<\/(?:p|h[1-6]|li|blockquote)>/gi)
  return blocks.map((block) => {
    const heading = block.match(/<h([1-6])[^>]*>/i)
    const style = heading ? `h${heading[1]}` : block.includes("<blockquote") ? "blockquote" : "normal"
    const clean = block.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim()
    return clean ? { _type: "block", _key: createHash("sha1").update(`${style}-${clean}`).digest("hex").slice(0, 12), style, markDefs: [], children: [{ _type: "span", _key: "span", text: clean, marks: [] }] } : null
  }).filter(Boolean)
}

export async function POST(request: Request) {
  try {
    if (!requireSyncSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!process.env.SANITY_API_WRITE_TOKEN) return NextResponse.json({ error: "Sanity write token is not configured" }, { status: 503 })

    const body = await request.json() as { url?: string; post?: Record<string, unknown> }
    let post = body.post
    if (!post && body.url) {
      const response = await fetch(body.url, { headers: { Accept: "application/json" }, cache: "no-store" })
      if (!response.ok) return NextResponse.json({ error: `WordPress returned ${response.status}` }, { status: 502 })
      post = await response.json() as Record<string, unknown>
    }
    if (!post) return NextResponse.json({ error: "Provide a WordPress post JSON object or URL" }, { status: 400 })

    const title = text(post.title) || text((post.title as Record<string, unknown> | undefined)?.rendered)
    const html = text(post.content) || text((post.content as Record<string, unknown> | undefined)?.rendered)
    if (!title || !html) return NextResponse.json({ error: "Post title and content are required" }, { status: 400 })

    const sourceId = text(post.id) || text(post.slug) || slugify(title)
    const documentId = `blogPost-${sourceId.replace(/[^a-zA-Z0-9_-]/g, "-")}`
    const sourceUrl = text(post.link)
    const publishedAt = text(post.date) || new Date().toISOString()
    const document = {
      _id: documentId,
      _type: "blogPost",
      title,
      slug: { _type: "slug", current: text(post.slug) || slugify(title) },
      excerpt: text(post.excerpt) || text((post.excerpt as Record<string, unknown> | undefined)?.rendered),
      body: htmlToPortableText(html),
      publishedAt,
      source: "wordpress",
      sourceId,
      sourceUrl,
    }
    const result = await sanityWriteClient.createOrReplace(document)
    return NextResponse.json({ imported: true, id: result._id, title })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import failed" }, { status: 500 })
  }
}
