import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Check } from "lucide-react"

export const calendlyUrl = "https://calendly.com/bensassi-faysel/discovery-call"

export function BookCallLink({ children = "Book a 15-minute call", className = "" }: { children?: ReactNode; className?: string }) {
  return <a className={`button button--primary ${className}`} href={calendlyUrl} target="_blank" rel="noopener noreferrer" data-analytics="book-call">
    {children}<ArrowUpRight aria-hidden="true" />
  </a>
}

export function ReadinessCheckLink({ children = "Take the free Readiness Check", className = "" }: { children?: ReactNode; className?: string }) {
  return <Link className={`button button--secondary ${className}`} href="/readiness-check" data-analytics="readiness-cta">
    {children}<ArrowUpRight aria-hidden="true" />
  </Link>
}

export function RiskAssessmentLink({ children = "Explore the HIPAA Risk Assessment", className = "" }: { children?: ReactNode; className?: string }) {
  return <Link className={`button button--secondary ${className}`} href="/risk-assessment" data-analytics="risk-assessment-cta">
    {children}<ArrowUpRight aria-hidden="true" />
  </Link>
}

export function CalendlyEmbed() {
  return <div className="calendly-frame">
    <iframe
      title="Book a 15-minute call with ITSquare.ai"
      src={`${calendlyUrl}?background_color=f7f9f8&text_color=19343b&primary_color=9c482e`}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  </div>
}

export function FAQList({ items }: { items: { question: string; answer: string }[] }) {
  return <div className="faq-list">
    {items.map(({ question, answer }) => <details className="faq-item" key={question}>
      <summary>{question}<span aria-hidden="true">+</span></summary>
      <p>{answer}</p>
    </details>)}
  </div>
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const safeJson = JSON.stringify(data).replace(/</g, "\\u003c")
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />
}

export function BreadcrumbJsonLd({ items }: { items: { label: string; href: string }[] }) {
  return <JsonLd data={{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ label, href }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: label,
      item: `https://itsquare.ai${href}`,
    })),
  }} />
}

export function Checklist({ items }: { items: string[] }) {
  return <ul className="checklist">
    {items.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
  </ul>
}
