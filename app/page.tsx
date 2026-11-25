import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, ClipboardCheck, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react"
import { BookCallLink, FAQList, JsonLd, ReadinessCheckLink } from "@/components/site-elements"
import { blogPosts } from "@/lib/blog-posts"
import { assessmentRiskReversal, businessSchema, controls, foundingPracticeSpotsRemaining, homeFaqs } from "@/lib/site-content"

export const metadata = {
  title: "Safe IT and AI for Chicago Medical & Dental Practices",
  description: "Protect patient information, prepare for cyber insurance questions, and use AI with clear rules. One accountable IT partner for independent practices.",
  alternates: { canonical: "/" },
  openGraph: { title: "Safe IT and AI for Chicago Medical & Dental Practices | ITSquare.ai", description: "Security, HIPAA readiness, and safe AI for independent practices. One accountable person in Chicago.", images: ["/og-image.png"] },
}

const concerns = [
  { quote: "Our cyber insurance renewal asks about MFA and EDR. I don’t know what to say.", answer: "We put the controls in place and give you the answers in writing." },
  { quote: "Half my staff uses ChatGPT. I have no idea what they paste into it.", answer: "We set up approved AI tools and simple rules your team can follow." },
  { quote: "We signed something about HIPAA years ago.", answer: "We run the written risk analysis HIPAA requires and keep it current." },
  { quote: "If our system goes down, we can’t see patients.", answer: "We test your backups so you know what can be restored." },
]

const steps = [
  { title: "Free Readiness Check", time: "5 minutes", text: "Answer 12 questions and see your score and three practical next steps. No email required." },
  { title: "15-minute call", time: "No commitment", text: "Tell us how the practice works and what you need to solve." },
  { title: "Assessment and plan", time: "Written scope", text: "Get a documented review, ranked gaps, and a clear plan before deciding what comes next." },
]

const pillars = [
  { title: "Insurable", description: "Five safeguards insurers often ask about, put in place and documented.", bullets: ["Multi-factor sign-in", "24/7 monitored security software", "Tested backups and an incident response plan"], href: "/healthcare", label: "Explore healthcare IT" },
  { title: "HIPAA-ready", description: "A written risk analysis and a practical way to keep it current.", bullets: ["Written risk analysis", "Policies and staff guidance", "Yearly refresh in the monthly plan"], href: "/risk-assessment", label: "See the assessment" },
  { title: "Safe AI", description: "Useful AI tools with clear boundaries around patient information.", bullets: ["Approved tools with a BAA where needed", "Staff rules and practical training", "Block risky uses; draft and summarize without exposing patient data"], href: "/safe-ai", label: "See safe-AI support" },
]

const sampleStats = [
  { label: "Readiness score", value: "6 / 12" },
  { label: "MFA", value: "On for 9 of 12 accounts" },
  { label: "AI tools", value: "2 unapproved" },
  { label: "Backups", value: "Last tested 14 days ago" },
]

export default function HomePage() {
  const latestPosts = blogPosts.slice(0, 3)
  return <main className="page-shell">
    <JsonLd data={businessSchema} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: homeFaqs.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) }} />

    <section className="hero">
      <div className="container hero-grid">
        <div className="hero__content">
          <p className="eyebrow">IT, security and safe AI for Chicago medical and dental practices</p>
          <h1 className="display-title">Your practice already uses AI. Make sure it&apos;s safe, insurable and HIPAA-ready.</h1>
          <p className="lead">ITSquare.ai sets up the security insurers ask about, puts guardrails around the AI tools your team uses, and documents the work for HIPAA. Modern tools. One accountable person.</p>
          <div className="hero__actions">
            <ReadinessCheckLink className="button--primary" />
            <BookCallLink className="button--secondary" />
          </div>
          <p className="source-line">81% of physicians now use AI in their practice, up from 38% in 2023. <span>Source: American Medical Association, 2026 Physician Survey on Augmented Intelligence.</span></p>
          <div className="trust-line"><span>Chicago-based</span><span>Onsite in Chicagoland</span><span>Remote nationwide</span></div>
        </div>
        <aside className="sample-dashboard" aria-label="Sample practice readiness dashboard">
          <div className="sample-dashboard__header"><div><span className="sample-label">Sample</span><h2>Practice readiness</h2></div><span className="sample-dashboard__dot" aria-hidden="true" /></div>
          <div className="sample-dashboard__score"><span>Readiness score</span><strong>6<span> / 12</span></strong><div className="score-track"><span /></div></div>
          <div className="sample-dashboard__stats">{sampleStats.slice(1).map(({ label, value }) => <div className="sample-dashboard__stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <p className="sample-dashboard__note">Illustrative values only. This is not a real practice assessment.</p>
        </aside>
      </div>
    </section>

    <section className="section section--soft" aria-labelledby="familiar-heading">
      <div className="container">
        <div className="section-intro"><div><p className="eyebrow">For the person keeping the practice moving</p><h2 className="section-title" id="familiar-heading">Sound familiar?</h2></div><p>These are normal questions to have. Each one has a practical next step.</p></div>
        <div className="grid-2">{concerns.map(({ quote, answer }) => <article className="quote-card" key={quote}><blockquote>“{quote}”</blockquote><p>{answer}</p></article>)}</div>
      </div>
    </section>

    <section className="section" id="what-we-cover">
      <div className="container">
        <div className="section-intro"><div><p className="eyebrow">Three parts of a safer practice</p><h2 className="section-title">Clear controls. Clear ownership.</h2></div><p>AI helps us work faster. A person reviews anything that could affect patients or data. Faycal answers for the result.</p></div>
        <div className="grid-3">{pillars.map((pillar) => <article className="pillar-card" key={pillar.title}><span className="card-label">{pillar.title}</span><h3>{pillar.title}</h3><p>{pillar.description}</p><ul>{pillar.bullets.map((bullet) => <li key={bullet}><Check aria-hidden="true" />{bullet}</li>)}</ul><Link className="post-card__link" href={pillar.href}>{pillar.label}<ArrowRight aria-hidden="true" /></Link></article>)}</div>
        <p className="source-line source-line--plain">A written HIPAA risk analysis is required under the current HIPAA Security Rule. <span>Source: 45 CFR 164.308(a)(1)(ii)(A).</span></p>
      </div>
    </section>

    <section className="section section--soft">
      <div className="container ai-review-band"><div><p className="eyebrow">How we work with AI</p><h2 className="section-title">Useful tools. Human accountability.</h2></div><ul><li>AI watches systems around the clock.</li><li>A person reviews anything that touches patients or data.</li><li>Faycal answers for the result.</li></ul></div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-intro"><div><p className="eyebrow">Start small</p><h2 className="section-title">How it works</h2></div><p>See where things stand first. Decide whether to go further after a short conversation.</p></div>
        <div className="grid-3">{steps.map((step, index) => <article className="numbered-step" key={step.title}><span>0{index + 1} · {step.time}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </div>
    </section>

    <section className="section section--soft" id="risk-assessment">
      <div className="container">
        <div className="offer-card">
          <div className="offer-card__intro"><p className="eyebrow">A clear first paid step</p><h2 className="section-title">HIPAA &amp; AI Risk Assessment</h2><p className="price">From $1,500</p><p className="body-copy">$1,500 for practices with fewer than 10 staff; up to $3,000 for larger practices. If you continue within 30 days, the assessment fee is credited toward onboarding.</p><p className="assessment-promise">{assessmentRiskReversal}</p><p className="edit-note">Owner review: confirm this risk-reversal wording before publication.</p><div className="hero__actions"><BookCallLink /><ReadinessCheckLink /></div></div>
          <div className="offer-card__details"><span className="sample-label">What you receive</span><ul className="checklist"><li><FileCheck2 aria-hidden="true" />Written HIPAA risk analysis</li><li><ClipboardCheck aria-hidden="true" />Ranked list of security gaps</li><li><ShieldCheck aria-hidden="true" />Answers for your insurance questionnaire</li><li><LockKeyhole aria-hidden="true" />Your practice&apos;s AI rules and a fixed-price plan</li></ul><Link href="/risk-assessment" className="inline-link">View a sample report <ArrowRight aria-hidden="true" /></Link><div className="report-sample report-sample--compact" aria-label="Sample report preview"><div className="report-sample__header"><strong>Practice review</strong><span className="sample-label">Sample</span></div><div className="report-sample__body"><p className="report-sample__row"><strong>Sign-in safeguards</strong><span>Review</span></p><p className="report-sample__row"><strong>Backup restore test</strong><span>Document</span></p><p className="report-sample__row"><strong>AI use rules</strong><span>Set up</span></p><p className="report-sample__watermark">Illustrative excerpt. No practice data shown.</p></div></div></div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="container founding-card"><div><p className="eyebrow">A small first cohort</p><h2 className="section-title">Founding Practices</h2><p className="body-copy mt-4">We&apos;re taking on our first five founding practices. They get founding-rate pricing locked for two years in exchange for honest feedback and, if they&apos;re happy, a short case study.</p><p className="edit-note">The spots value is editable by the owner.</p></div><div className="founding-card__count"><strong>{foundingPracticeSpotsRemaining}</strong><span>founding-practice spots remaining</span></div></div>
    </section>

    <section className="section section--soft">
      <div className="container founder-card">
        <Image className="founder-photo" src="/faycal-ben-sassi.png" alt="Faycal Ben Sassi, founder of ITSquare.ai" width={1200} height={1650} priority sizes="(max-width: 767px) 100vw, 210px" />
        <div><p className="eyebrow">Chicago, Illinois</p><h2 className="section-title">Faycal Ben Sassi, founder</h2><p className="body-copy mt-4">Faycal has 15 years of hands-on IT experience as an independent contractor, working across networks, cabling, systems, and field support. He holds the AWS Certified Cloud Practitioner credential and the Google Cybersecurity Professional Certificate. He also builds automation and AI monitoring tools for practice operations.</p><blockquote className="founder-note">“I started ITSquare.ai because independent practices deserve the same security big hospitals have, explained in plain English, by someone who picks up the phone.”</blockquote><BookCallLink /></div>
      </div>
    </section>

    <section className="section">
      <div className="container partner-strip"><div><p className="eyebrow">For insurance brokers, practice brokers and MSPs</p><h2>Need an IT partner for a practice?</h2><p>Send us a practice that needs help, or bring us in under your brand for Chicago onsite work and remote Microsoft 365, Intune, or security projects.</p></div><Link href="/partners" className="button button--secondary">For Partners <ArrowRight aria-hidden="true" /></Link></div>
    </section>

    <section className="section section--soft">
      <div className="container"><div className="section-intro"><div><p className="eyebrow">Good questions, clear answers</p><h2 className="section-title">Before we talk</h2></div><p>Plain answers on location, scope, AI, and what happens next.</p></div><FAQList items={homeFaqs} /></div>
    </section>

    <section className="section"><div className="container cta-band"><div><p className="eyebrow">A useful first step, no email required</p><h2>Know where your practice stands in 5 minutes.</h2><p>Get your score and three practical fixes on screen.</p></div><div className="flex flex-wrap gap-3"><ReadinessCheckLink className="button--primary" /><BookCallLink className="button--secondary" /></div></div></section>

    <section className="section section--soft"><div className="container"><div className="section-intro"><div><p className="eyebrow">Written for busy teams</p><h2 className="section-title">Recent insights</h2></div><Link href="/blog" className="font-semibold text-primary">All insights <ArrowRight aria-hidden="true" className="ml-1 inline size-4" /></Link></div><div className="grid-3">{latestPosts.map((post) => <article className="post-card" key={post.slug}><div className="post-meta"><span>{post.category}</span><span>{post.date}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><p className="mt-auto text-xs font-medium text-muted-foreground">By Faycal Ben Sassi</p><Link className="post-card__link mt-4" href={`/blog/${post.slug}`}>Read the guide <ArrowRight aria-hidden="true" /></Link></article>)}</div></div></section>
  </main>
}
