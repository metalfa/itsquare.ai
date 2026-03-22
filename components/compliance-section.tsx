import { CheckCircle } from "lucide-react"

const complianceItems = [
  {
    title: "HIPAA Ready",
    description: "Every access event is encrypted, logged, and audit-trail ready.",
  },
  {
    title: "SOC 2 Compliant",
    description: "Automated evidence collection for Type II certification audits.",
  },
  {
    title: "PCI-DSS Aligned",
    description: "Access controls that meet payment card industry standards.",
  },
  {
    title: "Zero Trust Architecture",
    description: "AI-driven continuous verification for every infrastructure action.",
  },
]

export function ComplianceSection() {
  return (
    <section id="compliance" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="mb-16">
        <h2 className="text-4xl font-black tracking-tighter mb-4">
          Compliance without the hassle.
        </h2>
        <div className="h-1 w-24 bg-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {complianceItems.map((item, index) => (
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
