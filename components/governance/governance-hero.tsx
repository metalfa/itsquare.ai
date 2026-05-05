import Link from "next/link"
import { ShieldAlert, ArrowRight } from "lucide-react"

export function GovernanceHero() {
  return (
    <section className="relative px-8 pt-32 pb-24 max-w-7xl mx-auto overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-secondary-container/5 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-4xl">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-surface-container-high ghost-border">
          <ShieldAlert className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-variant">
            AI Governance Services
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8 text-foreground text-balance">
          Your AI agents are{" "}
          <span className="text-primary-container">ungoverned.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-foreground-variant leading-relaxed max-w-2xl mb-6">
          80% of organizations have encountered risky behavior from AI agents. 
          We help mid-size companies build AI governance in 3-6 weeks — before regulators and customers start asking questions you can&apos;t answer.
        </p>

        {/* Social Proof */}
        <p className="text-sm text-foreground-variant/70 mb-12">
          Enterprise-grade governance at mid-market prices. From $3,500.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            className="bg-primary-container text-white px-8 py-4 text-md font-bold hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Book a Discovery Call
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#tiers"
            className="ghost-border text-foreground px-8 py-4 text-md font-medium hover:bg-surface-container-highest transition-all duration-300 text-center"
          >
            See Service Tiers
          </Link>
        </div>
      </div>
    </section>
  )
}
