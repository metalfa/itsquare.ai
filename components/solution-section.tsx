import { MessageSquare, Zap, Users } from "lucide-react"

const solutions = [
  {
    icon: MessageSquare,
    title: "Just describe the problem",
    description:
      "WiFi not working? Printer jammed? VPN issues? Just tell ITSquare in plain English. No forms, no tickets, no waiting.",
  },
  {
    icon: Zap,
    title: "Get instant solutions",
    description:
      "AI diagnoses the issue and walks you through the fix step-by-step. Most problems solved in under 2 minutes.",
  },
  {
    icon: Users,
    title: "Escalate when needed",
    description:
      "If AI cannot solve it, ITSquare finds the right person who fixed this before and schedules a call automatically.",
  },
]

export function SolutionSection() {
  return (
    <section id="solutions" className="px-8 py-32 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="mb-20">
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-balance">
          IT support that feels like magic.
        </h2>
        <div className="h-1 w-24 bg-primary-container" />
      </div>

      {/* Solution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {solutions.map((solution, index) => {
          const Icon = solution.icon
          return (
            <div key={index} className="space-y-6">
              <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center border border-primary-container/30">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{solution.title}</h3>
              <p className="text-foreground-variant text-sm leading-relaxed">
                {solution.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
