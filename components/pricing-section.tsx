import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying ITSquare",
    features: [
      "50 AI conversations/month",
      "Basic troubleshooting",
      "Slack integration",
      "1 workspace",
    ],
    cta: "Start Free",
    href: "/auth/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "per user/month",
    description: "For teams that want IT peace of mind",
    features: [
      "Unlimited AI conversations",
      "Knowledge base (learns from your docs)",
      "Smart escalation to humans",
      "Priority support",
      "Custom integrations",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    href: "/auth/sign-up?plan=pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For organizations with complex needs",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Dedicated support",
      "Custom AI training",
      "SLA guarantees",
      "On-premise option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black tracking-tighter mb-4">
          Simple, transparent pricing.
        </h2>
        <p className="text-foreground-variant text-lg">
          Start free. Upgrade when your team loves it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`p-8 ghost-border relative ${
              plan.highlighted 
                ? "bg-surface-container-high border-primary-container/50" 
                : "bg-surface-container-low"
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-container text-white text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-foreground-variant text-sm">/{plan.period}</span>
              </div>
              <p className="text-foreground-variant text-sm mt-2">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground-variant">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block w-full py-3 text-center font-bold text-sm transition-all ${
                plan.highlighted
                  ? "bg-primary-container text-white hover:shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]"
                  : "ghost-border text-foreground hover:bg-surface-container-highest"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
      
      <p className="text-center text-sm text-foreground-variant/60 mt-8">
        All plans include a 14-day free trial. No credit card required.
      </p>
    </section>
  )
}
