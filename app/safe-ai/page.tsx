import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Check, X } from "lucide-react"
import { BreadcrumbJsonLd, BookCallLink, ReadinessCheckLink } from "@/components/site-elements"

export const metadata: Metadata = {
  title: "Safe AI for Medical and Dental Practices",
  description: "Use AI tools with practical rules for patient information. ITSquare.ai helps practices approve tools, train staff, and block risky uses.",
  alternates: { canonical: "/safe-ai" },
  openGraph: { title: "Safe AI for Medical and Dental Practices | ITSquare.ai", description: "Practical safeguards for AI tools used by independent medical and dental practices.", images: ["/og-image.png"] },
}

const safeUses = ["Drafting a generic office checklist without patient details", "Summarizing public guidance or vendor documentation", "Writing a general staff announcement or meeting agenda"]
const protectedUses = ["Transcribing a patient visit or creating a clinical note", "Summarizing a patient record or referral", "Entering names, dates, images, or any information that identifies a patient"]
const setupItems = ["List the AI tools your team uses", "Approve tools and confirm a Business Associate Agreement (BAA) where needed", "Write plain rules for what staff may enter", "Train the team with everyday examples", "Block or restrict risky apps where the practice chooses", "Monitor use and review changes with a person accountable"]

export default function SafeAIPage() {
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Safe AI", href: "/safe-ai" }]} />
    <section className="hero"><div className="container"><p className="eyebrow">Practical AI rules for healthcare teams</p><h1 className="display-title">Use AI in your practice without putting patient data at risk.</h1><p className="lead">AI tools can help with everyday work. Your team needs approved tools, clear boundaries, and one person accountable for how they are used.</p><div className="hero__actions"><BookCallLink /><ReadinessCheckLink /></div><p className="source-line">81% of physicians now use AI in their practice, up from 38% in 2023. <span>Source: American Medical Association, 2026 Physician Survey on Augmented Intelligence.</span></p></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">What is happening</p><h2 className="section-title">People use the tool that is easy to open.</h2></div><div><p className="body-copy">A staff member may paste a question, dictate a note, or ask a chatbot to summarize a document. If the tool is not approved for patient information, that convenience can create a privacy problem.</p><p className="body-copy mt-4">Free and personal versions of AI chatbots do not come with a Business Associate Agreement. Patient information should not go into them.</p><p className="source-line">Patient privacy is physicians’ top concern about AI. <span>Source: American Medical Association, 2026 Physician Survey on Augmented Intelligence.</span></p></div></div></section>

    <section className="section"><div className="container"><div className="section-intro"><div><p className="eyebrow">A simple starting rule</p><h2 className="section-title">Separate general work from patient information.</h2></div><p>These examples are a starting point for practice rules. A tool and its settings must be reviewed before use with patient information.</p></div><div className="grid-2"><article className="ai-use-card ai-use-card--safe"><div className="ai-use-card__heading"><span className="ai-use-icon"><Check aria-hidden="true" /></span><div><h3>Without patient information</h3><p>General tasks that do not contain identifying details.</p></div></div><ul>{safeUses.map((use) => <li key={use}>{use}</li>)}</ul></article><article className="ai-use-card ai-use-card--protected"><div className="ai-use-card__heading"><span className="ai-use-icon"><X aria-hidden="true" /></span><div><h3>Needs an approved, BAA-covered tool</h3><p>Patient-specific work requires the right agreement and configuration.</p></div></div><ul>{protectedUses.map((use) => <li key={use}>{use}</li>)}</ul><p className="form-note">A Business Associate Agreement is a contract describing how a service provider protects health information.</p></article></div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">What ITSquare.ai sets up</p><h2 className="section-title">Rules your team can use on a busy day.</h2><p className="body-copy mt-5">AI helps us work faster. A person reviews anything that could affect patients or data. Faycal answers for the result.</p></div><ul className="checklist">{setupItems.map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul></div></section>

    <section className="section"><div className="container cta-band"><div><p className="eyebrow">A small first step</p><h2>Find out what your team already has in place.</h2><p>Take the free 12-question Readiness Check. No email required to see your result.</p></div><div className="flex flex-wrap gap-3"><ReadinessCheckLink /><BookCallLink /></div></div></section>
  </main>
}
