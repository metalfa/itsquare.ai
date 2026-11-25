import type { Metadata } from "next"
import { BreadcrumbJsonLd, BookCallLink, CalendlyEmbed, FAQList, JsonLd, ReadinessCheckLink } from "@/components/site-elements"
import { assessmentFaqs, assessmentRiskReversal, assessmentTimeline } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "HIPAA & AI Risk Assessment for Practices",
  description: "A written HIPAA risk analysis, ranked security gaps, insurance questionnaire answers, practice AI rules, and a fixed-price plan. From $1,500.",
  alternates: { canonical: "/risk-assessment" },
  openGraph: { title: "HIPAA & AI Risk Assessment | ITSquare.ai", description: "Get a written review and a prioritized plan for your independent medical or dental practice.", images: ["/og-image.png"] },
}

const deliverables = ["Written HIPAA risk analysis", "Ranked list of security gaps", "Answers for your insurance questionnaire", "Your practice’s AI rules", "Fixed-price plan to address the gaps"]

export default function RiskAssessmentPage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: assessmentFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Risk Assessment", href: "/risk-assessment" }]} /><JsonLd data={faqSchema} />
    <section className="hero"><div className="container risk-hero"><div className="hero__content"><p className="eyebrow">One review. One prioritized plan.</p><h1 className="display-title">Know where your practice stands, in writing.</h1><p className="lead">The HIPAA &amp; AI Risk Assessment reviews the systems, safeguards, and AI use that matter to your practice. You leave with a ranked list and a plan you can act on.</p><p className="price">From $1,500</p><p className="body-copy">$1,500 for practices with fewer than 10 staff; up to $3,000 for larger practices. The final fee and scope are confirmed before work begins.</p><p className="body-copy mt-3">Continue with ITSquare.ai within 30 days and the assessment fee is credited toward onboarding.</p><div className="hero__actions"><BookCallLink /><ReadinessCheckLink /></div><p className="assessment-promise mt-6">{assessmentRiskReversal}</p><p className="edit-note">Owner review: confirm the risk-reversal wording before publication.</p></div>
    <div className="report-sample" aria-label="Sample HIPAA and AI Risk Assessment report"><div className="report-sample__header"><strong>Practice risk review</strong><span className="sample-label">Sample</span></div><div className="report-sample__body"><p className="eyebrow">Illustrative excerpt · no practice data</p><h2 className="mt-3 text-2xl font-semibold text-foreground">Prioritized findings</h2><div className="report-sample__row"><strong>Administrator sign-in</strong><span>Review MFA</span></div><div className="report-sample__row"><strong>Backup restore test</strong><span>Record result</span></div><div className="report-sample__row"><strong>Staff AI rules</strong><span>Document use</span></div><p className="report-sample__watermark">Sample layout only. These are illustrative headings, not findings about a real practice.</p></div></div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">A useful report, not a pile of jargon</p><h2 className="section-title">What you receive</h2><p className="body-copy mt-4">A clear starting point you can use to prioritize work and discuss technical questions with your broker.</p></div><ul className="checklist">{deliverables.map((item) => <li key={item}><span className="check-icon" aria-hidden="true">✓</span>{item}</li>)}</ul></div></section>

    <section className="section"><div className="container"><div className="section-intro"><div><p className="eyebrow">A defined review</p><h2 className="section-title">How the assessment works</h2></div><p>We agree scope, fee, and the practice’s time commitment before starting. Current working timeline values are shown below for owner confirmation.</p></div><div className="timeline"><article className="timeline-step"><h3>15-minute call</h3><p>Discuss your practice, your questions, and what should be in scope.</p></article><article className="timeline-step"><h3>{assessmentTimeline.reviewHours} of review</h3><p>Review relevant systems, safeguards, and documentation with the practice.</p></article><article className="timeline-step"><h3>Report walkthrough</h3><p>Review the written findings together within {assessmentTimeline.reportTurnaround} of the review.</p></article></div><p className="edit-note mt-7">Owner to confirm the estimated review time and report turnaround before publication.</p></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-10"><div><p className="eyebrow">Questions before booking</p><h2 className="section-title">Know what to expect</h2><p className="body-copy mt-4">A written risk analysis is required by the HIPAA Security Rule. <span className="source-line-inline">Source: 45 CFR 164.308(a)(1)(ii)(A).</span></p></div><FAQList items={assessmentFaqs} /></div></section>

    <section className="section"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Start with a short call</p><h2 className="section-title">Talk through the scope.</h2><p className="body-copy mt-4">Tell us what your practice needs to answer. We will confirm whether the assessment fits and what it includes.</p><div className="mt-6"><BookCallLink /></div><div className="mt-4"><ReadinessCheckLink /></div></div><CalendlyEmbed /></div></section>

    <section className="section section--soft"><div className="container cta-band"><div><p className="eyebrow">A practical first step</p><h2>Understand the gaps. Choose what happens next.</h2><p>Your insurer makes its own decisions. The assessment gives your practice a documented plan.</p></div><div className="flex flex-wrap gap-3"><BookCallLink /><ReadinessCheckLink /></div></div></section>
  </main>
}
