import type { Metadata } from "next"
import Image from "next/image"
import { ArrowRight, Award, MapPin, Wrench } from "lucide-react"
import { BreadcrumbJsonLd, BookCallLink, JsonLd } from "@/components/site-elements"

export const metadata: Metadata = {
  title: "About Faycal Ben Sassi and IT Square",
  description: "Meet Faycal Ben Sassi, Chicago-based founder of IT Square, with 15 years of hands-on IT experience supporting independent medical and dental practices.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "About", href: "/about" }]} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", name: "About IT Square", url: "https://itsquare.ai/about", mainEntity: { "@type": "Person", name: "Faycal Ben Sassi", jobTitle: "Founder", worksFor: { "@type": "Organization", name: "IT Square" } } }} />
    <section className="hero"><div className="container founder-card"><Image className="founder-photo" src="/faycal-ben-sassi.png" alt="Faycal Ben Sassi, founder of IT Square" width={1200} height={1650} priority sizes="(max-width: 767px) 100vw, 210px" /><div><p className="eyebrow">A Chicago IT partner</p><h1 className="display-title">Technology should be clear, useful, and accountable.</h1><p className="lead">IT Square was founded by Faycal Ben Sassi to bring practical IT support to independent medical and dental offices.</p></div></div></section>

    <section className="section section--soft"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">The founder</p><h2 className="section-title">Faycal Ben Sassi</h2><p className="body-copy mt-5">Faycal is based in Chicago and has 15 years of hands-on IT experience as an independent contractor. His work has included networking, cabling, systems, and field support.</p><p className="body-copy mt-4">He holds the AWS Certified Cloud Practitioner credential and the Google Cybersecurity Professional Certificate.</p></div><div className="grid-2"><article className="card"><Wrench aria-hidden="true" className="mb-5 size-6 text-primary" /><h3>Hands-on IT</h3><p>Networking, cabling, systems, and field support built from independent contracting work.</p></article><article className="card"><Award aria-hidden="true" className="mb-5 size-6 text-primary" /><h3>Credentials</h3><p>AWS Certified Cloud Practitioner and Google Cybersecurity Professional Certificate.</p></article><article className="card col-span-2"><MapPin aria-hidden="true" className="mb-5 size-6 text-primary" /><h3>Chicago and nearby suburbs</h3><p>Local onsite and remote support for independent medical and dental offices.</p></article></div></div></section>

    <section className="section"><div className="container grid-2 items-start gap-12"><div><p className="eyebrow">Why independent practices</p><h2 className="section-title">A practical focus</h2></div><div><p className="body-copy">Independent practices need reliable technology and clear answers, often without an internal IT team. IT Square focuses on making security work understandable, documented, and connected to the way the office operates.</p><p className="body-copy mt-4">The goal is straightforward: clear scope, written pricing, documented work, and plain-English updates.</p></div></div></section>

    <section className="section section--soft"><div className="container cta-band"><div><p className="eyebrow">Start with a conversation</p><h2>Talk through what your practice needs.</h2><p>No pressure to commit to ongoing service.</p></div><BookCallLink /></div></section>
  </main>
}
