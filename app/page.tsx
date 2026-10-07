import Link from "next/link"
import { ArrowUpRight, Check, ChevronRight, Cloud, LockKeyhole, Network, ShieldCheck, Sparkles, Users } from "lucide-react"

const services = [
  { icon: ShieldCheck, title: "Cyber resilience", text: "Always-on protection, detection, and response for the threats that matter." },
  { icon: Cloud, title: "Cloud operations", text: "Modernize, optimize, and run your cloud estate with confidence." },
  { icon: Network, title: "Network & workplace", text: "A reliable digital workplace that helps your people do their best work." },
  { icon: Sparkles, title: "AI-led operations", text: "Predictive insight and automation that turn IT from reactive to strategic." },
]

const outcomes = ["Reduce risk without slowing down", "Give your teams a better way to work", "Turn technology into a competitive advantage"]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-[-0.04em]">
            <span className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">IS</span>
            ITSquare<span className="text-primary">.AI</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
            <Link href="#services" className="transition-colors hover:text-foreground">Services</Link>
            <Link href="#approach" className="transition-colors hover:text-foreground">Our approach</Link>
            <Link href="#trust" className="transition-colors hover:text-foreground">Why ITSquare</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">Sign in</Link>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Talk to an expert <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(112,198,255,0.16),transparent_28%),linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.02)_50%,transparent_50%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-32">
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-primary"><span className="h-2 w-2 animate-pulse bg-primary" /> The intelligent IT partner</div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[6.7rem]">Technology that moves your business <span className="text-primary">forward.</span></h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">We combine human expertise, intelligent automation, and relentless security to make your technology a force for growth.</p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row"><Link href="/contact" className="inline-flex items-center justify-center gap-3 bg-primary px-6 py-4 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Start a conversation <ArrowUpRight className="h-5 w-5" /></Link><Link href="#services" className="inline-flex items-center justify-center gap-2 border border-border px-6 py-4 font-medium transition-colors hover:border-primary/50 hover:bg-muted">Explore our services <ChevronRight className="h-4 w-4" /></Link></div>
              <div className="mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6"><div><p className="text-2xl font-semibold tracking-tight">24/7</p><p className="mt-1 text-xs text-muted-foreground">Operational support</p></div><div><p className="text-2xl font-semibold tracking-tight">99.9%</p><p className="mt-1 text-xs text-muted-foreground">Service availability</p></div><div><p className="text-2xl font-semibold tracking-tight">1 team</p><p className="mt-1 text-xs text-muted-foreground">For your whole IT estate</p></div></div>
            </div>
            <div className="relative hidden min-h-[560px] lg:block"><div className="absolute right-0 top-10 h-[440px] w-[390px] border border-primary/30 bg-card/70 p-5 shadow-2xl shadow-primary/10"><div className="flex items-center justify-between border-b border-border pb-4 text-xs text-muted-foreground"><span>ITSQUARE / COMMAND CENTER</span><span className="flex items-center gap-2 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Live</span></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="col-span-2 border border-border bg-muted/40 p-5"><p className="text-xs uppercase tracking-widest text-muted-foreground">Risk posture</p><p className="mt-3 text-4xl font-semibold">Low</p><div className="mt-5 h-1 bg-emerald-400/30"><div className="h-1 w-[86%] bg-emerald-400" /></div></div><div className="border border-border bg-muted/40 p-4"><LockKeyhole className="h-5 w-5 text-primary" /><p className="mt-8 text-2xl font-semibold">0</p><p className="text-xs text-muted-foreground">Critical alerts</p></div><div className="border border-border bg-muted/40 p-4"><Users className="h-5 w-5 text-primary" /><p className="mt-8 text-2xl font-semibold">98%</p><p className="text-xs text-muted-foreground">Team availability</p></div></div><div className="mt-5 border border-border bg-muted/40 p-4"><div className="flex justify-between text-xs text-muted-foreground"><span>Autonomous actions</span><span>Last 24 hours</span></div><div className="mt-5 flex h-16 items-end gap-2">{[35,52,45,72,60,88,76,96,82,100,92].map((height, i) => <span key={i} className="flex-1 bg-primary/70" style={{ height: `${height}%` }} />)}</div></div></div><div className="absolute bottom-0 left-0 w-56 border border-border bg-background p-5 shadow-xl"><p className="text-xs uppercase tracking-widest text-muted-foreground">Your advantage</p><p className="mt-3 text-lg font-medium leading-snug">Less noise. More momentum.</p></div></div>
          </div>
        </section>

        <section id="trust" className="border-b border-border/70 bg-muted/25"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-8 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground lg:px-8"><span>Trusted to keep business moving</span><span>Financial services</span><span>Healthcare</span><span>Professional services</span><span>High growth teams</span></div></section>

        <section id="services" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"><div className="grid gap-16 lg:grid-cols-[.75fr_1.25fr]"><div><p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">What we do</p><h2 className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">The operating system for a healthier business.</h2><p className="mt-6 max-w-sm leading-7 text-muted-foreground">From the service desk to the boardroom, we make technology simpler, safer, and more useful.</p></div><div className="grid gap-px border border-border bg-border sm:grid-cols-2">{services.map(({icon: Icon, title, text}, index) => <article key={title} className="group bg-background p-7 transition-colors hover:bg-muted/60"><div className="flex items-start justify-between"><Icon className="h-6 w-6 text-primary" /><span className="text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="mt-16 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 leading-7 text-muted-foreground">{text}</p><ArrowUpRight className="mt-8 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" /></article>)}</div></div></section>

        <section id="approach" className="border-y border-border/70 bg-foreground text-background"><div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-28"><div><p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Our approach</p><h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">We do not manage technology. We enable ambition.</h2></div><div><p className="max-w-xl text-xl leading-9 text-background/70">The best MSPs are not invisible vendors. They are an extension of your leadership team: clear in a crisis, proactive every day, and accountable for outcomes.</p><ul className="mt-10 space-y-5">{outcomes.map((outcome) => <li key={outcome} className="flex items-center gap-4 border-t border-background/15 pt-5 font-medium"><Check className="h-5 w-5 text-primary" />{outcome}</li>)}</ul></div></div></section>

        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"><div className="border border-primary/30 bg-primary/10 p-8 sm:p-12 lg:flex lg:items-end lg:justify-between lg:p-16"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ready when you are</p><h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">Make your next move with a stronger IT foundation.</h2></div><Link href="/contact" className="mt-8 inline-flex shrink-0 items-center gap-3 bg-primary px-6 py-4 font-semibold text-primary-foreground lg:mt-0">Talk to an expert <ArrowUpRight className="h-5 w-5" /></Link></div></section>
      </main>
      <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="font-semibold text-foreground">ITSquare<span className="text-primary">.AI</span></p><p className="mt-2 text-xs">Intelligent IT. Human confidence.</p></div><div className="flex gap-6"><Link href="/security" className="hover:text-foreground">Security</Link><Link href="/privacy" className="hover:text-foreground">Privacy</Link><Link href="/contact" className="hover:text-foreground">Contact</Link></div><p className="text-xs">© 2026 ITSquare.AI</p></div></footer>
    </div>
  )
}
