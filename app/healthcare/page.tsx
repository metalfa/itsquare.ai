import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUpRight,
  ClipboardCheck,
  FileCheck2,
  HeartPulse,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

const calendlyUrl = "https://calendly.com/bensassi-faysel/discovery-call"

export const metadata: Metadata = {
  title: "Healthcare IT & Cyber Insurance Readiness for Chicago Practices | IT Square",
  description:
    "IT Square helps Chicago medical and dental offices meet cyber insurance and HIPAA requirements: MFA, monitored security, tested backups, incident response and a HIPAA risk analysis.",
}

const controls = [
  {
    icon: LockKeyhole,
    title: "Multi-factor sign-in (MFA)",
    description:
      "A second check, like a phone prompt, before anyone gets into email or patient records.",
    handling:
      "We turn it on for every account and every system that touches patient data, and keep a record that it’s on.",
  },
  {
    icon: ShieldCheck,
    title: "Monitored security software (EDR)",
    description:
      "Security software on every computer, watched by a security team 24/7, not just basic antivirus.",
    handling:
      "We install and manage it, with a human security team watching around the clock.",
  },
  {
    icon: RefreshCw,
    title: "Tested backups",
    description:
      "Backups you’ve actually restored from, kept where ransomware can’t reach them.",
    handling:
      "We back up your systems and Microsoft 365 and test restores on a schedule.",
  },
  {
    icon: ClipboardCheck,
    title: "Incident response plan",
    description: "A written plan for who does what in the first hours of an attack.",
    handling: "We write it with you and walk your team through it.",
  },
  {
    icon: FileCheck2,
    title: "HIPAA risk analysis",
    description: "A written review of risks to patient data, required by HIPAA today.",
    handling:
      "We perform it, give you a ranked list of gaps, and update it every year.",
  },
]

const practiceTypes = [
  "Physician and specialty practices",
  "Dental offices",
  "Therapy and behavioral health practices",
  "Clinics with 5 to 50 staff",
  "Chicago and suburbs",
]

const steps = [
  {
    number: "01",
    title: "15-minute call",
    text: "We learn how your office runs and what your insurer is asking for.",
  },
  {
    number: "02",
    title: "Risk assessment",
    text: "We review your systems and give you a written gap list and plan.",
  },
  {
    number: "03",
    title: "Protection",
    text: "We put the controls in place, document them, and keep them running.",
  },
]

function CallButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  )
}

export default function HealthcarePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="noise" aria-hidden="true" />
      <div className="water-bg" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-3" aria-label="ITSquare home">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/facebook-profile-picture-720-iBgH7aH0uxAuY29fjVX2eyZjG5oS45.png"
              alt="ITSquare"
              className="size-10 rounded-lg object-cover"
            />
            <span className="text-lg font-semibold tracking-[-0.04em]">
              IT Square<span className="text-primary">.AI</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
            <Link href="/#services" className="transition-colors hover:text-foreground">Services</Link>
            <Link href="/#approach" className="transition-colors hover:text-foreground">Our approach</Link>
            <Link href="/#about" className="transition-colors hover:text-foreground">About us</Link>
            <Link href="/blog" className="transition-colors hover:text-foreground">Insights</Link>
            <Link href="/healthcare" aria-current="page" className="text-primary">Healthcare</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/healthcare" className="text-sm font-medium text-primary sm:hidden">Healthcare</Link>
            <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:border-primary hover:bg-primary/20 sm:flex">
              Start a conversation <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="orb orb-one" aria-hidden="true" />
        <div className="grid items-start gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-14">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <HeartPulse aria-hidden="true" className="size-3.5 text-primary" />
              Healthcare IT for Chicago practices
            </div>
            <h1 className="max-w-4xl text-[clamp(2.7rem,8vw,5rem)] font-semibold leading-[1.02] tracking-[-0.065em]">
              Pass your cyber insurance renewal. Prove HIPAA compliance. Stay open if you’re attacked.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              IT Square is a Chicago IT partner for medical and dental offices with 5 to 50 staff. We put the security controls in place that insurers and HIPAA ask for, document them, and stay accountable every month.
            </p>
            <div className="mt-9 flex flex-col items-stretch gap-3 min-[420px]:flex-row min-[420px]:items-center">
              <CallButton>Book a 15-minute call</CallButton>
              <a href="#insurer-checklist" className="inline-flex items-center justify-center gap-2 rounded-full px-3 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                See what insurers check <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>
          <aside className="relative z-10 rounded-3xl border border-border bg-card/70 p-6 shadow-2xl shadow-primary/5 sm:p-8" aria-label="Healthcare security at a glance">
            <p className="eyebrow">Prepared, documented, accountable</p>
            <p className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">Make your security work visible on paper.</p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">A practical partner for the controls insurers ask about and the patient-data safeguards HIPAA requires.</p>
            <div className="mt-7 flex flex-col gap-4 border-t border-border pt-6">
              {[
                "Controls put in place across your practice",
                "Written evidence for your records and insurer",
                "Ongoing help to keep systems running",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm leading-6">
                  <ShieldCheck aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section id="insurer-checklist" className="scroll-mt-20 border-y border-border bg-card/30 px-5 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl sm:mb-14">
            <p className="eyebrow">Coverage, made concrete</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">The 5 things your insurer will ask about</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Most cyber insurance applications for medical and dental practices now ask for these. Here&apos;s how we handle each one.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {controls.map(({ icon: Icon, title, description, handling }, index) => (
              <article key={title} className="rounded-2xl border border-border bg-background/80 p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <Icon aria-hidden="true" className="size-6 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                <p className="mt-5 border-t border-border pt-4 text-sm leading-6"><span className="font-semibold text-primary">How we handle it: </span>{handling}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:px-10 lg:py-28">
        <div>
          <p className="eyebrow">Who we work with</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">Built for independent practices</h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">A focused fit for local healthcare teams that need steady, accountable IT.</p>
        </div>
        <div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {practiceTypes.map((type) => (
              <li key={type} className="flex items-center gap-3 rounded-xl border border-border bg-card/45 px-4 py-4 text-sm font-medium">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />{type}
              </li>
            ))}
          </ul>
          <p className="mt-6 border-l-2 border-primary pl-4 text-sm leading-7 text-muted-foreground">If your IT is handled by an office manager, a relative, or nobody in particular, this is for you.</p>
        </div>
      </section>

      <section className="border-y border-border bg-card/30 px-5 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">A practical first step</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">Start with a HIPAA Risk Assessment</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">Start with a written view of your risks, what needs attention, and what it will take to address it.</p>
          </div>
          <div className="flex flex-col gap-4">
            <article className="rounded-3xl border border-primary/30 bg-background p-6 sm:p-8">
              <p className="eyebrow">HIPAA Risk Assessment</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">From $1,500</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">$1,500 for offices under 10 staff, up to $3,000 for larger practices. Credited toward onboarding if you continue with us within 30 days.</p>
              <h3 className="mt-7 text-sm font-semibold">What you get</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Written HIPAA risk analysis",
                  "Ranked list of security gaps",
                  "Answers for your cyber insurance questionnaire",
                  "A fixed-price plan to close the gaps",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-muted-foreground">
                    <ShieldCheck aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />{item}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-border bg-background/70 p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight">Ongoing protection: Protected Practice</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">A monthly per-user plan covering the 5 controls above, help desk, updates and a yearly risk analysis refresh. Pricing shared after the assessment.</p>
            </article>
            <div className="pt-2"><CallButton>Book a 15-minute call</CallButton></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:px-10 lg:py-28">
        <div>
          <p className="eyebrow">For insurance brokers and advisors</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">Have a client who can&apos;t pass the application?</h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">When a medical or dental practice gets stuck on MFA, EDR, backups or the HIPAA risk analysis, send them to us. We close the gaps and hand back documentation they can use for underwriting. We stay on the IT side and never touch the insurance.</p>
        </div>
        <a href="mailto:bensassi.faysel@itsquare.ai?subject=Practice%20referral" className="inline-flex items-center justify-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-6 py-3.5 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/20">
          Refer a practice <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </section>

      <section className="border-y border-border bg-card/30 px-5 py-20 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Clear steps, steady follow-through</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map(({ number, title, text }) => (
              <article key={number} className="border-t border-border pt-5">
                <span className="font-mono text-xs text-primary">{number}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border bg-primary px-5 py-16 text-primary-foreground sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <p className="eyebrow text-primary-foreground/70">A steadier renewal starts here</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">Your next renewal shouldn&apos;t be a scramble.</h2>
          </div>
          <a href={calendlyUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5">
            Book a 15-minute call <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-sm leading-6 text-primary-foreground/80">Faycal Ben Sassi, IT Square, Chicago · <a href="tel:+17738373043" className="underline-offset-4 hover:underline">(773) 837-3043</a> · <a href="mailto:bensassi.faysel@itsquare.ai" className="underline-offset-4 hover:underline">bensassi.faysel@itsquare.ai</a></p>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <span>© {new Date().getFullYear()} ITSquare. Practical IT support for Chicago small businesses.</span>
        <div className="flex items-center gap-5"><span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-3 text-primary" /> Clear by design</span><a href="mailto:bensassi.faysel@itsquare.ai" className="transition-colors hover:text-foreground">bensassi.faysel@itsquare.ai</a></div>
      </footer>
    </main>
  )
}
