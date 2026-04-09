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
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#E4E1E9]">
          ITSquare.AI
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
