"use client"

import { Archive, Cloud, Database, RotateCcw, ShieldCheck } from "lucide-react"

const layers = [
  { icon: Database, label: "Primary data", detail: "Files, systems, mail" },
  { icon: Cloud, label: "Off-site copy", detail: "Encrypted cloud backup" },
  { icon: Archive, label: "Local copy", detail: "Fast restore layer" },
  { icon: RotateCcw, label: "Version history", detail: "Undo corruption" },
]

export function BackupRecoveryDiagrams() {
  return (
    <div className="my-12 space-y-5 not-prose">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <p className="eyebrow">The resilient backup stack</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {layers.map(({ icon: Icon, label, detail }, index) => (
            <div key={label} className="relative rounded-2xl border border-border bg-background p-4">
              <Icon className="size-5 text-primary" />
              <p className="mt-4 font-semibold">{label}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
              {index < layers.length - 1 && <span className="absolute -right-3 top-1/2 hidden text-primary sm:block">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-primary/10 p-4 text-sm text-foreground"><ShieldCheck className="size-5 shrink-0 text-primary" /> A backup is protection only when it is separate, recent, and tested.</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6"><p className="eyebrow">RPO</p><p className="mt-3 text-xl font-semibold">How much can you lose?</p><p className="mt-2 leading-7 text-muted-foreground">The recovery point objective defines the maximum acceptable gap between the last good backup and the incident.</p></div>
        <div className="rounded-3xl border border-border bg-card p-6"><p className="eyebrow">RTO</p><p className="mt-3 text-xl font-semibold">How fast must work resume?</p><p className="mt-2 leading-7 text-muted-foreground">The recovery time objective defines how quickly critical systems need to be usable again.</p></div>
      </div>
    </div>
  )
}
