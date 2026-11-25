"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"

const navigation = [
  { href: "/healthcare", label: "Healthcare" },
  { href: "/risk-assessment", label: "Risk Assessment" },
  { href: "/partners", label: "For Brokers" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Insights" },
]

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="brand-link" aria-label="IT Square home">
      <svg aria-hidden="true" className="brand-mark" viewBox="0 0 40 40" fill="none">
        <rect x="6.5" y="6.5" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
        <rect x="12.5" y="12.5" width="22" height="22" rx="4" fill="var(--background)" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>IT <strong>Square</strong></span>
    </Link>
  )
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
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <a className="button button--primary header-call" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call">
            Book a 15-minute call <ArrowUpRight aria-hidden="true" />
          </a>
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
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={closeMenu}>
              {label}
            </Link>
          ))}
          <a className="button button--primary mobile-nav__call" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call" onClick={closeMenu}>
            Book a 15-minute call <ArrowUpRight aria-hidden="true" />
          </a>
        </nav>
    </header>
  )
}
