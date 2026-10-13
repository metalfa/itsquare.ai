import Link from "next/link"
import { ArrowUpRight, CalendarDays, Rss } from "lucide-react"
import { getWordPressPosts, postImage, stripHtml, type BlogPost } from "@/lib/blog"

export const metadata = {
  title: "Insights | ITSquare",
  description: "Practical ideas on managed IT, cybersecurity, and resilient business systems.",
}

export default async function BlogPage() {
  let posts: BlogPost[] = []
  let unavailable = false
  try {
    posts = await getWordPressPosts()
  } catch {
    unavailable = true
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[-0.04em]">ITSquare<span className="text-primary">.AI</span></Link>
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Back to home</Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">The ITSquare field notes</p>
          <h1 className="mt-5 text-balance text-5xl font-semibold tracking-[-0.07em] sm:text-7xl">Useful thinking for <span className="text-primary">steady systems.</span></h1>
          <p className="mt-7 text-lg leading-8 text-muted-foreground">Straightforward guidance for small teams building safer, calmer, better-supported workplaces.</p>
        </div>
        {unavailable ? (
          <div className="mt-16 rounded-2xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">Insights are being prepared. Check back soon.</div>
        ) : posts.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-border bg-card/50 p-8 text-sm text-muted-foreground">No published insights yet.</div>
        ) : (
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const image = postImage(post)
              return <article key={post.id} className="group overflow-hidden rounded-2xl border border-border bg-card/50 transition-colors hover:border-primary/50">
                {image ? <img src={image} alt="" className="aspect-[16/9] w-full object-cover" /> : <div className="aspect-[16/9] bg-primary/10" aria-hidden="true" />}
                <div className="flex flex-col gap-5 p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[.14em] text-muted-foreground"><CalendarDays className="size-3" /> {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                  <h2 className="text-2xl font-semibold tracking-tight">{stripHtml(post.title.rendered)}</h2>
                  <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{stripHtml(post.excerpt.rendered)}</p>
                  <a href={post.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Read the note <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
                </div>
              </article>
            })}
          </div>
        )}
        <div className="mt-20 flex items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground"><Rss className="size-4 text-primary" /> Managed in WordPress. Published insights stay yours.</div>
      </section>
    </main>
  )
}
