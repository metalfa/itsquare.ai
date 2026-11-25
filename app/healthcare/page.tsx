import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { BreadcrumbJsonLd, BookCallLink, FAQList, JsonLd, RiskAssessmentLink } from "@/components/site-elements"
import { controls, healthcareFaqs } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Healthcare IT & Cyber Insurance Readiness",
  description: "See how IT Square helps Chicago practices document multi-factor sign-in, monitored security, tested backups, incident response, and HIPAA risk analysis.",
  alternates: { canonical: "/healthcare" },
}

const audiences = ["Physician and specialty practices", "Dental offices", "Therapy and behavioral health", "Clinics with 5 to 50 staff"]
const planIncludes = ["Multi-factor sign-in (a second check, like a phone prompt)", "24/7 monitored security software on covered computers", "Backups with scheduled restore tests", "A written incident response plan", "A yearly HIPAA risk analysis refresh", "Help desk and system updates"]
const onboarding = [
  { title: "Week 1 · Assessment", text: "Review the practice’s systems, current safeguards, and priorities. You receive findings and an agreed plan." },
  { title: "Weeks 2–4 · Controls", text: "Put the agreed safeguards in place, coordinate with vendors, and document the work as it is completed." },
  { title: "Monthly · Review", text: "Maintain the covered systems, answer support requests, and review security and backup status." },
]

export default function HealthcarePage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: healthcareFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Healthcare", href: "/healthcare" }]} />
    <JsonLd data={faqSchema} />
    <section className="hero"><div className="container hero-grid"><div className="hero__content"><p className="eyebrow">Healthcare IT for Chicago medical and dental offices</p><h1 className="display-title">Pass your cyber insurance renewal. Prove HIPAA compliance. Stay open if you&apos;re attacked.</h1><p className="lead">IT Square helps independent practices with 5 to 50 staff put safeguards in place, document them, and keep IT support accountable month to month. Insurance decisions remain with your insurer.</p><div className="hero__actions"><BookCallLink /><RiskAssessmentLink /></div><div className="trust-line"><span>Chicago-based</span><span>Onsite and remote support</span><span>Founder-led</span></div></div><aside className="hero-panel"><div className="hero-panel__heading"><strong>One monthly plan · Protected Practice</strong><span>Pricing after assessment</span></div>{planIncludes.map((item, index) => <div className="hero-panel__item" key={item}><small>0{index + 1}</small><strong>{item}</strong></div>)}<p className="hero-panel__note">Plan scope is agreed with your practice. No service can guarantee insurance approval or prevent every incident.</p></aside></div></section>

    <section className="section section--soft" id="controls"><div className="container"><div className="section-intro"><div><p className="eyebrow">What insurers may ask about</p><h2 className="section-title">Five controls, explained in plain English</h2></div><p>Insurer applications vary. These safeguards also support the protection of patient information and continuity of care.</p></div><div className="grid-2">{controls.map(({ short, title, term, why, how, proof }, index) => <article className="control-card" key={short}><div className="flex items-center justify-between"><span className="card-label">0{index + 1} · {short}</span><span className="text-xs text-muted-foreground">Documented evidence</span></div><h3>{title}</h3><p>{term}</p><p><strong>Why insurers ask</strong>{why}</p><p><strong>What we do</strong>{how}</p><p><strong>What you can keep as proof</strong>{proof}</p></article>)}</div></div></section>

    <section className="section"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">A focused fit</p><h2 className="section-title">Built for independent healthcare teams</h2><p className="body-copy mt-5">IT Square works with Chicago-area practices that need a practical, accountable IT partner, not another layer of technical jargon.</p></div><ul className="checklist">{audiences.map((audience) => <li key={audience}><ArrowRight aria-hidden="true" />{audience}</li>)}</ul></div></section>

    <section className="section section--soft"><div className="container"><div className="section-intro"><div><p className="eyebrow">Ongoing support</p><h2 className="section-title">Protected Practice</h2></div><p>A per-user monthly plan for the safeguards and day-to-day support your practice needs. Pricing is shared after your assessment.</p></div><div className="price-card grid-2 items-center gap-10"><div><h3 className="text-2xl font-semibold text-foreground">One monthly plan. One accountable partner.</h3><p className="body-copy mt-4">We agree what is covered, who owns each task, and what the monthly service costs before ongoing work begins.</p></div><ul className="checklist">{planIncludes.map((item) => <li key={item}><ArrowRight aria-hidden="true" />{item}</li>)}</ul></div></div></section>

    <section className="section"><div className="container"><div className="section-intro"><div><p className="eyebrow">No mystery onboarding</p><h2 className="section-title">A week-by-week start</h2></div><p>These are the working stages. Actual timing depends on your environment, vendors, and decisions.</p></div><div className="timeline">{onboarding.map((item) => <article className="timeline-step" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-10"><div><p className="eyebrow">Common questions</p><h2 className="section-title">Clear before you commit</h2></div><FAQList items={healthcareFaqs} /></div></section>

    <section className="section"><div className="container cta-band"><div><p className="eyebrow">Start with a clear picture</p><h2>Make your next renewal easier to answer.</h2><p>See what is in place, what needs attention, and what it will take to close the gaps.</p></div><div className="flex flex-wrap gap-3"><BookCallLink /><RiskAssessmentLink /></div></div></section>
  </main>
}
