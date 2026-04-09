import Link from "next/link"

export function CTASection() {
  return (
    <section className="px-8 py-32 max-w-7xl mx-auto">
      <div className="relative bg-surface-container-high p-12 md:p-24 ghost-border border-l-4 border-l-primary-container electric-glow">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-balance">
            Stop wasting time on IT problems.
          </h2>
          <p className="text-foreground-variant mb-10 text-lg">
            Your team deserves instant IT support. Add ITSquare to Slack in 30 seconds and see the difference.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-block bg-primary-container text-white px-8 py-4 text-md font-bold hover:scale-[0.98] transition-transform duration-300"
          >
            Add to Slack - Free
          </Link>
          <p className="mt-6 text-xs font-mono text-outline uppercase tracking-widest">
            Free for up to 50 conversations/month. No credit card required.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-primary-container/20 p-4 hidden md:block">
          <span className="text-[8px] font-mono text-primary-container/30 uppercase">
            ITSquare.AI
          </span>
        </div>
      </div>
    </section>
  )
}
