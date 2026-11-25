import type { Metadata } from "next"
import { ArrowRight, Check } from "lucide-react"
import { BreadcrumbJsonLd, BookCallLink, CalendlyEmbed, FAQList, JsonLd } from "@/components/site-elements"
import { assessmentFaqs } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "HIPAA Risk Assessment for Chicago Practices",
  description: "Get a written HIPAA risk analysis, prioritized security gaps, cyber insurance questionnaire support, and a fixed-price plan from IT Square.",
  alternates: { canonical: "/risk-assessment" },
}

const deliverables = ["A written HIPAA risk analysis", "A ranked list of security gaps", "Answers ready for your cyber insurance questionnaire", "A fixed-price plan to close the gaps"]

export default function RiskAssessmentPage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: assessmentFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "HIPAA Risk Assessment", href: "/risk-assessment" }]} /><JsonLd data={faqSchema} />
    <section className="hero"><div className="container grid-2 risk-hero items-center gap-12"><div className="hero__content"><p className="eyebrow">HIPAA Risk Assessment · Chicago, IL</p><h1 className="display-title">Know exactly where your practice stands, in writing.</h1><p className="lead">A clear review of risks to patient information, the gaps to address, and a practical plan for your medical or dental practice.</p><p className="price">From $1,500</p><p className="body-copy mt-2">$1,500 for practices with fewer than 10 staff. Up to $3,000 for larger practices.</p><p className="body-copy mt-2">If you continue with IT Square within 30 days, the assessment fee is credited toward onboarding.</p><div className="hero__actions"><BookCallLink /></div></div><div className="report-sample" aria-label="Illustrative sample of a HIPAA Risk Assessment report"><div className="report-sample__header"><strong>Practice Security Review</strong><span className="sample-label">Sample</span></div><div className="report-sample__body"><p className="eyebrow">Illustrative excerpt · no client data</p><h2 className="mt-3 text-2xl font-semibold text-foreground">Priority findings</h2><div className="report-sample__row"><strong>Administrator sign-in</strong><span>Needs review</span></div><div className="report-sample__row"><strong>Backup restore test</strong><span>Document result</span></div><div className="report-sample__row"><strong>Incident contacts</strong><span>Confirm owners</span></div><p className="report-sample__watermark">Sample layout only. Findings shown here are illustrative and are not an assessment of an actual practice.</p></div></div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">A useful report, not a pile of jargon</p><h2 className="section-title">What you get</h2><p className="body-copy mt-4">A written starting point your practice can act on and use when discussing security questions with its insurer.</p></div><ul className="checklist">{deliverables.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></div></section>

    <section className="section"><div className="container"><div className="section-intro"><div><p className="eyebrow">Simple, documented steps</p><h2 className="section-title">How the assessment works</h2></div><p>We agree the scope and fee before the review begins. You receive the written report and a walkthrough.</p></div><div className="timeline"><article className="timeline-step"><h3>15-minute call</h3><p>Discuss your practice, your renewal questions, and what the review needs to cover.</p></article><article className="timeline-step"><h3>Onsite or remote review</h3><p>About 2–3 hours of your staff’s time. We review systems, safeguards, and relevant documentation.</p><p className="mt-2 text-xs">Working duration; confirm with IT Square when booking.</p></article><article className="timeline-step"><h3>Report walkthrough</h3><p>Review the written findings and plan together, within 10 business days of the review.</p><p className="mt-2 text-xs">Working turnaround; confirm when the assessment is scoped.</p></article></div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-10"><div><p className="eyebrow">Questions before booking</p><h2 className="section-title">Know what to expect</h2></div><FAQList items={assessmentFaqs} /></div></section>

    <section className="section"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Choose a time to talk</p><h2 className="section-title">Start with a short call.</h2><p className="body-copy mt-4">Tell us what your renewal asks for and get a clear answer about whether the assessment fits.</p><div className="mt-6"><BookCallLink /></div></div><CalendlyEmbed /></div></section>

    <section className="section section--soft"><div className="container cta-band"><div><p className="eyebrow">Chicago medical and dental practices</p><h2>See what is in place. Decide what comes next.</h2><p>No insurance approval guarantee. Just a written assessment and clear next steps.</p></div><a className="button button--primary" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call">Book a 15-minute call <ArrowRight aria-hidden="true" /></a></div></section>
  </main>
}
