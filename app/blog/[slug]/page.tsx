import Link from "next/link"
import { PortableText } from "@portabletext/react"
import { getSanityPost } from "@/lib/sanity"

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getSanityPost(slug)
  if (!post) return <main className="mx-auto max-w-3xl px-6 py-24"><p>Insight not found.</p><Link href="/blog" className="mt-6 inline-block text-primary">Back to insights</Link></main>

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">← All insights</Link>
        <p className="mt-16 font-mono text-xs uppercase tracking-[0.16em] text-primary">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Insight"}</p>
        <h1 className="mt-5 text-balance text-5xl font-semibold tracking-tight md:text-7xl">{post.title}</h1>
        {post.excerpt && <p className="mt-7 text-xl leading-relaxed text-muted-foreground">{post.excerpt.replace(/<[^>]+>/g, "")}</p>}
        <div className="prose prose-invert mt-14 max-w-none prose-headings:tracking-tight prose-a:text-primary">
          {post.body && <PortableText value={post.body as never} />}
        </div>
      </article>
    </main>
  )
}
