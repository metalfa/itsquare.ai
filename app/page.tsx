import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProblemSection } from "@/components/problem-section"
import { SolutionSection } from "@/components/solution-section"
import { TrustBadges } from "@/components/trust-badges"
import { ProcessSection } from "@/components/process-section"
import { ComplianceSection } from "@/components/compliance-section"
import { PricingSection } from "@/components/pricing-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="grid-bg min-h-screen pt-20">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <TrustBadges />
        <ProcessSection />
        <ComplianceSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
