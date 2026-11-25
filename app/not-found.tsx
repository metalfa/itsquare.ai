import Link from "next/link"
import { BookCallLink, RiskAssessmentLink } from "@/components/site-elements"

export default function NotFound() {
  return <main className="page-shell"><section className="section"><div className="container--narrow text-center"><p className="eyebrow">Page not found</p><h1 className="display-title mx-auto">Let’s get you back on track.</h1><p className="lead mx-auto">That address may have changed. Start at the home page or go straight to the HIPAA Risk Assessment.</p><div className="hero__actions justify-center"><Link href="/" className="button button--secondary">Home</Link><RiskAssessmentLink /><BookCallLink /></div></div></section></main>
}
