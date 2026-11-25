import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, ClipboardCheck, FileCheck2, Handshake, LockKeyhole, ShieldCheck } from "lucide-react"
import { BookCallLink, FAQList, JsonLd, RiskAssessmentLink } from "@/components/site-elements"
import { blogPosts } from "@/lib/blog-posts"
import { businessSchema, controls, homeFaqs } from "@/lib/site-content"

export const metadata = {
  title: "Healthcare IT & Cybersecurity for Chicago Practices",
  description: "IT Square helps independent Chicago medical and dental practices prepare for cyber insurance, document HIPAA safeguards, and recover from IT problems.",
  alternates: { canonical: "/" },
}

const concerns = [
  { quote: "Our cyber insurance renewal asks about MFA and EDR, and I don’t know what to answer.", answer: "We explain the questions, review the controls, and help you document what is in place." },
  { quote: "We signed something about HIPAA years ago. I’m not sure we’re covered.", answer: "Start with a written risk analysis that shows your current gaps and what to address." },
  { quote: "If our system goes down, we can’t see patients.", answer: "We help test backups and write down the steps and contacts your team needs." },
  { quote: "Our office manager handles IT on top of everything else.", answer: "One accountable IT partner can take routine support and security work off their plate." },
]

const steps = [
  { title: "15-minute call", text: "Tell us how your practice works and what your insurer is asking for." },
  { title: "Risk assessment", text: "Get a written review, ranked gaps, insurance questionnaire support, and a fixed-price plan." },
  { title: "Ongoing protection", text: "Put agreed controls in place, keep them documented, and review them each month." },
]

export default function HomePage() {
  const latestPosts = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)
  return <main className="page-shell">
    <JsonLd data={businessSchema} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: homeFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }} />
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero__content">
          <p className="eyebrow">IT and cybersecurity for Chicago medical and dental offices</p>
          <h1 className="display-title">Pass your cyber insurance renewal. Prove HIPAA compliance. Stay open if you&apos;re attacked.</h1>
          <p className="lead">IT Square is the local IT partner for independent practices with 5 to 50 staff. We put the security controls insurers and HIPAA ask for in place, document them, and stay accountable every month.</p>
          <div className="hero__actions"><BookCallLink /><RiskAssessmentLink /></div>
          <div className="trust-line"><span>Based in Chicago</span><span>Onsite and remote support</span><span>Founder-led</span></div>
        </div>
        <aside className="hero-panel" aria-label="What IT Square helps your practice prepare">
          <div className="hero-panel__heading"><strong>Protection you can show on paper</strong><span>One accountable partner</span></div>
          {controls.map((control) => <div className="hero-panel__item" key={control.short}><small>{control.short}</small><strong>{control.title}</strong></div>)}
          <p className="hero-panel__note">A clear plan for security, records, and recovery. Insurance decisions remain with your insurer.</p>
        </aside>
      </div>
    </section>

    <section className="section section--soft" aria-labelledby="familiar-heading">
      <div className="container">
        <div className="section-intro"><div><p className="eyebrow">For the people running the practice</p><h2 className="section-title" id="familiar-heading">Sound familiar?</h2></div><p>These are everyday questions, not a reason to feel behind. There is a practical next step for each one.</p></div>
        <div className="grid-2">{concerns.map(({ quote, answer }) => <article className="quote-card" key={quote}><blockquote>“{quote}”</blockquote><p>{answer}</p></article>)}</div>
      </div>
    </section>

    <section className="section" id="controls">
      <div className="container">
        <div className="section-intro"><div><p className="eyebrow">Clear answers for renewal questions</p><h2 className="section-title">The five things insurers check</h2></div><p>These safeguards also help protect patient information and give your team a clearer plan.</p></div>
        <div className="grid-5">{controls.map(({ short, title, term, how }) => <article className="card" key={short}><span className="card-label">{short}</span><h3 className="mt-5">{title}</h3><p>{term}</p><p><strong className="text-foreground">How we handle it:</strong> {how}</p></article>)}</div>
        <Link href="/healthcare" className="inline-flex items-center gap-2 mt-8 font-semibold text-primary">See the full approach <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </div>
    </section>

    <section className="section section--soft">
      <div className="container">
        <div className="section-intro"><div><p className="eyebrow">A straightforward start</p><h2 className="section-title">How it works</h2></div><p>Start with a conversation. Decide what makes sense after you understand the findings.</p></div>
        <div className="grid-3">{steps.map((step, index) => <article className="numbered-step" key={step.title}><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="price-card grid-2 items-center gap-8">
          <div><p className="eyebrow">A clear first step</p><h2 className="section-title">HIPAA Risk Assessment</h2><p className="price">From $1,500</p><p className="body-copy mt-3">$1,500 for practices with fewer than 10 staff. Up to $3,000 for larger practices. Credited toward onboarding if you continue within 30 days.</p></div>
          <div><ul className="checklist"><li><FileCheck2 aria-hidden="true" /> Written HIPAA risk analysis</li><li><ClipboardCheck aria-hidden="true" /> Ranked list of security gaps</li><li><ShieldCheck aria-hidden="true" /> Cyber insurance questionnaire answers</li><li><LockKeyhole aria-hidden="true" /> Fixed-price plan to close the gaps</li></ul><div className="mt-7"><RiskAssessmentLink /></div></div>
        </div>
      </div>
    </section>

    <section className="section section--soft">
      <div className="container founder-card">
        <Image className="founder-photo" src="/faycal-ben-sassi.png" alt="Faycal Ben Sassi, founder of IT Square" width={1200} height={1650} priority sizes="(max-width: 767px) 100vw, 210px" />
        <div><p className="eyebrow">Local, hands-on experience</p><h2 className="section-title">Faycal Ben Sassi</h2><p className="body-copy mt-4">Faycal is based in Chicago and has 15 years of hands-on IT experience as an independent contractor, including networking, cabling, systems, and field support. He holds the AWS Certified Cloud Practitioner credential and the Google Cybersecurity Professional Certificate.</p><p className="body-copy mt-4">He focuses on independent practices because busy teams need practical IT support without having to translate every technical decision themselves. His aim is to make the work clear, documented, and accountable.</p><div className="hero__actions"><BookCallLink /></div></div>
      </div>
    </section>

    <section className="section">
      <div className="container cta-band"><div><p className="eyebrow">For insurance brokers and practice advisors</p><h2>Have a client who can’t meet cyber insurance requirements?</h2><p>We work on the IT side, close documented gaps, and return information the practice can share with its broker.</p></div><Link href="/partners" className="button button--primary">For Brokers &amp; Advisors <ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <section className="section section--soft">
      <div className="container"><div className="section-intro"><div><p className="eyebrow">Practical guidance</p><h2 className="section-title">Insights for busy teams</h2></div><Link href="/blog" className="font-semibold text-primary">Browse all insights <ArrowRight aria-hidden="true" className="ml-1 inline size-4" /></Link></div><div className="grid-3">{latestPosts.map((post) => <article className="post-card" key={post.slug}><div className="post-meta"><span>{post.category}</span><span>{post.date}</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><Link className="post-card__link" href={`/blog/${post.slug}`}>Read the guide <ArrowRight aria-hidden="true" /></Link></article>)}</div></div>
    </section>

    <section className="section">
      <div className="container grid-2 items-start gap-10"><div><p className="eyebrow">Good questions, clear answers</p><h2 className="section-title">Before we talk</h2><p className="body-copy mt-4">Not sure where to start? These are the questions practice owners ask first.</p></div><FAQList items={homeFaqs} /></div>
    </section>

    <section className="section section--soft"><div className="container cta-band"><div><p className="eyebrow">A calmer renewal starts with a clear picture</p><h2>Your next renewal shouldn’t be a scramble.</h2><p>Talk through your questions with a local IT partner. No pressure to commit to ongoing service.</p></div><BookCallLink /></div></section>
  </main>
}
