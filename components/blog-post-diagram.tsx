type DiagramTheme = "email" | "domain" | "office" | "social" | "shared" | "vendor"

const themes: Record<DiagramTheme, { label: string; title: string; items: string[] }> = {
  email: { label: "ACCOUNT RECOVERY", title: "Reset the password. Then close the remaining paths.", items: ["Sessions", "Rules", "Apps", "Recovery"] },
  domain: { label: "DOMAIN CONTROL MAP", title: "Keep the control plane inside the business.", items: ["Registrar", "DNS", "Website", "Email"] },
  office: { label: "MOVE SEQUENCE", title: "Move the office in dependencies, not guesswork.", items: ["Plan", "Stage", "Cut over", "Verify"] },
  social: { label: "SOCIAL ACCOUNT DEFENCE", title: "Protect the page, the people, and the recovery path.", items: ["Admins", "MFA", "Apps", "Recovery"] },
  shared: { label: "ACCESS MODEL", title: "Replace shared passwords with accountable access.", items: ["Identity", "Role", "Vault", "Audit"] },
  vendor: { label: "BREACH RESPONSE", title: "Turn a vendor notice into a decision trail.", items: ["Scope", "Evidence", "Contain", "Monitor"] },
}

export function BlogPostDiagram({ theme }: { theme: DiagramTheme }) {
  const diagram = themes[theme]
  return <figure className="my-14 overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-8">
    <figcaption className="flex flex-wrap items-center justify-between gap-3">
      <span className="font-semibold text-foreground">{diagram.title}</span>
      <span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">{diagram.label}</span>
    </figcaption>
    <div className="mt-8 grid gap-3 sm:grid-cols-4">
      {diagram.items.map((item, index) => <div key={item} className="relative rounded-xl border border-primary/25 bg-primary/5 p-4">
        <span className="font-mono text-xs text-primary">0{index + 1}</span>
        <p className="mt-5 text-sm font-semibold text-foreground">{item}</p>
        <div className="mt-4 h-1 rounded-full bg-primary/20"><div className="h-1 rounded-full bg-primary" style={{ width: `${45 + index * 15}%` }} /></div>
        {index < diagram.items.length - 1 && <span className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-primary sm:block" aria-hidden="true">→</span>}
      </div>)}
    </div>
  </figure>
}

export type { DiagramTheme }
