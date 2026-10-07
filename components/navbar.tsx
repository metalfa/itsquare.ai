"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "#solutions", label: "How it Works" },
  { href: "#demo", label: "Demo" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-[#434655]/15">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <Link
          href="/"
          aria-label="ITSquare.AI home"
          className="group flex items-center gap-3 text-[#E4E1E9]"
        >
          <span
            aria-hidden="true"
            className="relative grid size-9 place-items-center overflow-hidden rounded-[11px] border border-primary/50 bg-[#10131d] shadow-[0_0_26px_-8px_var(--primary)] transition-all duration-300 group-hover:-rotate-3 group-hover:border-primary group-hover:shadow-[0_0_34px_-6px_var(--primary)]"
          >
            <span className="absolute -right-2 -top-2 size-6 rounded-full bg-primary/20 blur-md" />
            <span className="absolute inset-[5px] rounded-[7px] border border-primary/25" />
            <span className="absolute left-[7px] top-[7px] size-1.5 rounded-full bg-primary shadow-[0_0_9px_var(--primary)]" />
            <span className="absolute bottom-[7px] right-[7px] size-1.5 rounded-full bg-secondary shadow-[0_0_9px_var(--secondary)]" />
            <span className="absolute left-[9px] top-[10px] h-px w-3.5 rotate-45 bg-primary/80" />
            <span className="absolute bottom-[10px] right-[9px] h-px w-3.5 rotate-45 bg-secondary/80" />
            <span className="relative font-mono text-[10px] font-black tracking-[-0.16em] text-primary">IS</span>
          </span>
          <span className="flex items-baseline gap-1.5 leading-none">
            <span className="text-[1.05rem] font-semibold tracking-[-0.04em]">ITSquare</span>
            <span className="font-mono text-[0.7rem] font-semibold tracking-[0.12em] text-primary transition-colors duration-300 group-hover:text-secondary">.AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="tracking-tight text-sm font-medium text-[#C3C6D7] hover:text-[#E4E1E9] transition-all duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-[#C3C6D7] hover:text-[#E4E1E9] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="bg-primary-container text-white px-5 py-2 text-sm font-semibold hover:scale-[0.98] transition-transform duration-300"
          >
            Add to Slack
          </Link>
        </div>

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
                className="tracking-tight text-sm font-medium text-[#C3C6D7]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/auth/login"
              className="text-sm font-medium text-[#C3C6D7] mt-4 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="bg-primary-container text-white px-5 py-3 text-sm font-semibold text-center mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Add to Slack
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
