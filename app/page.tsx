import Link from "next/link"
import { ArrowUpRight, Check, ChevronRight, Cloud, Network, ShieldCheck } from "lucide-react"

const services = [
  { icon: ShieldCheck, title: "Security that gets used", text: "Practical controls, organized accounts, and clear next steps. No fear-based theater." },
  { icon: Cloud, title: "Microsoft 365, organized", text: "The right access for the right people, with onboarding and offboarding that actually gets done." },
  { icon: Network, title: "Support that follows through", text: "One accountable point of contact for the daily problems that steal your team’s attention." },
]

const steps = [
  ["01", "Talk through your situation", "We learn how your team works, what keeps going wrong, and what you want to improve."],
  ["02", "Agree on the work and cost", "You get a defined scope, responsibilities, and pricing before anything begins."],
  ["03", "Put a repeatable service in place", "We document your setup, address agreed priorities, and establish a service that holds up."],
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-3" aria-label="ITSquare home">
            <span className="logo-mark" aria-hidden="true"><span>IT</span></span>
            <span className="text-lg font-bold tracking-[-0.06em]">ITSquare<span className="text-primary">.AI</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex" aria-label="Main navigation">
            <a href="#services" className="transition-colors hover:text-foreground">What we do</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#about" className="transition-colors hover:text-foreground">About</a>
          </nav>
          <a href="mailto:bensassi.faysel@itsquare.ai" className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5">Start a conversation <ArrowUpRight className="size-4" /></a>
        </div>
      </header>

      <section className="hero-grid relative border-b border-border px-6 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Managed IT support for Chicago small businesses</p>
          <h1 className="display-heading mt-7 max-w-6xl">Intelligent<br />Infrastructure<br />Services for<br /><span className="gradient-type">People + Progress</span></h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_0.65fr] lg:items-end">
            <p className="max-w-2xl text-xl leading-8 text-muted-foreground lg:text-2xl">Your business needs your attention. Your IT shouldn&apos;t keep taking it. ITSquare helps Chicago small businesses manage everyday IT, protect employee accounts, and keep Microsoft 365 organized.</p>
            <div className="flex flex-col gap-4 lg:items-start"><a href="mailto:bensassi.faysel@itsquare.ai" className="group inline-flex w-fit items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">Book a 15-minute IT conversation <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a><span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">No pitch. Just a useful first conversation.</span></div>
          </div>
        </div>
        <div className="hero-orb" aria-hidden="true" />
      </section>

      <section className="border-b border-border px-6 py-20 lg:px-10 lg:py-28"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start"><div><p className="eyebrow">The honest version</p><h2 className="section-heading mt-5">You shouldn&apos;t have to become the office IT person.</h2></div><div className="max-w-xl text-lg leading-8 text-muted-foreground"><p>A login problem interrupts someone&apos;s morning. A new employee starts without the right access. A backup exists, but nobody knows whether it can restore your files.</p><p className="mt-6">Small issues add up—and you&apos;re left coordinating the fixes. We give you a clear point of contact for support, maintenance, and practical security improvements.</p><div className="mt-8 flex items-center gap-3 text-sm font-bold text-foreground"><span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span> Clear accountability, without the enterprise overhead.</div></div></div></section>

      <section id="services" className="bg-foreground px-6 py-20 text-background lg:px-10 lg:py-28"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow text-primary">What we do</p><h2 className="section-heading mt-5 max-w-3xl">Support for the way your team works.</h2></div><p className="max-w-sm text-sm leading-7 text-background/60">The useful stuff, handled consistently. No overloaded service list. No mystery box.</p></div><div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-background/20 bg-background/20 md:grid-cols-3">{services.map(({ icon: Icon, title, text }) => <article key={title} className="group bg-foreground p-8 transition-colors hover:bg-background/10 lg:p-10"><Icon className="size-7 text-primary" /><h3 className="mt-20 text-2xl font-bold tracking-tight">{title}</h3><p className="mt-4 text-sm leading-7 text-background/60">{text}</p><ChevronRight className="mt-8 size-5 text-primary transition-transform group-hover:translate-x-1" /></article>)}</div></div></section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28"><div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">Start with a clear picture</p><h2 className="section-heading mt-5">A straightforward way to get started.</h2><p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">Our paid Microsoft 365 &amp; IT Baseline Review examines your accounts, devices, access controls, and backup arrangements. You get prioritized findings, recommended next steps, and a clear proposal.</p><a href="mailto:bensassi.faysel@itsquare.ai" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Discuss a baseline review <ArrowUpRight className="size-4" /></a></div><div className="divide-y divide-border border-y border-border">{steps.map(([number, title, text]) => <div key={number} className="grid gap-4 py-7 sm:grid-cols-[60px_1fr]"><span className="font-mono text-sm text-primary">{number}</span><div><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{text}</p></div></div>)}</div></div></section>

      <section id="about" className="border-t border-border bg-primary px-6 py-20 text-primary-foreground lg:px-10 lg:py-28"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end"><div><p className="eyebrow text-primary-foreground/70">Meet Faycal, founder of ITSquare.</p><h2 className="section-heading mt-5 max-w-3xl">Technical enough to solve it. Human enough to explain it.</h2></div><div className="text-base leading-8 text-primary-foreground/80"><p>I&apos;m based in Chicago, and I enjoy solving technical problems—especially the recurring ones that waste people&apos;s time.</p><p className="mt-5">I started ITSquare to bring that approach to small businesses: understand the problem, explain the options clearly, and build a practical way to keep it from coming back.</p></div></div></section>

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-24"><div><p className="eyebrow">No hard sell</p><h2 className="section-heading mt-5 max-w-3xl">Let&apos;s talk about what your team needs.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Whether you&apos;re dealing with recurring problems or considering a change of provider, we can start with a short conversation.</p></div><a href="mailto:bensassi.faysel@itsquare.ai" className="inline-flex w-fit shrink-0 items-center gap-3 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5">Book a 15-minute IT conversation <ArrowUpRight className="size-4" /></a></section>
      <footer className="border-t border-border px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} ITSquare. Intelligent infrastructure for people with work to do.</span><a href="mailto:bensassi.faysel@itsquare.ai" className="transition-colors hover:text-foreground">bensassi.faysel@itsquare.ai</a></div></footer>
    </main>
  )
}

export function generateMetadata() { return { title: "ITSquare | Managed IT for Chicago small businesses", description: "Practical managed IT support, Microsoft 365 organization, and security improvements for Chicago small businesses." } }


