const stats = [
  {
    value: "80%",
    source: "Gartner / McKinsey",
    description: "of organizations have encountered risky behavior from AI agents",
  },
  {
    value: "40%",
    source: "Gartner 2025",
    description: "of agentic AI projects will be canceled by 2027 due to governance failures",
  },
  {
    value: "$4.4M",
    source: "IBM 2024",
    description: "average cost of a data breach — AI governance reduces exposure by up to 45%",
  },
]

export function GovernanceStats() {
  return (
    <section className="px-8 py-24 bg-surface-container-lowest/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-8 bg-surface-container-low ghost-border border-l-2 border-l-primary-container electric-glow"
            >
              <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
              <p className="text-sm text-foreground-variant leading-relaxed mb-3">
                {stat.description}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-foreground-variant/50 font-mono">
                Source: {stat.source}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Can you answer &ldquo;How do you govern AI?&rdquo; on your next vendor questionnaire?
          </h2>
          <p className="text-foreground-variant mt-3">Most companies can&apos;t. We fix that in 3-6 weeks.</p>
        </div>
      </div>
    </section>
  )
}
