import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="max-w-3xl mx-auto px-8 py-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-foreground-variant hover:text-primary mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-black tracking-tighter mb-4">
          Terms of Service
        </h1>
        <p className="text-sm text-foreground-variant mb-12">
          Last updated: March 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground-variant leading-relaxed">
              By accessing or using IT Square services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-foreground-variant leading-relaxed">
              IT Square provides AI-powered infrastructure automation services, including but not limited to user provisioning, access management, and compliance monitoring. Our services run on your infrastructure under your control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">3. User Responsibilities</h2>
            <p className="text-foreground-variant leading-relaxed">
              You are responsible for maintaining the security of your account credentials, ensuring proper configuration of AI agents within your infrastructure, and compliance with your organizations internal policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">4. Data Privacy</h2>
            <p className="text-foreground-variant leading-relaxed">
              IT Square processes data on your infrastructure. We do not store or transmit your sensitive data to external servers. All processing occurs within your environment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">5. Limitation of Liability</h2>
            <p className="text-foreground-variant leading-relaxed">
              IT Square shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">6. Contact</h2>
            <p className="text-foreground-variant leading-relaxed">
              For questions about these terms, contact us at{" "}
              <Link href="mailto:brucelee@itsquare.ai" className="text-primary hover:underline">
                brucelee@itsquare.ai
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
