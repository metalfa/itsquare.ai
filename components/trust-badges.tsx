import { Slack, Clock, Brain, Shield } from "lucide-react"

const badges = [
  { icon: Slack, label: "Lives in Slack" },
  { icon: Clock, label: "Responds in seconds" },
  { icon: Brain, label: "Learns from your company" },
  { icon: Shield, label: "SOC 2 compliant" },
]

export function TrustBadges() {
  return (
    <section className="border-y border-[#434655]/15 bg-surface-container-lowest py-10 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-8 opacity-60">
        {badges.map((badge, index) => {
          const Icon = badge.icon
          return (
            <div key={index} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {badge.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
