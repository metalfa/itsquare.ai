import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-foreground-variant mb-12">
          Last updated: March 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">Overview</h2>
            <p className="text-foreground-variant leading-relaxed">
              IT Square is committed to protecting your privacy. This policy explains how we handle information when you use our AI infrastructure automation services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Data Processing</h2>
            <p className="text-foreground-variant leading-relaxed">
              Our AI agents run entirely on your infrastructure. We do not collect, store, or transmit your organizations sensitive data to external servers. All provisioning, access management, and compliance operations occur within your environment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Information We Collect</h2>
            <p className="text-foreground-variant leading-relaxed">
              We collect minimal information necessary to provide our services: account registration details, usage analytics for service improvement, and support communications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Data Security</h2>
            <p className="text-foreground-variant leading-relaxed">
              We implement industry-standard security measures. Our infrastructure is SOC 2 compliant, and we support HIPAA and PCI compliance requirements for regulated industries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Your Rights</h2>
            <p className="text-foreground-variant leading-relaxed">
              You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Contact</h2>
            <p className="text-foreground-variant leading-relaxed">
              For privacy inquiries, contact us at{" "}
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
