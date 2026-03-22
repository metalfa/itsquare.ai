import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative px-8 pt-32 pb-48 max-w-7xl mx-auto overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-secondary-container/5 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-4xl">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-surface-container-high ghost-border">
          <span className="w-2 h-2 animate-pulse" style={{ backgroundColor: '#11c62b' }} />
          <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-variant">
            System Status: Active
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8 text-foreground">
          Your IT team spends 20 hours a week on work a machine can do in{" "}
          <span className="text-primary-container">20 seconds.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-foreground-variant leading-relaxed max-w-2xl mb-12">
          IT Square deploys AI agents that automate provisioning, access management, and
          compliance — on your infrastructure, under your control.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary-container text-white px-8 py-4 text-md font-bold hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Book a 15-min discovery call
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button className="ghost-border text-foreground px-8 py-4 text-md font-medium hover:bg-surface-container-highest transition-all duration-300">
            View Technical Docs
          </button>
        </div>
      </div>
    </section>
  )
}
