import Link from "next/link"
import { ArrowLeft, Book, Code, Shield, Zap } from "lucide-react"

export default function DocsPage() {
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
          Technical Documentation
        </h1>
        <p className="text-lg text-foreground-variant mb-16 max-w-2xl">
          Everything you need to integrate IT Square AI agents into your infrastructure.
        </p>

        <div className="grid gap-6">
          <div className="ghost-border bg-surface-container p-8 hover:bg-surface-container-high transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-container/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Quick Start</h3>
                <p className="text-foreground-variant text-sm leading-relaxed">
                  Get up and running in under 30 seconds. Our AI agents automatically detect your infrastructure and begin provisioning.
                </p>
              </div>
            </div>
          </div>

          <div className="ghost-border bg-surface-container p-8 hover:bg-surface-container-high transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-container/10">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">API Reference</h3>
                <p className="text-foreground-variant text-sm leading-relaxed">
                  Complete API documentation for custom integrations. REST and GraphQL endpoints available.
                </p>
              </div>
            </div>
          </div>

          <div className="ghost-border bg-surface-container p-8 hover:bg-surface-container-high transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-container/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Security & Compliance</h3>
                <p className="text-foreground-variant text-sm leading-relaxed">
                  HIPAA, PCI, SOC 2 compliance documentation. Learn how we secure your infrastructure.
                </p>
              </div>
            </div>
          </div>

          <div className="ghost-border bg-surface-container p-8 hover:bg-surface-container-high transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary-container/10">
                <Book className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Integration Guides</h3>
                <p className="text-foreground-variant text-sm leading-relaxed">
                  Step-by-step guides for Okta, Azure AD, AWS, Slack, M365, and more.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 p-8 bg-surface-container-high ghost-border">
          <p className="text-sm text-foreground-variant mb-4">
            Need help getting started?
          </p>
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary-container text-white px-6 py-3 text-sm font-bold hover:scale-[0.98] transition-transform"
          >
            Schedule a Technical Demo
          </Link>
        </div>
      </div>
    </div>
  )
}
