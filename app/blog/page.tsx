import Link from "next/link"
import { getStaticPosts } from "@/lib/static-blog"
import { ArrowUpRight, BookOpen } from "lucide-react"

export const metadata = {
  title: "Insights | ITSquare",
  description: "Practical guidance for secure, steady, modern business IT.",
}

export default async function BlogPage() {
  const posts = getStaticPosts()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-16">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">← Back to ITSquare</Link>
        <header className="mt-16 max-w-3xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary"><BookOpen className="size-4" /> ITSquare insights</div>
          <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">Useful thinking for teams that need IT to work.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Clear guidance on security, cloud operations, Microsoft 365, and building a calmer technology environment.</p>
        </header>
        {posts.length === 0 ? (
          <section className="mt-20 border-t border-border py-12 text-muted-foreground">New insights are being prepared. Check back soon.</section>
        ) : (
          <section className="mt-20 grid gap-6 border-t border-border pt-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post._id} className="group flex min-h-64 flex-col justify-between border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Insight"}</p>
                  <h2 className="mt-5 text-2xl font-semibold leading-tight">{post.title}</h2>
                  {post.excerpt && <p className="mt-4 line-clamp-3 leading-relaxed text-muted-foreground">{post.excerpt.replace(/<[^>]+>/g, "")}</p>}
                </div>
                <Link href={`/blog/${post.slug}`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read insight <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
