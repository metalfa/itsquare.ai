"use client"

const questions = [
  ["01", "Was our account affected?", "Separate confirmed, possible, and still-under-investigation impact."],
  ["02", "What data was involved?", "Ask about records, credentials, tokens, files, and encryption keys."],
  ["03", "What must we change?", "Reset, revoke, monitor, notify, and document with owners."],
]

export function VendorBreachDiagrams() {
  return (
    <div className="my-12 space-y-5">
      <figure className="rounded-3xl border border-primary/30 bg-primary/5 p-5 md:p-8">
        <figcaption className="flex flex-wrap items-center justify-between gap-3"><span className="font-semibold">The first-response question map</span><span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Ask before acting</span></figcaption>
        <div className="mt-7 grid gap-3 md:grid-cols-3">{questions.map(([number, title, detail]) => <div key={number} className="rounded-2xl border border-border bg-card p-5"><span className="font-mono text-xs text-primary">{number}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p></div>)}</div>
      </figure>
      <figure className="rounded-3xl border border-border bg-card p-5 md:p-8">
        <figcaption className="flex items-center justify-between gap-3"><span className="font-semibold">From vendor notice to business decision</span><span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Response flow</span></figcaption>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-stretch">{[["VERIFY", "Confirm the notice"], ["SCOPE", "Understand exposure"], ["CONTAIN", "Protect accounts"], ["RECORD", "Keep the timeline"], ["REVIEW", "Decide what changes"]].map(([label, detail], index) => <div key={label} className="flex flex-1 items-center gap-2 sm:block"><div className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:min-h-28"><span className="font-mono text-[10px] tracking-[0.14em] text-primary">0{index + 1} / {label}</span><p className="mt-3 text-sm font-medium leading-5">{detail}</p></div>{index < 4 && <span className="text-primary sm:block sm:py-2 sm:text-center" aria-hidden="true">→</span>}</div>)}</div>
      </figure>
    </div>
  )
}
