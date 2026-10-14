"use client"

const checks = [
  ["REGISTRAR", "Who can renew and transfer?"],
  ["DNS", "Who can change where services point?"],
  ["RECOVERY", "Which company-controlled contacts recover access?"],
]

export function DomainOwnershipDiagrams() {
  return <div className="my-12 space-y-5">
    <figure className="rounded-3xl border border-primary/30 bg-primary/5 p-5 md:p-8"><figcaption className="flex flex-wrap items-center justify-between gap-3"><span className="font-semibold">The domain control map</span><span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Find the control points</span></figcaption><div className="mt-7 grid gap-3 md:grid-cols-3">{checks.map(([label, detail]) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><span className="font-mono text-xs tracking-[0.14em] text-primary">{label}</span><p className="mt-4 text-sm font-medium leading-6">{detail}</p></div>)}</div><div className="mt-4 rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm leading-6 text-muted-foreground">A website host, DNS provider, email platform, and registrar can be different companies. The business should still know who controls each one.</div></figure>
    <figure className="rounded-3xl border border-border bg-card p-5 md:p-8"><figcaption className="flex items-center justify-between gap-3"><span className="font-semibold">The yearly ownership check</span><span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Keep control inside</span></figcaption><div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-stretch">{["Confirm registrar", "Check renewal", "Review users", "Protect MFA", "Monitor DNS"].map((step, index) => <div key={step} className="flex flex-1 items-center gap-2 sm:block"><div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:min-h-24"><span className="font-mono text-[10px] text-primary">0{index + 1}</span><p className="mt-3 text-sm font-medium">{step}</p></div>{index < 4 && <span className="text-primary sm:block sm:py-2 sm:text-center" aria-hidden="true">→</span>}</div>)}</div></figure>
  </div>
}
