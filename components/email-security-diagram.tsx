export function EmailSecurityDiagram() {
  return (
    <figure className="my-14 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-primary/5 md:p-8">
      <figcaption className="mb-6 flex items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
        <span>What a password change does — and does not — revoke</span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Access map</span>
      </figcaption>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Password reset</p>
          <p className="mt-3 text-lg font-semibold">Blocks the old sign-in</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A new password stops someone using the previous password to start a fresh login.</p>
        </div>
        <div className="hidden text-2xl text-primary md:block" aria-hidden="true">→</div>
        <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-amber-200">Still needs review</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground/80">
            <li>Active sessions and tokens</li><li>Forwarding rules and filters</li><li>Connected apps and delegates</li><li>Recovery methods and devices</li>
          </ul>
        </div>
      </div>
    </figure>
  )
}
