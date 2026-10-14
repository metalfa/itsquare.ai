import { Cable, Check, Cloud, HardDrive, Laptop, Network, Phone, ShieldCheck, Wifi } from "lucide-react"

export function OfficeMoveDiagrams() {
  return <div className="my-12 space-y-8">
    <figure className="overflow-hidden rounded-3xl border border-border bg-card p-5 md:p-8">
      <figcaption className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Move architecture</p><h3 className="mt-2 text-xl font-semibold">Everyday work depends on a chain</h3></div><span className="font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">01 / dependency map</span></figcaption>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4"><Laptop className="size-5 text-primary" /><p className="mt-4 font-semibold">People work</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Calls, payments, files, meetings</p></div>
        <div className="flex items-center justify-center text-primary sm:rotate-0">→</div>
        <div className="rounded-2xl border border-border bg-background/60 p-4"><Network className="size-5 text-primary" /><p className="mt-4 font-semibold">Office network</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Internet, firewall, Wi-Fi, cabling</p></div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4"><div className="rounded-xl border border-border p-3 text-sm"><Cloud className="size-4 text-primary" /><span className="mt-2 block">Cloud apps</span></div><div className="rounded-xl border border-border p-3 text-sm"><Phone className="size-4 text-primary" /><span className="mt-2 block">Phones</span></div><div className="rounded-xl border border-border p-3 text-sm"><Wifi className="size-4 text-primary" /><span className="mt-2 block">Wi-Fi zones</span></div><div className="rounded-xl border border-border p-3 text-sm"><ShieldCheck className="size-4 text-primary" /><span className="mt-2 block">Access controls</span></div></div>
    </figure>
    <figure className="rounded-3xl border border-border bg-card p-5 md:p-8">
      <figcaption className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Cutover sequence</p><h3 className="mt-2 text-xl font-semibold">Make the first morning boring</h3></div><span className="font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">02 / critical path</span></figcaption>
      <div className="mt-8 grid gap-3 md:grid-cols-5">{[["01", "Survey", "Building, cabling, power"], ["02", "Order", "Internet, phones, equipment"], ["03", "Stage", "Configure and label"], ["04", "Test", "Real rooms, real devices"], ["05", "Open", "Monitor and support"]].map(([number, title, detail]) => <div key={number} className="relative rounded-2xl border border-primary/25 bg-primary/[.06] p-4"><span className="font-mono text-xs text-primary">{number}</span><p className="mt-5 font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>)}</div>
    </figure>
    <figure className="rounded-3xl border border-border bg-card p-5 md:p-8">
      <figcaption className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Opening checklist</p><h3 className="mt-2 text-xl font-semibold">Prove the office works before people do</h3></div><span className="font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">03 / readiness check</span></figcaption>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">{[[Check, "Connectivity", "Internet, backup link, public IP"], [Phone, "Communication", "Internal, external, emergency calls"], [HardDrive, "Data", "Backups, restore, shared files"], [Cable, "Physical systems", "Printers, cameras, access, alarms"]].map(([Icon, title, detail]) => <div key={title as string} className="flex gap-3 rounded-2xl border border-border p-4"><Icon className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-medium">{title as string}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail as string}</p></div></div>)}</div>
    </figure>
  </div>
}
