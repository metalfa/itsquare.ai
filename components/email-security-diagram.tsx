export function EmailSecurityDiagram() {
  return (
    <div className="my-14 space-y-5">
      <figure className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-primary/5 md:p-8">
        <figcaption className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-muted-foreground">
          <span>What a password change does — and does not — revoke</span>
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Access map</span>
        </figcaption>
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">01 / Reset</p>
            <p className="mt-3 text-lg font-semibold">Blocks the old sign-in</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">A new password stops someone using the previous password to start a fresh login.</p>
          </div>
          <div className="flex items-center justify-center text-2xl text-primary md:block" aria-hidden="true">→</div>
          <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-amber-200">02 / Audit</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/80"><li>Active sessions and tokens</li><li>Forwarding rules and filters</li><li>Connected apps and delegates</li><li>Recovery methods and devices</li></ul>
          </div>
        </div>
      </figure>

      <figure className="rounded-2xl border border-border bg-card p-5 md:p-8">
        <figcaption className="flex items-center justify-between gap-3"><span className="font-semibold">The attacker’s remaining paths</span><span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Threat surface</span></figcaption>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {[['SESSION', 'Browser cookie or mail app token', 'Revoke everywhere'], ['RULE', 'Hidden forwarding or inbox filter', 'Delete and audit'], ['APP', 'OAuth consent and mailbox access', 'Remove permission'], ['RECOVERY', 'Phone, passkey, or authenticator', 'Verify ownership']].map(([label, detail, action]) => (
            <div key={label} className="grid grid-cols-[auto_1fr] gap-4 rounded-xl border border-border/80 bg-background/50 p-4">
              <span className="flex size-10 items-center justify-center rounded-full border border-primary/40 font-mono text-[10px] font-semibold text-primary">{label}</span>
              <div><p className="text-sm font-medium text-foreground">{detail}</p><p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">{action}</p></div>
            </div>
          ))}
        </div>
      </figure>

      <figure className="rounded-2xl border border-border bg-card p-5 md:p-8">
        <figcaption className="flex items-center justify-between gap-3"><span className="font-semibold">Recommended recovery sequence</span><span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Response flow</span></figcaption>
        <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-stretch">
          {[['CONTAIN', 'Suspend account\nRevoke sessions'], ['CLEAN', 'Change password\nRemove access'], ['VERIFY', 'Review logs\nCheck mailbox'], ['HARDEN', 'Require MFA\nEducate team']].map(([label, detail], index) => (
            <div key={label} className="flex flex-1 items-center gap-3 md:block">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 md:min-h-28 md:block"><span className="font-mono text-xs text-primary">0{index + 1}</span><p className="whitespace-pre-line text-sm font-medium leading-6 text-foreground">{detail}</p></div>
              {index < 3 && <span className="text-primary md:block md:py-2 md:text-center" aria-hidden="true">↓</span>}
            </div>
          ))}
        </div>
      </figure>
    </div>
  )
}
