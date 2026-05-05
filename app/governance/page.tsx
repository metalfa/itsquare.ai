import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { GovernanceHero } from "@/components/governance/governance-hero"
import { GovernanceStats } from "@/components/governance/governance-stats"
import { GovernanceTiers } from "@/components/governance/governance-tiers"
import { GovernanceProcess } from "@/components/governance/governance-process"
import { GovernanceCTA } from "@/components/governance/governance-cta"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Governance & Audit Services | ITSquare.AI",
  description:
    "80% of organizations have encountered risky AI agent behavior. We help mid-size companies build AI governance in 3-6 weeks — discovery, implementation, and audit readiness.",
}

export default function GovernancePage() {
  return (
    <>
      <Navbar />
      <main className="grid-bg min-h-screen pt-20">
        <GovernanceHero />
        <GovernanceStats />
        <GovernanceTiers />
        <GovernanceProcess />
        <GovernanceCTA />
      </main>
      <Footer />
    </>
  )
}
