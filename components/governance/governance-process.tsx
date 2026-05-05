import { Search, Shield, FileCheck, RefreshCw } from "lucide-react"

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Discover",
    description:
      "We find every AI tool, agent, and integration your employees are using — including the ones IT doesn't know about. Network analysis, surveys, stakeholder interviews.",
  },
  {
    icon: Shield,
    number: "02",
    title: "Govern",
    description:
      "We build real controls: approval workflows, access management, data classification, logging, monitoring. Not a PDF of policies — a working system.",
  },
  {
    icon: FileCheck,
    number: "03",
    title: "Audit",
    description:
      "We map your controls to EU AI Act, NIST AI RMF, ISO 42001, and SOC 2. Generate evidence packages. Run a mock audit. Remediate gaps before the real one.",
  },
  {
    icon: RefreshCw,
    number: "04",
    title: "Monitor",
    description:
      "AI tools change quarterly. New models, new shadow AI, new regulations. Our retainer keeps your governance current and your audit posture strong.",
  },
]

export function GovernanceProcess() {
  return (
    <section className="px-8 py-32 max-w-7xl mx-auto">
      <div className="mb-20">
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-balance">
          From shadow AI to full governance in weeks.
        </h2>
        <div className="h-1 w-24 bg-primary-container" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={index} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-container-high flex items-center justify-center border border-primary-container/30">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-mono text-primary-container uppercase tracking-widest">
                  Step {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-foreground-variant text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
