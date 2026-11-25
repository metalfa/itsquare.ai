import type { Metadata } from "next"
import { Mail, MapPin, Phone } from "lucide-react"
import { ContactForm } from "@/components/contact-forms"
import { BreadcrumbJsonLd, BookCallLink, CalendlyEmbed } from "@/components/site-elements"

export const metadata: Metadata = {
  title: "Contact IT Square in Chicago",
  description: "Contact IT Square about healthcare IT, cyber insurance readiness, or a HIPAA Risk Assessment for your medical or dental practice.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]} />
    <section className="hero"><div className="container"><p className="eyebrow">Chicago, Illinois</p><h1 className="display-title">Let’s talk about your practice.</h1><p className="lead">Share what you need help with or choose a time for a short call. We reply within one business day.</p></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Send a note</p><h2 className="section-title">What would you like to solve?</h2><p className="body-copy mt-4">Please do not include patient health information. The form opens your email app; it does not send or store your details on this website.</p><div className="mt-8"><ContactForm /></div><div className="mt-10 flex flex-col gap-4 text-sm text-muted-foreground"><a className="inline-flex items-center gap-3" href="mailto:bensassi.faysel@itsquare.ai"><Mail aria-hidden="true" className="size-4 text-primary" />bensassi.faysel@itsquare.ai</a><a className="inline-flex items-center gap-3" href="tel:+17738373043"><Phone aria-hidden="true" className="size-4 text-primary" />(773) 837-3043</a><span className="inline-flex items-center gap-3"><MapPin aria-hidden="true" className="size-4 text-primary" />Chicago, IL and nearby suburbs</span></div></div><div><p className="eyebrow">Prefer to choose a time?</p><h2 className="section-title">Book a 15-minute call</h2><p className="body-copy mt-4">Tell us about your practice and what you are looking for. The booking form is provided by Calendly.</p><div className="mt-5"><BookCallLink /></div><div className="mt-7"><CalendlyEmbed /></div></div></div></section>
  </main>
}
