import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/site-elements"
import { blogPosts } from "@/lib/blog-posts"

export const metadata: Metadata = {
  title: "Insights for Medical & Dental Practices",
  description: "Plain-English IT and cybersecurity guides for Chicago medical and dental offices, from IT Square.",
  alternates: { canonical: "/blog" },
}

const categories = ["Security", "Microsoft 365", "Backups & Recovery", "Office IT", "Healthcare & HIPAA"]
const posts = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export default function BlogPage() {
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Insights", href: "/blog" }]} />
    <section className="hero"><div className="container"><p className="eyebrow">IT Square · Insights</p><h1 className="display-title">Useful IT thinking for healthcare practices.</h1><p className="lead">Plain-English guides for the security, systems, and decisions that keep independent practices moving.</p><div className="mt-8 flex flex-wrap gap-2" aria-label="Insight categories">{categories.map((category) => <a key={category} href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`} className="card-label">{category}</a>)}</div></div></section>
    <section className="section section--soft"><div className="container flex flex-col gap-14">{categories.map((category) => {
      const categoryPosts = posts.filter((post) => post.category === category)
      const sectionId = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      return <section key={category} id={sectionId} className="scroll-mt-28"><div className="section-intro"><div><p className="eyebrow">Topic</p><h2 className="section-title">{category}</h2></div>{categoryPosts.length === 0 && <p>New articles in this category are coming soon.</p>}</div>{categoryPosts.length > 0 && <div className="grid-3">{categoryPosts.map((post) => <article className="post-card" key={post.slug}><div className="post-meta"><span>{post.date}</span><span>{post.readTime}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><p className="mt-auto text-xs font-medium text-muted-foreground">By Faycal Ben Sassi</p><Link className="post-card__link mt-4" href={`/blog/${post.slug}`}>Read the guide <ArrowRight aria-hidden="true" /></Link></article>)}</div>}</section>
    })}</div></section>
  </main>
}
