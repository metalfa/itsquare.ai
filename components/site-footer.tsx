import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const links = [
  { href: "/healthcare", label: "Healthcare" },
  { href: "/risk-assessment", label: "Risk Assessment" },
  { href: "/partners", label: "For Brokers" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Insights" },
  { href: "/contact", label: "Contact" },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__identity">
          <Link href="/" className="brand-link" aria-label="IT Square home">
            <svg aria-hidden="true" className="brand-mark" viewBox="0 0 40 40" fill="none">
              <rect x="6.5" y="6.5" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
              <rect x="12.5" y="12.5" width="22" height="22" rx="4" fill="var(--background)" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>IT <strong>Square</strong></span>
          </Link>
          <p>IT and cybersecurity for Chicago medical and dental offices.</p>
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
        <span>© {new Date().getFullYear()} IT Square LLC</span>
        <div className="flex gap-5"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link></div>
      </div>
    </footer>
  )
}
