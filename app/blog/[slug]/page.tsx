import type { Metadata } from "next"
import Image from "next/image"
import type { ComponentType } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { BackupRecoveryDiagrams } from "@/components/backup-recovery-diagrams"
import { DomainOwnershipDiagrams } from "@/components/domain-ownership-diagrams"
import { HackedEmailDiagrams } from "@/components/hacked-email-diagrams"
import { OfficeMoveDiagrams } from "@/components/office-move-diagrams"
import { SharedLoginDiagrams } from "@/components/shared-login-diagrams"
import { SocialMediaDiagrams } from "@/components/social-media-diagrams"
import { VendorBreachDiagrams } from "@/components/vendor-breach-diagrams"
import { BreadcrumbJsonLd, BookCallLink, JsonLd, RiskAssessmentLink } from "@/components/site-elements"
import { backupRecoverySections, blogPosts, domainOwnershipSections, getBlogPost, hackedEmailSections, officeMoveSections, sharedLoginSections, socialMediaSections, vendorBreachSections } from "@/lib/blog-posts"

type ArticleSection = { heading: string; paragraphs: string[] }
type ArticleContent = { sections: ArticleSection[]; Diagram: ComponentType }

const articleContent: Record<string, ArticleContent> = {
  "move-offices-without-disrupting-it": { sections: officeMoveSections, Diagram: OfficeMoveDiagrams },
  "protect-business-social-media-accounts": { sections: socialMediaSections, Diagram: SocialMediaDiagrams },
  "why-shared-logins-are-a-security-risk": { sections: sharedLoginSections, Diagram: SharedLoginDiagrams },
  "what-to-ask-after-a-vendor-data-breach": { sections: vendorBreachSections, Diagram: VendorBreachDiagrams },
  "how-to-make-sure-your-business-owns-its-domain-name": { sections: domainOwnershipSections, Diagram: DomainOwnershipDiagrams },
  "how-hackers-keep-access-to-your-email-after-a-password-change": { sections: hackedEmailSections, Diagram: HackedEmailDiagrams },
  "simple-backup-and-recovery-plans-for-small-business": { sections: backupRecoverySections, Diagram: BackupRecoveryDiagrams },
}

const headingId = (heading: string) => heading.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")

export function generateStaticParams() {
  return blogPosts.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: "Article not found", robots: { index: false, follow: true } }
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: new Date(post.date).toISOString(), authors: ["Faycal Ben Sassi"], images: ["/og-image.png"] },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: ["/og-image.png"] },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  const content = articleContent[slug]
  if (!post || !content) notFound()

  const relatedPosts = blogPosts.filter(({ slug: otherSlug }) => otherSlug !== slug).slice(0, 3)
  const publishedDate = new Date(post.date).toISOString()
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: publishedDate,
    dateModified: publishedDate,
    author: { "@type": "Person", name: "Faycal Ben Sassi" },
    publisher: { "@type": "Organization", name: "IT Square", url: "https://itsquare.ai" },
    mainEntityOfPage: `https://itsquare.ai/blog/${post.slug}`,
  }
  const Diagram = content.Diagram

  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Insights", href: "/blog" }, { label: post.title, href: `/blog/${post.slug}` }]} />
    <JsonLd data={articleSchema} />
    <article className="section container">
      <div className="article">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p className="lead">{post.excerpt}</p>
        <div className="post-meta mt-6"><span>{post.date}</span><span>{post.readTime}</span><span>By Faycal Ben Sassi</span></div>
        <nav className="article-toc mt-10" aria-label="Table of contents"><h2>In this guide</h2><ul>{content.sections.map(({ heading }) => <li key={heading}><a href={`#${headingId(heading)}`}>{heading}</a></li>)}</ul></nav>
        <div className="article-diagram"><Diagram /></div>
        <div className="article-body">{content.sections.map(({ heading, paragraphs }) => <section key={heading} id={headingId(heading)}><h2>{heading}</h2>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
        <aside className="author-box mt-12"><Image className="author-box__avatar" src="/faycal-ben-sassi.png" alt="Faycal Ben Sassi, founder of IT Square" width={1200} height={1650} sizes="52px" /><div><strong>Faycal Ben Sassi</strong><p>Founder of IT Square. Chicago-based, with 15 years of hands-on IT experience.</p><div className="mt-3"><BookCallLink /></div></div></aside>
      </div>
    </article>
    <section className="section section--soft"><div className="container"><div className="section-intro"><div><p className="eyebrow">Keep learning</p><h2 className="section-title">Related guides</h2></div><Link href="/blog" className="font-semibold text-primary">All insights <ArrowRight aria-hidden="true" className="ml-1 inline size-4" /></Link></div><div className="article-related">{relatedPosts.map((related) => <Link key={related.slug} href={`/blog/${related.slug}`}>{related.title}<span className="mt-2 block text-xs font-normal text-muted-foreground">{related.category} · {related.readTime}</span></Link>)}</div></div></section>
    <section className="section"><div className="container cta-band"><div><p className="eyebrow">A written next step</p><h2>Get a clear view of your practice’s risks.</h2><p>Explore the HIPAA Risk Assessment for Chicago medical and dental practices.</p></div><RiskAssessmentLink /></div></section>
  </main>
}
