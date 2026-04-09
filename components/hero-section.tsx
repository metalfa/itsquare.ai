import Link from "next/link"
import { ArrowRight, MessageSquare } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative px-8 pt-32 pb-48 max-w-7xl mx-auto overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-secondary-container/5 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-4xl">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 bg-surface-container-high ghost-border">
          <MessageSquare className="w-3 h-3 text-primary" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-foreground-variant">
            Works in Slack
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8 text-foreground text-balance">
          IT support that actually{" "}
          <span className="text-primary-container">helps.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-foreground-variant leading-relaxed max-w-2xl mb-6">
          Your employees describe their tech problems in Slack. Our AI solves them instantly. No tickets. No waiting. No frustration.
        </p>
        
        {/* Social Proof */}
        <p className="text-sm text-foreground-variant/70 mb-12">
          Start free. Upgrade when you love it.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/sign-up"
            className="bg-primary-container text-white px-8 py-4 text-md font-bold hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            Add to Slack - Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link 
            href="#demo"
            className="ghost-border text-foreground px-8 py-4 text-md font-medium hover:bg-surface-container-highest transition-all duration-300 text-center"
          >
            See it in action
          </Link>
        </div>
      </div>
    </section>
  )
}
