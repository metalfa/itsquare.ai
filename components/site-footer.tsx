import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Brand } from "@/components/brand"

const links = [
  { href: "/healthcare", label: "Healthcare" },
  { href: "/safe-ai", label: "Safe AI" },
  { href: "/risk-assessment", label: "Risk Assessment" },
  { href: "/partners", label: "For Partners" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Insights" },
  { href: "/readiness-check", label: "Readiness Check" },
  { href: "/contact", label: "Contact" },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__identity">
          <Brand />
          <p>IT, security, and safe AI for independent medical and dental practices. Chicago-based. One accountable person.</p>
          <a className="footer-call" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call">
            Book a 15-minute call <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          {links.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <address className="footer-contact">
          <a href="mailto:bensassi.faysel@itsquare.ai">bensassi.faysel@itsquare.ai</a>
          <a href="tel:+17738373043">(773) 837-3043</a>
          <span>Chicago, IL</span>
        </address>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} ITSquare.ai</span>
        <div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </footer>
  )
}
