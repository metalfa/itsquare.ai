"use client"

import { createPortal } from "react-dom"
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
      {open && typeof document !== "undefined" && createPortal(
        <div id="mobile-site-menu" style={{ backgroundColor: "var(--background)" }} className="fixed inset-x-0 top-[4.5rem] z-[9999] h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-border px-5 py-6 shadow-2xl shadow-black/60 [isolation:isolate]">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-lg flex-col gap-2">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
                {link.label}
              </Link>
            ))}
            <a href="mailto:bensassi.faysel@itsquare.ai" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground">
              Start a conversation <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </nav>
        </div>,
        document.body,
      )}
    </div>
  )
}
