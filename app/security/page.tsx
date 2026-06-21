import Link from "next/link"
import { ArrowLeft, Shield, Lock, FileCheck, Server } from "lucide-react"

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <div className="max-w-4xl mx-auto px-8 py-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-foreground-variant hover:text-primary mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
          Security & Compliance
        </h1>
        <p className="text-lg text-foreground-variant mb-16 max-w-2xl">
          Enterprise-grade security built into every layer of our infrastructure automation platform.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="ghost-border bg-surface-container p-8">
            <Shield className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">SOC 2 Type II</h3>
            <p className="text-foreground-variant text-sm leading-relaxed">
              Annual audits verify our security controls meet the highest industry standards for data protection.
            </p>
          </div>

          <div className="ghost-border bg-surface-container p-8">
            <Lock className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">HIPAA Compliant</h3>
            <p className="text-foreground-variant text-sm leading-relaxed">
              Healthcare organizations trust IT Square for PHI protection with full HIPAA compliance.
            </p>
          </div>

          <div className="ghost-border bg-surface-container p-8">
            <FileCheck className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">PCI DSS</h3>
            <p className="text-foreground-variant text-sm leading-relaxed">
              Financial services and payment processing environments supported with PCI compliance.
            </p>
          </div>

          <div className="ghost-border bg-surface-container p-8">
            <Server className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-bold mb-2">On-Premise Deployment</h3>
            <p className="text-foreground-variant text-sm leading-relaxed">
              Your data never leaves your infrastructure. AI agents run entirely within your environment.
            </p>
          </div>
        </div>

        <div className="p-8 bg-surface-container-high ghost-border">
          <h2 className="text-xl font-bold mb-4">Security Features</h2>
          <ul className="space-y-3 text-foreground-variant">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              End-to-end encryption for all communications
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Role-based access control (RBAC)
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Comprehensive audit logging
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Zero-trust architecture
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary" />
              Automated vulnerability scanning
            </li>
          </ul>
        </div>

        <div className="mt-12 p-8 bg-surface-container ghost-border border-l-4 border-l-primary-container">
          <p className="text-foreground-variant mb-4">
            Need a security assessment or compliance documentation?
          </p>
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary-container text-white px-6 py-3 text-sm font-bold hover:scale-[0.98] transition-transform"
          >
            Request Security Documentation
          </Link>
        </div>
      </div>
    </div>
  )
}
