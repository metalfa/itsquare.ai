const chatDemo = [
  { role: "user", name: "Sarah", message: "My WiFi keeps disconnecting every few minutes" },
  { role: "bot", name: "ITSquare", message: "That sounds frustrating! Let me help. Are you on a Mac or Windows?" },
  { role: "user", name: "Sarah", message: "Mac" },
  { role: "bot", name: "ITSquare", message: "Got it. Try this:\n\n1. Click the WiFi icon in your menu bar\n2. Hold Option and click it again\n3. Click \"Open Wireless Diagnostics\"\n\nThis will scan for issues. Let me know what it finds!" },
  { role: "user", name: "Sarah", message: "It says interference from other networks" },
  { role: "bot", name: "ITSquare", message: "Easy fix! Go to System Settings > WiFi > your network > Details > change the channel to \"Auto\" or try channel 36 or 149. These are less crowded." },
  { role: "user", name: "Sarah", message: "That worked!! Thank you!!" },
]

export function ProcessSection() {
  return (
    <section id="demo" className="px-8 py-32 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        {/* Left Column - Title */}
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-8 leading-tight text-balance">
            See it in action.
          </h2>
          <p className="text-foreground-variant text-lg mb-8">
            Real conversation. Real solution. Under 2 minutes.
          </p>
          
          <div className="space-y-4 text-sm text-foreground-variant">
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">01</span>
              <span>Employee describes the problem naturally</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">02</span>
              <span>AI asks clarifying questions if needed</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">03</span>
              <span>Step-by-step solution delivered in Slack</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary font-bold">04</span>
              <span>Problem solved. Back to work.</span>
            </div>
          </div>
        </div>

        {/* Right Column - Chat Demo */}
        <div className="bg-surface-container ghost-border overflow-hidden">
          {/* Slack-like header */}
          <div className="px-4 py-3 border-b border-[#434655]/15 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-2 text-xs text-foreground-variant font-mono">#it-help</span>
          </div>
          
          {/* Chat messages */}
          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {chatDemo.map((msg, index) => (
              <div key={index} className="flex gap-3">
                <div className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.role === "bot" 
                    ? "bg-primary-container text-white" 
                    : "bg-surface-container-high text-foreground-variant"
                }`}>
                  {msg.name[0]}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-bold ${msg.role === "bot" ? "text-primary" : "text-foreground"}`}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-foreground-variant/50">
                      {msg.role === "bot" ? "APP" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-foreground-variant whitespace-pre-line mt-1">
                    {msg.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
