import type { Metadata } from "next"
import { BreadcrumbJsonLd } from "@/components/site-elements"

export const metadata: Metadata = {
  title: "Website Terms of Use",
  description: "Terms for using the IT Square website and its informational content.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return <main className="page-shell"><BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Terms of Use", href: "/terms" }]} /><section className="section"><article className="container--narrow"><p className="eyebrow">Website information</p><h1 className="display-title">Terms of Use</h1><div className="article mt-10"><h2>Using this website</h2><p>This website provides general information about IT Square and its services. It is not legal, insurance, or medical advice. Contact IT Square to discuss your practice and the scope of any work.</p><h2>Service terms</h2><p>Before paid work begins, IT Square and the practice will confirm the work, responsibilities, timing, and price in writing. A website description is not a substitute for that written scope.</p><h2>Questions</h2><p>For questions about using this website, email <a className="font-semibold text-primary underline" href="mailto:bensassi.faysel@itsquare.ai">bensassi.faysel@itsquare.ai</a>.</p></div></article></section></main>
}
