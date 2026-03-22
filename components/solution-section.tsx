import { UserPlus, KeyRound, ShieldCheck } from "lucide-react"

const solutions = [
  {
    icon: UserPlus,
    title: "Onboarding in 30 seconds",
    description:
      "AI provisions across Okta, Azure AD, AWS, Slack, M365 instantly. No tickets, no manual clicks, no human error.",
  },
  {
    icon: KeyRound,
    title: "Zero-gap offboarding",
    description:
      "Instant access revocation across all systems. Close security loopholes the second an employee leaves.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-ready always",
    description:
      "Automatic HIPAA, PCI, SOC 2 compliance trails. Every access change is logged, signed, and ready for auditors.",
  },
]

export function SolutionSection() {
  return (
    <section id="solutions" className="px-8 py-32 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="mb-20">
        <h2 className="text-4xl font-black tracking-tighter mb-4">
          We fix this in weeks, not months.
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
