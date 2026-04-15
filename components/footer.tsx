import Link from "next/link"

const policyLinks = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/security", label: "Security" },
]

const productLinks = [
  { href: "#pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
  { href: "/support", label: "Support" },
  { href: "/contact", label: "Contact" },
]

export function Footer() {
  return (
    <footer className="bg-[#0A0A0F] border-t border-[#434655]/15 py-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Brand */}
        <div className="space-y-4">
          <div className="text-lg font-black text-[#E4E1E9]">ITSquare.AI</div>
          <p className="text-[10px] tracking-widest uppercase text-[#C3C6D7]">
            AI IT Support in Slack
          </p>
          <div className="flex flex-col gap-1 text-[11px] text-[#C3C6D7] font-mono">
            <Link
              href="mailto:brucelee@itsquare.ai"
              className="hover:text-primary transition-colors"
            >
              brucelee@itsquare.ai
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">
              Product
            </span>
            {productLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[#C3C6D7] hover:text-[#B4C5FF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">
              Legal
            </span>
            {policyLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[#C3C6D7] hover:text-[#B4C5FF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[#434655]/5 flex justify-between items-center">
        <p className="text-[10px] tracking-widest uppercase text-[#C3C6D7] opacity-60">
          2026 ITSquare.AI. Made with care in Chicago.
        </p>
        <div className="flex gap-4">
          <div className="w-2 h-2 bg-green-500/50 rounded-full" title="All systems operational" />
        </div>
      </div>
    </footer>
  )
}
