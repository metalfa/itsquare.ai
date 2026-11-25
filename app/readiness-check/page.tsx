import type { Metadata } from "next"
import { BreadcrumbJsonLd } from "@/components/site-elements"
import { ReadinessCheck } from "@/components/readiness-check"

export const metadata: Metadata = {
  title: "Free Practice Readiness Check",
  description: "Answer 12 questions about security, HIPAA, and AI use. See your score and three practical next steps without sharing your email.",
  alternates: { canonical: "/readiness-check" },
  openGraph: { title: "Free Practice Readiness Check | ITSquare.ai", description: "A private 12-question self-check for medical and dental practices. No email required to see your result.", images: ["/og-image.png"] },
}

export default function ReadinessCheckPage() {
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Readiness Check", href: "/readiness-check" }]} />
    <section className="hero"><div className="container"><p className="eyebrow">Free · No login · No email required</p><h1 className="display-title">How ready is your practice today?</h1><p className="lead">Answer 12 questions about insurance and security, HIPAA, and AI use. See your score and three practical fixes right away.</p><p className="body-copy mt-4">This self-check is a starting point, not a compliance determination. Please do not enter patient information.</p></div></section>
    <section className="section section--soft"><div className="container container--narrow"><ReadinessCheck /></div></section>
  </main>
}
