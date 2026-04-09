import { CheckCircle } from "lucide-react"

const features = [
  {
    title: "Learns from your company",
    description: "Connect Google Docs, Notion, or Confluence. ITSquare learns your specific solutions and policies.",
  },
  {
    title: "Remembers past fixes",
    description: "Every resolved issue becomes knowledge. Next time someone has the same problem, instant answer.",
  },
  {
    title: "Smart human handoff",
    description: "When AI cannot solve it, ITSquare finds the colleague who fixed this before and schedules a call.",
  },
  {
    title: "Works where you work",
    description: "Native Slack integration. No new tools to learn. No context switching. Just type and get help.",
  },
]

export function ComplianceSection() {
  return (
    <section id="features" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-balance">
          More than a chatbot.
        </h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((item, index) => (
          <div key={index} className="flex gap-4 p-6 bg-surface-container-low ghost-border">
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-foreground-variant text-sm">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
