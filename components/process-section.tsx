const steps = [
  {
    number: "01",
    title: "Audit",
    description:
      "One week to map every manual touchpoint and security gap in your current stack.",
  },
  {
    number: "02",
    title: "Deploy",
    description:
      "2-6 weeks to inject custom AI agents into your VPC or on-prem hardware.",
  },
  {
    number: "03",
    title: "Save",
    description:
      "20+ hours/week permanently recovered for your senior engineering talent.",
  },
]

const logLines = [
  "STDOUT: Scanning cloud environment...",
  "STDOUT: 14 dormant Azure accounts detected.",
  "STDOUT: Mapping dependencies for Slack/AWS...",
  "STDOUT: Automation nodes deploying to k8s cluster...",
]

export function ProcessSection() {
  return (
    <section id="process" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        {/* Left Column - Title & Terminal */}
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight">
            Architecture of <br />
            Efficiency.
          </h2>

          {/* Terminal Card */}
          <div className="p-8 bg-surface-container ghost-border">
            <div className="flex items-center gap-4 text-xs font-mono text-primary-container mb-4">
              <span>{"// LOG_STREAM_INIT"}</span>
              <span className="w-2 h-2 bg-primary-container animate-pulse" />
            </div>
            <div className="space-y-2 font-mono text-[10px] text-foreground-variant opacity-50">
              {logLines.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Steps */}
        <div className="flex flex-col gap-12">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6">
              <span className="text-4xl font-black text-outline/20">{step.number}</span>
              <div>
                <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-foreground-variant text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
