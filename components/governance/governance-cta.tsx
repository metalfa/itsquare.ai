import Link from "next/link"

export function GovernanceCTA() {
  return (
    <section className="px-8 py-32 max-w-7xl mx-auto">
      <div className="relative bg-surface-container-high p-12 md:p-24 ghost-border border-l-4 border-l-primary-container electric-glow">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6 text-balance">
            &ldquo;How do you govern AI?&rdquo;
          </h2>
          <p className="text-foreground-variant mb-4 text-lg">
            Next time a customer, auditor, or regulator asks — you&apos;ll have an answer.
          </p>
          <p className="text-foreground-variant mb-10 text-sm">
            The EU AI Act is in effect. NIST AI RMF is becoming a procurement requirement. 
            Companies that sell to healthcare, finance, and EU customers are getting hit with 
            vendor questionnaires they can&apos;t answer. Don&apos;t be one of them.
          </p>
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            className="inline-block bg-primary-container text-white px-8 py-4 text-md font-bold hover:scale-[0.98] transition-transform duration-300"
          >
            Book a 15-Minute Discovery Call
          </Link>
          <p className="mt-6 text-xs font-mono text-outline uppercase tracking-widest">
            No commitment. We&apos;ll tell you if you actually need this.
          </p>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-primary-container/20 p-4 hidden md:block">
          <span className="text-[8px] font-mono text-primary-container/30 uppercase">
            Govern • Detect • Resolve
          </span>
        </div>
      </div>
    </section>
  )
}
