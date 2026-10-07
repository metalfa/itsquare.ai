import Link from "next/link"
import { ArrowUpRight, Check, ChevronRight, Cloud, LockKeyhole, Network, Radio, ShieldCheck, Sparkles, Zap } from "lucide-react"

const services = [
  { icon: ShieldCheck, number: "01", title: "Cybersecurity", text: "A calm, always-on security layer that keeps your people, devices, and data protected." },
  { icon: Cloud, number: "02", title: "Cloud & infrastructure", text: "Modern foundations built for speed, resilience, and the way your team works now." },
  { icon: Network, number: "03", title: "Managed IT", text: "Strategic technology leadership and human support without the enterprise overhead." },
]

const stats = [
  ["24/7", "threat monitoring"],
  ["15 min", "average response"],
  ["99.9%", "network uptime"],
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="noise" />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-3" aria-label="ITSquare home">
            <span className="logo-mark" aria-hidden="true"><span>IT</span></span>
            <span className="text-lg font-semibold tracking-[-0.04em]">ITSquare<span className="text-primary">.AI</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
            <a href="#services" className="transition-colors hover:text-foreground">Services</a>
            <a href="#approach" className="transition-colors hover:text-foreground">Our approach</a>
            <a href="#about" className="transition-colors hover:text-foreground">About us</a>
          </nav>
          <a href="mailto:bensassi.faysel@itsquare.ai" className="hidden items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:border-primary hover:bg-primary/20 sm:flex">
            Start a conversation <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 lg:px-10 lg:pb-32 lg:pt-32">
        <div className="orb orb-one" /><div className="orb orb-two" />
        <div className="grid items-end gap-16 lg:grid-cols-[1.15fr_.85fr]">
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="live-dot" /> IT for people who have work to do
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-7xl lg:text-[6.8rem]">Good IT<br /><span className="text-primary">without the theater.</span></h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">Your business should not need a full-time IT department to get excellent technology. We run the systems, protect the work, and tell you the truth when something needs fixing.</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="mailto:bensassi.faysel@itsquare.ai" className="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Talk to an expert <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
              <a href="#services" className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Explore our services <ChevronRight className="size-4" /></a>
            </div>
          </div>
          <div className="relative hidden min-h-[390px] lg:block" aria-label="Live infrastructure status">
            <div className="tech-panel absolute inset-0 rounded-3xl border border-border bg-card/60 p-6 shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between border-b border-border pb-5"><div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Radio className="size-3 text-primary" /> LIVE SYSTEMS VIEW</div><span className="text-xs text-primary">ALL OPERATIONAL</span></div>
              <div className="grid h-[250px] place-items-center"><div className="radar"><span /><span /><span /><div className="radar-core"><Zap className="size-5" /></div></div></div>
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-5">{stats.map(([value, label]) => <div key={label}><div className="text-xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="border-y border-border bg-card/30 px-6 py-24 lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="eyebrow">What we do</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">The team behind<br /><span className="text-muted-foreground">your best work.</span></h2></div><p className="max-w-xs text-sm leading-6 text-muted-foreground">Deep expertise, clear communication, and a little bit of magic in every system we touch.</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">{services.map(({ icon: Icon, number, title, text }) => <article key={title} className="group bg-background p-8 transition-colors hover:bg-primary/[0.06] lg:p-10"><div className="flex items-start justify-between"><Icon className="size-6 text-primary" /><span className="font-mono text-xs text-muted-foreground">{number}</span></div><h3 className="mt-20 text-2xl font-semibold tracking-tight">{title}</h3><p className="mt-4 text-sm leading-7 text-muted-foreground">{text}</p><div className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">Learn more <ArrowUpRight className="size-3" /></div></article>)}</div></div></section>

      <section id="approach" className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-32"><div><p className="eyebrow">A better way forward</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">Less firefighting.<br /><span className="text-primary">More creating.</span></h2></div><div className="grid gap-8 sm:grid-cols-2"><div className="border-t border-border pt-5"><Sparkles className="size-5 text-primary" /><h3 className="mt-8 text-xl font-semibold">Human by default</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">No ticket mazes. No jargon. Just smart people who know your business and pick up the phone.</p></div><div className="border-t border-border pt-5"><LockKeyhole className="size-5 text-primary" /><h3 className="mt-8 text-xl font-semibold">Proactive by design</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">We spot the signal before it becomes a problem, turning technology from a cost center into momentum.</p></div></div></section>

      <section id="about" className="relative overflow-hidden border-t border-border bg-primary px-6 py-24 text-primary-foreground lg:px-10 lg:py-28"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-end"><div><p className="eyebrow text-primary-foreground/70">Ready when you are</p><h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.06em] sm:text-6xl">Bring us your<br />hardest problem.</h2></div><a href="mailto:bensassi.faysel@itsquare.ai" className="inline-flex items-center gap-3 rounded-full bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5">Let&apos;s talk <ArrowUpRight className="size-4" /></a></div></section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10"><span>© {new Date().getFullYear()} ITSquare. IT for people who have work to do.</span><div className="flex items-center gap-5"><span className="inline-flex items-center gap-2"><Check className="size-3 text-primary" /> Secure by design</span><a href="mailto:bensassi.faysel@itsquare.ai" className="transition-colors hover:text-foreground">bensassi.faysel@itsquare.ai</a></div></footer>
    </main>
  )
}

export function generateMetadata() { return { title: "ITSquare | Your unfair tech advantage", description: "Managed IT, cybersecurity, and cloud expertise for ambitious businesses." } }
