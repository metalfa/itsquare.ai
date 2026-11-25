import type { Metadata, Viewport } from "next"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"

const siteUrl = "https://itsquare.ai"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "IT Square | Healthcare IT for Chicago Practices",
    template: "%s | IT Square",
  },
  description: "IT and cybersecurity for Chicago medical and dental offices. Make your practice insurable and HIPAA-ready, with one accountable IT partner.",
  applicationName: "IT Square",
  keywords: ["healthcare IT Chicago", "HIPAA risk assessment", "cyber insurance readiness", "medical office IT", "dental practice IT"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "IT Square | Healthcare IT for Chicago Practices",
    description: "IT and cybersecurity for Chicago medical and dental offices.",
    type: "website",
    siteName: "IT Square",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1424, height: 752, alt: "IT Square healthcare IT for Chicago medical and dental practices" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "IT Square | Healthcare IT for Chicago Practices",
    description: "IT and cybersecurity for Chicago medical and dental offices.",
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
        <div className="mobile-call-bar">
          <a className="button button--primary" href="https://calendly.com/bensassi-faysel/discovery-call" target="_blank" rel="noopener noreferrer" data-analytics="book-call">Book a 15-minute call</a>
        </div>
      </body>
    </html>
  )
}
