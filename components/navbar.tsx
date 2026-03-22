"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "#solutions", label: "Solutions", active: true },
  { href: "#compliance", label: "Compliance" },
  { href: "#process", label: "Process" },
  { href: "#case-studies", label: "Case Studies" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-[#434655]/15">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#E4E1E9]">
          ITsquare.ai
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`tracking-tight text-sm font-medium transition-all duration-300 ${
                link.active
                  ? "text-[#B4C5FF] font-semibold"
                  : "text-[#C3C6D7] hover:text-[#E4E1E9]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <Link
          href="https://calendly.com/bensassi-faysel/discovery-call"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block bg-primary-container text-white px-5 py-2 text-sm font-semibold hover:scale-[0.98] transition-transform duration-300"
        >
          Book Discovery Call
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container border-t border-[#434655]/15 px-8 py-6">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`tracking-tight text-sm font-medium ${
                  link.active ? "text-[#B4C5FF] font-semibold" : "text-[#C3C6D7]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://calendly.com/bensassi-faysel/discovery-call"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary-container text-white px-5 py-3 text-sm font-semibold text-center mt-4"
            >
              Book Discovery Call
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
