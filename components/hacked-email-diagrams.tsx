import { CheckCircle2, Mail, RefreshCw, ShieldAlert } from "lucide-react"

const checks = ["Revoke sessions", "Remove forwarding rules", "Review apps and delegates", "Check recovery methods"]

export function HackedEmailDiagrams() {
  return (
    <div className="my-12 grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6">
        <p className="eyebrow">Why password-only recovery fails</p>
        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <div className="flex flex-col items-center gap-2 text-center"><Mail className="size-8 text-primary" /><span>Mailbox</span></div>
          <div className="h-px flex-1 bg-border" />
          <div className="flex flex-col items-center gap-2 text-center"><ShieldAlert className="size-8 text-destructive" /><span>Old access</span></div>
        </div>
        <p className="mt-6 text-sm leading-6 text-muted-foreground">A password reset blocks the old password. It does not automatically remove every session, rule, app permission, delegate, or recovery method.</p>
      </div>
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6">
        <p className="eyebrow">The recovery sequence</p>
        <div className="mt-5 grid gap-3">
          {checks.map((check, index) => <div key={check} className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">{index + 1}</span><span>{check}</span><CheckCircle2 className="ml-auto size-4 text-primary" /></div>)}
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-card p-6 md:col-span-2">
        <div className="flex items-center gap-3"><RefreshCw className="size-5 text-primary" /><p className="eyebrow">Return the account only after the loop closes</p></div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span className="rounded-full border border-border px-3 py-2">Contain</span><span>→</span><span className="rounded-full border border-border px-3 py-2">Investigate</span><span>→</span><span className="rounded-full border border-border px-3 py-2">Clean up</span><span>→</span><span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-2 text-primary">MFA + monitor</span></div>
      </div>
    </div>
  )
}
