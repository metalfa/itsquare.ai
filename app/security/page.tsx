import Link from "next/link"
import { ArrowLeft, Shield, Lock, Server, Mail, AlertTriangle, Eye, Key } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Security | ITSquare.AI",
  description: "Security practices, vulnerability disclosure, and data protection at ITSquare.AI.",
}

export default function SecurityPage() {
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
          Security
        </h1>
        <p className="text-sm text-foreground-variant mb-12">
          Last updated: April 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-12">

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Data Security
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <Key className="h-5 w-5 text-primary" />,
                  title: "Encryption at rest",
                  body: "All data stored in AES-256 encrypted databases. Slack OAuth tokens are encrypted at the application layer using AES-256-GCM before being written to disk.",
                },
                {
                  icon: <Shield className="h-5 w-5 text-primary" />,
                  title: "Encryption in transit",
                  body: "All communications between clients, the ITSquare.AI application, and third-party services use TLS 1.2 or higher. No unencrypted channels.",
                },
                {
                  icon: <Server className="h-5 w-5 text-primary" />,
                  title: "Workspace isolation",
                  body: "Row-level security (RLS) is enforced on every database table. One workspace cannot access another workspace's conversations, device data, or knowledge base.",
                },
                {
                  icon: <Eye className="h-5 w-5 text-primary" />,
                  title: "Minimal data access",
                  body: "The bot reads only messages it is directly involved in — DMs and @mentions. It does not read channels it hasn't been invited to and never reads messages passively.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border/50 bg-surface-container p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {item.icon}
                    <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Infrastructure */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Infrastructure
            </h2>
            <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span><strong className="text-foreground">Hosting:</strong> Application layer on Vercel (serverless, AWS us-east-1). Database on Supabase (PostgreSQL, AWS us-east-1). All infrastructure is in the United States.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span><strong className="text-foreground">Authentication:</strong> Slack OAuth 2.0 for app installation. Slack SSO for dashboard sign-in. Supabase Auth for session management.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span><strong className="text-foreground">Slack security:</strong> All inbound Slack requests are verified using HMAC-SHA256 signature verification before processing. Invalid signatures are rejected immediately.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span><strong className="text-foreground">AI processing:</strong> Messages are sent to OpenAI's API (US infrastructure) only to generate IT support responses. OpenAI does not retain API data or use it for model training.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span><strong className="text-foreground">No secrets in code:</strong> All credentials and API keys are stored as environment variables. No secrets are committed to source control.</span></li>
            </ul>
          </section>

          {/* Vulnerability Disclosure */}
          <section id="vulnerability-disclosure">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Vulnerability Disclosure
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              We take security reports seriously. If you discover a vulnerability in ITSquare.AI,
              please report it to us responsibly. We commit to the following:
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed mb-6">
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span>We will acknowledge your report within <strong className="text-foreground">2 business days</strong>.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span>We will investigate and provide a status update within <strong className="text-foreground">7 business days</strong>.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span>We will notify you when the vulnerability is resolved.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span>We will not pursue legal action against researchers who report in good faith and follow responsible disclosure practices.</span></li>
              <li className="flex gap-3"><span className="text-primary mt-1">→</span><span>Please <strong className="text-foreground">do not</strong> publicly disclose the vulnerability until we have had the opportunity to address it.</span></li>
            </ul>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <p className="text-sm font-semibold text-foreground mb-2">Report a vulnerability</p>
              <p className="text-sm text-muted-foreground mb-4">
                Send a detailed description of the issue, steps to reproduce, and potential impact to:
              </p>
              <a
                href="mailto:brucelee@itsquare.ai?subject=Security Vulnerability Report — ITSquare.AI"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                brucelee@itsquare.ai
              </a>
              <p className="text-xs text-muted-foreground mt-4">
                Please include: description, reproduction steps, affected component, potential impact, and your contact info.
              </p>
            </div>
          </section>

          {/* What we don't claim */}
          <section>
            <h2 className="text-xl font-bold mb-4">Certifications</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ITSquare.AI is an early-stage product. We do not currently hold SOC 2, ISO 27001,
              HIPAA, or PCI DSS certifications. We are committed to pursuing SOC 2 Type II
              certification as the product matures. If your organization has specific compliance
              requirements, contact us at{" "}
              <Link href="mailto:brucelee@itsquare.ai" className="text-primary hover:underline">
                brucelee@itsquare.ai
              </Link>{" "}
              to discuss.
            </p>
          </section>

          {/* Footer links */}
          <div className="pt-8 border-t border-border/30 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/sub-processors" className="hover:text-foreground transition-colors">Sub-Processors</Link>
          </div>

        </div>
      </div>
    </div>
  )
}
