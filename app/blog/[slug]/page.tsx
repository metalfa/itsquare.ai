import Link from "next/link"
import { getStaticPost } from "@/lib/static-blog"
import { BlogPostContent } from "@/components/blog-post-content"

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getStaticPost(slug)
  const theme = slug.includes("hacked-email") ? "email" : slug.includes("business-domain") ? "domain" : slug.includes("move-offices") ? "office" : slug.includes("social-media") ? "social" : slug.includes("shared-logins") ? "shared" : slug.includes("vendor-breach") ? "vendor" : undefined
  const brief = theme === "domain" ? "A domain is business infrastructure. Keep registrar, DNS, renewal, and recovery control inside the company." : theme === "office" ? "An office move is an IT dependency exercise: stage the network, protect the cutover, and verify every service before reopening." : theme === "social" ? "Social accounts are business systems. Protect administrators, recovery channels, connected apps, and the brand they represent." : theme === "shared" ? "Shared credentials remove accountability. Replace them with named identities, role-based access, and auditable recovery." : theme === "vendor" ? "A vendor breach notice is the start of your investigation. Establish scope, evidence, containment, and follow-up ownership." : "A password reset is containment, not the complete recovery plan. Use this checklist to close the paths an attacker may have left open."
  if (!post) return <main className="mx-auto max-w-3xl px-6 py-24"><p>Insight not found.</p><Link href="/blog" className="mt-6 inline-block text-primary">Back to insights</Link></main>

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-primary">← All insights</Link>
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Insight"}</p>
            <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">{post.title}</h1>
            {post.excerpt && <p className="mt-7 max-w-3xl text-pretty text-xl leading-8 text-muted-foreground">{post.excerpt.replace(/<[^>]+>/g, "")}</p>}
          </header>
          <aside className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Security brief</p>
            <p className="mt-3">{brief}</p>
          </aside>
        </div>
        <div className="mx-auto mt-14 max-w-3xl">
          {post.body && <BlogPostContent value={post.body} theme={theme} />}
        </div>
      </article>
    </main>
  )
}
