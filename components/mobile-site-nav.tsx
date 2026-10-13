"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ArrowUpRight } from "lucide-react"

const links = [
  { href: "#services", label: "Services" },
  { href: "#approach", label: "Our approach" },
  { href: "#about", label: "About us" },
  { href: "/blog", label: "Insights" },
]

export function MobileSiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-site-menu"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>
      {open && (
        <div id="mobile-site-menu" className="absolute inset-x-0 top-full border-b border-border bg-background/95 px-5 py-5 shadow-2xl shadow-background/40 backdrop-blur-xl">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <a href="mailto:bensassi.faysel@itsquare.ai" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground">
              Start a conversation <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </nav>
        </div>
      )}
    </div>
  )
}
