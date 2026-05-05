import Link from "next/link"
import { Check } from "lucide-react"

const tiers = [
  {
    name: "Discovery",
    price: "$3,500",
    timeline: "1 week",
    description: "Find every AI tool, agent, and integration in your organization",
    features: [
      "Stakeholder interviews (IT, Security, Dept. heads)",
      "Network traffic analysis for AI services",
      "Employee AI usage survey",
      "Complete AI tool inventory",
      "Data access mapping per tool",
      "Risk rating (Critical / High / Medium / Low)",
      "Executive summary report",
    ],
    cta: "Book Discovery Call",
    href: "https://calendly.com/bensassi-faysel/discovery-call",
    highlighted: false,
  },
  {
    name: "Implementation",
    price: "$12,000",
    timeline: "3 weeks",
    description: "Build a working governance framework with real controls",
    features: [
      "Everything in Discovery",
      "AI Acceptable Use Policy",
      "Tool approval workflows",
      "Data classification for AI usage",
      "Access management setup",
      "Logging & monitoring infrastructure",
      "Incident response playbook",
      "IT team training workshop",
    ],
    cta: "Book Discovery Call",
    href: "https://calendly.com/bensassi-faysel/discovery-call",
    highlighted: true,
  },
  {
    name: "Audit Ready",
    price: "$25,000",
    timeline: "6 weeks",
    description: "Map to frameworks, generate evidence, pass your next audit",
    features: [
      "Everything in Implementation",
      "EU AI Act compliance mapping",
      "NIST AI RMF alignment",
      "ISO 42001 gap analysis",
      "SOC 2 AI controls addendum",
      "Mock audit + remediation",
      "Evidence package generation",
      "90-day monitoring support",
    ],
    cta: "Book Discovery Call",
    href: "https://calendly.com/bensassi-faysel/discovery-call",
    highlighted: false,
  },
]

export function GovernanceTiers() {
  return (
    <section id="tiers" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black tracking-tighter mb-4">
          Enterprise governance. Mid-market pricing.
        </h2>
        <p className="text-foreground-variant text-lg">
          McKinsey charges $500K+. We deliver real governance starting at $3,500.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, index) => (
          <div
            key={index}
            className={`p-8 ghost-border relative ${
              tier.highlighted
                ? "bg-surface-container-high border-primary-container/50"
                : "bg-surface-container-low"
            }`}
          >
            {tier.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-container text-white text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{tier.price}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-widest font-mono text-primary">
                  {tier.timeline}
                </span>
              </div>
              <p className="text-foreground-variant text-sm mt-3">{tier.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground-variant">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={`block w-full py-3 text-center font-bold text-sm transition-all ${
                tier.highlighted
                  ? "bg-primary-container text-white hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]"
                  : "ghost-border text-foreground hover:bg-surface-container-highest"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Retainer add-on */}
      <div className="mt-12 p-8 bg-surface-container ghost-border border-l-4 border-l-primary-container electric-glow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Quarterly Governance Retainer</h3>
            <p className="text-foreground-variant text-sm max-w-xl">
              Stay audit-ready year-round. Monthly inventory updates, continuous monitoring, quarterly reviews, and new regulation alerts.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black">$2,500</div>
            <div className="text-[10px] uppercase tracking-widest font-mono text-foreground-variant">/month</div>
            <Link
              href="https://calendly.com/bensassi-faysel/discovery-call"
              className="inline-block mt-3 bg-primary-container text-white px-6 py-2 text-sm font-bold hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
