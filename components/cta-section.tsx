import Link from "next/link"

export function CTASection() {
  return (
    <section id="case-studies" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="relative bg-surface-container-high p-12 md:p-24 ghost-border border-l-4 border-l-secondary amber-glow">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-balance">
            Find out how much manual IT is costing you.
          </h2>
          <p className="text-foreground-variant mb-10 text-lg">
            Calculate the ROI of infrastructure automation for your specific team size
            and toolset.
          </p>
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary-container text-white px-8 py-4 text-md font-bold hover:scale-[0.98] transition-transform duration-300"
          >
            Book your free discovery call
          </Link>
          <p className="mt-6 text-xs font-mono text-outline uppercase tracking-widest">
            15 minutes. No commitment. Real numbers.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-secondary/20 p-4 hidden md:block">
          <span className="text-[8px] font-mono text-secondary/30 uppercase">
            Secure_Link::v4.2
          </span>
        </div>
      </div>
    </section>
  )
}
