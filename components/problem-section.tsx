const problemStats = [
  {
    value: "4.2 hrs",
    description: "Average time employees lose per week to IT issues",
  },
  {
    value: "67%",
    description: "Of IT tickets are repeat questions with known solutions",
  },
  {
    value: "$127",
    description: "Average cost per IT support ticket (Gartner)",
  },
]

export function ProblemSection() {
  return (
    <section className="px-8 py-24 bg-surface-container-lowest/50">
      <div className="max-w-7xl mx-auto">
        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {problemStats.map((stat, index) => (
            <div
              key={index}
              className="p-8 bg-surface-container-low ghost-border border-l-2 border-l-primary-container electric-glow"
            >
              <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
              <p className="text-sm text-foreground-variant leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Question */}
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            What if IT support just... worked?
          </h2>
        </div>
      </div>
    </section>
  )
}
