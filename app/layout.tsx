import type { Metadata, Viewport } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const siteUrl = "https://itsquare.ai"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ITSquare.ai | IT, Security & Safe AI for Practices",
    template: "%s | ITSquare.ai",
  },
  description: "IT, security, and safe AI for independent medical and dental practices. HIPAA risk analysis, insurer-ready safeguards, and one accountable person in Chicago.",
  applicationName: "ITSquare.ai",
  keywords: ["healthcare IT Chicago", "HIPAA risk analysis", "medical practice cybersecurity", "safe AI for healthcare", "dental practice IT"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "ITSquare.ai | IT, Security & Safe AI for Practices",
    description: "IT, security, and safe AI for independent medical and dental practices. One accountable person in Chicago.",
    type: "website",
    siteName: "ITSquare.ai",
    locale: "en_US",
    url: siteUrl,
    images: [{ url: "/og-image.png", width: 1424, height: 752, alt: "ITSquare.ai IT and safe AI for independent practices" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ITSquare.ai | IT, Security & Safe AI for Practices",
    description: "IT, security, and safe AI for independent medical and dental practices.",
    images: ["/og-image.png"],
  },
  icons: { icon: "/favicon.svg" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f7f9f8",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <nav className="mobile-call-bar" aria-label="Quick actions">
          <Link className="button button--secondary" href="/readiness-check" data-analytics="readiness-cta">Free Readiness Check</Link>
          <a className="button button--primary" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call">Book a call</a>
        </nav>
      </body>
    </html>
  )
}
