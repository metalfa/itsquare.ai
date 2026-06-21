import { AlertTriangle, Info } from "lucide-react"

const disclosures = [
  {
    icon: AlertTriangle,
    title: "AI-generated answers may not always be accurate",
    description:
      "ITSquare.AI uses artificial intelligence to generate IT support answers directly inside Slack. AI responses can be incomplete or incorrect and should be reviewed and verified before you act on them. For critical issues, always confirm with a qualified member of your IT team.",
  },
  {
    icon: Info,
    title: "A paid Slack plan is required",
    description:
      "ITSquare.AI is built as a Slack AI assistant. Slack's AI assistant features require a paid Slack plan, so a paid Slack subscription is needed for ITSquare.AI to function in your workspace.",
  },
]

export function DisclosuresSection() {
  return (
    <section id="disclosures" className="px-8 py-24 max-w-7xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-black tracking-tighter mb-4 text-balance">
          Important things to know.
        </h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {disclosures.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex gap-4 p-6 bg-surface-container-low ghost-border">
              <Icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold mb-2 text-balance">{item.title}</h3>
                <p className="text-foreground-variant text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
