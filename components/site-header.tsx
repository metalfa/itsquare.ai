"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { Brand } from "@/components/brand"

const navigation = [
  { href: "/healthcare", label: "Healthcare" },
  { href: "/safe-ai", label: "Safe AI" },
  { href: "/risk-assessment", label: "Risk Assessment" },
  { href: "/partners", label: "For Partners" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Insights" },
]

function CallLink({ onClick }: { onClick?: () => void }) {
  return <a className="button button--primary header-call" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call" onClick={onClick}>
    Book a 15-minute call <ArrowUpRight aria-hidden="true" />
  </a>
}

export function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Brand onClick={closeMenu} />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <CallLink />
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}>
        {navigation.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined} onClick={closeMenu}>
            {label}
          </Link>
        ))}
        <Link className="button button--secondary mobile-nav__check" href="/readiness-check" data-analytics="readiness-cta" onClick={closeMenu}>
          Take the free Readiness Check
        </Link>
        <CallLink onClick={closeMenu} />
      </nav>
    </header>
  )
}
