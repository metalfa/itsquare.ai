import type { Metadata } from "next"
import { ArrowRight, Check } from "lucide-react"
import { PartnerReferralForm } from "@/components/contact-forms"
import { BreadcrumbJsonLd, JsonLd } from "@/components/site-elements"

export const metadata: Metadata = {
  title: "IT Referrals for Insurance Brokers & Practice Advisors",
  description: "Refer a Chicago medical or dental practice that needs help with cyber insurance controls, HIPAA risk analysis, and IT documentation.",
  alternates: { canonical: "/partners" },
}

const partners = ["Insurance brokers", "Dental and medical practice brokers", "Healthcare accountants", "Billing companies", "Practice consultants"]
const steps = [
  { title: "Make an introduction", text: "Share the practice’s business contact details with permission. Please do not send patient information." },
  { title: "We scope the IT work", text: "We speak with the practice, clarify the gaps, and agree a written assessment scope and fee." },
  { title: "The practice gets documentation", text: "We return findings and IT-side evidence the practice can share with its broker. The insurer decides coverage." },
]

export default function PartnersPage() {
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "For Brokers & Advisors", href: "/partners" }]
  return <main className="page-shell">
    <BreadcrumbJsonLd items={breadcrumbItems} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfessionalService", name: "IT Square", url: "https://itsquare.ai/partners", areaServed: "Chicago, IL" }} />
    <section className="hero"><div className="container grid-2 items-center gap-12"><div><p className="eyebrow">A practical IT partner for your clients</p><h1 className="display-title">Have a client who can’t pass the cyber application?</h1><p className="lead">IT Square helps independent medical and dental practices close IT gaps and document the work. We stay on the IT side. We never sell or place insurance.</p><div className="hero__actions"><a className="button button--primary" href="#refer-a-practice">Refer a practice <ArrowRight aria-hidden="true" /></a></div></div><aside className="price-card"><p className="eyebrow">Your client relationship stays yours</p><h2 className="mt-4 text-2xl font-semibold text-foreground">Clear handoffs. Clear boundaries.</h2><ul className="checklist mt-6"><li><Check aria-hidden="true" />The practice chooses whether to work with us.</li><li><Check aria-hidden="true" />We handle IT controls and documentation, not insurance.</li><li><Check aria-hidden="true" />With the practice’s permission, we keep you informed on IT progress.</li><li><Check aria-hidden="true" />The practice decides what to share with its insurer.</li></ul></aside></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Who we work with</p><h2 className="section-title">Partners who support independent practices</h2><p className="body-copy mt-4">When a client needs help answering an application or organizing IT safeguards, we can take on the technical side.</p></div><ul className="checklist">{partners.map((partner) => <li key={partner}><ArrowRight aria-hidden="true" />{partner}</li>)}</ul></div></section>

    <section className="section"><div className="container"><div className="section-intro"><div><p className="eyebrow">A straightforward referral path</p><h2 className="section-title">How referrals work</h2></div><p>We keep the practice in control of its information and its decisions at every step.</p></div><div className="grid-3">{steps.map((step, index) => <article className="numbered-step" key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>

    <section className="section section--soft" id="refer-a-practice"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Practice referral</p><h2 className="section-title">Tell us what they need.</h2><p className="body-copy mt-4">Share only business contact details. Please do not include patient names, health information, or any other patient data.</p><p className="body-copy mt-4">The form opens your email app and does not send or store information on this website.</p></div><div className="price-card"><PartnerReferralForm /></div></div></section>
  </main>
}
