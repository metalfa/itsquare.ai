import type { Metadata } from "next"
import { Check } from "lucide-react"
import { BreadcrumbJsonLd, BookCallLink, FAQList, JsonLd, ReadinessCheckLink } from "@/components/site-elements"
import { controls, healthcareFaqs } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Healthcare IT and Security for Independent Practices",
  description: "Five practical safeguards for medical and dental practices: multi-factor sign-in, monitored security software, tested backups, incident planning, and HIPAA risk analysis.",
  alternates: { canonical: "/healthcare" },
  openGraph: { title: "Healthcare IT and Security | ITSquare.ai", description: "IT and security support for independent practices, with clear documentation and one accountable person.", images: ["/og-image.png"] },
}

const planIncludes = ["Multi-factor sign-in", "24/7 monitored security software", "Tested backups", "Incident response plan", "Safe-AI setup and staff rules", "Help desk and updates", "Yearly HIPAA risk analysis refresh"]

export default function HealthcarePage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: healthcareFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Healthcare", href: "/healthcare" }]} />
    <JsonLd data={faqSchema} />
    <section className="hero"><div className="container hero-grid"><div className="hero__content"><p className="eyebrow">For independent medical and dental practices</p><h1 className="display-title">Know what is in place before your insurer asks.</h1><p className="lead">We help practices put common security safeguards in place, document the work, and understand their HIPAA responsibilities. No promise of insurance approval. One person accountable for the IT work.</p><div className="hero__actions"><BookCallLink /><ReadinessCheckLink /></div><p className="source-line">A written HIPAA risk analysis is required under the current HIPAA Security Rule. <span>Source: 45 CFR 164.308(a)(1)(ii)(A).</span></p></div><aside className="hero-panel"><div className="hero-panel__heading"><strong>Protected Practice</strong><span>Per-user monthly plan</span></div>{planIncludes.map((item, index) => <div className="hero-panel__item" key={item}><small>0{index + 1}</small><strong>{item}</strong></div>)}<p className="hero-panel__note">Pricing after your assessment. Scope is agreed in writing with the practice.</p></aside></div></section>

    <section className="section section--soft" id="controls"><div className="container"><div className="section-intro"><div><p className="eyebrow">Five safeguards insurers may ask about</p><h2 className="section-title">What each control means</h2></div><p>Insurer applications vary. These controls also help protect patient information and support a practical recovery plan.</p></div><div className="grid-2">{controls.map(({ short, title, term, why, how, proof }, index) => <article className="control-card" key={short}><div className="flex items-center justify-between"><span className="card-label">0{index + 1} · {short}</span><span className="text-xs text-muted-foreground">Documented work</span></div><h3>{title}</h3><p>{term}</p><p><strong>Why it matters</strong>{why}</p><p><strong>What we do</strong>{how}</p><p><strong>What you keep</strong>{proof}</p></article>)}</div></div></section>

    <section className="section"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Ongoing support</p><h2 className="section-title">Protected Practice</h2><p className="body-copy mt-5">A per-user monthly plan that keeps agreed safeguards and support work moving. Pricing is shared after your assessment.</p><p className="body-copy mt-4">AI-assisted tools watch routine system signals around the clock. A person reviews anything that could affect patients or data. Faycal is accountable for the result.</p></div><div className="price-card"><ul className="checklist">{planIncludes.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul><p className="body-copy mt-6">Your practice keeps its existing IT arrangements unless you choose to change them. Responsibilities are written down before ongoing work starts.</p></div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-10"><div><p className="eyebrow">Clear boundaries</p><h2 className="section-title">Support, not an insurance promise</h2><p className="body-copy mt-5">We can help you answer technical questions and document the safeguards in scope. Your insurer decides eligibility, coverage, and terms. We do not call this HIPAA certification.</p></div><div><p className="body-copy">A risk analysis is one part of an ongoing security program. Review the findings, assign owners, and revisit them when systems or practice operations change.</p><div className="hero__actions"><BookCallLink /><ReadinessCheckLink /></div></div></div></section>

    <section className="section"><div className="container grid-2 items-start gap-10"><div><p className="eyebrow">Common questions</p><h2 className="section-title">Clear before you commit</h2></div><FAQList items={healthcareFaqs} /></div></section>
    <section className="section section--soft"><div className="container cta-band"><div><p className="eyebrow">Start with a clear picture</p><h2>See what is in place and what needs attention.</h2><p>Take the self-check or talk through a specific renewal question.</p></div><div className="flex flex-wrap gap-3"><ReadinessCheckLink /><BookCallLink /></div></div></section>
  </main>
}
