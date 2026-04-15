import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sub-Processors | ITSquare.AI",
  description: "List of third-party sub-processors used by ITSquare.AI to deliver its service.",
}

const subProcessors = [
  {
    name: "OpenAI, LLC",
    purpose: "Artificial intelligence — generates IT support responses (GPT-4o-mini) and vector embeddings (text-embedding-3-small) for knowledge base search",
    dataTypes: "User messages, conversation context, knowledge base content",
    location: "United States",
    link: "https://openai.com/policies/privacy-policy",
  },
  {
    name: "Supabase, Inc.",
    purpose: "Database hosting — stores conversation history, workspace configuration, device diagnostic data, knowledge base documents, and user account data in PostgreSQL",
    dataTypes: "All Customer Data (conversations, device scans, workspace config, user identifiers)",
    location: "United States (AWS us-east-1)",
    link: "https://supabase.com/privacy",
  },
  {
    name: "Vercel, Inc.",
    purpose: "Application hosting — runs the ITSquare.AI API and web dashboard as serverless functions; processes all inbound Slack events and API requests",
    dataTypes: "All data passing through the application layer (Slack events, API requests, dashboard sessions)",
    location: "United States (AWS us-east-1)",
    link: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Stripe, Inc.",
    purpose: "Payment processing — handles subscription billing, invoice generation, and payment method storage for Pro plan customers",
    dataTypes: "Billing information (payment method, invoice history, subscription status). No Slack workspace data is shared with Stripe.",
    location: "United States",
    link: "https://stripe.com/privacy",
  },
  {
    name: "Slack Technologies, LLC",
    purpose: "Platform provider — ITSquare.AI is built on the Slack platform. Slack processes messages and events as part of normal platform operation",
    dataTypes: "Messages and events processed through Slack's platform APIs",
    location: "United States",
    link: "https://slack.com/intl/en-us/trust/privacy/privacy-policy",
  },
]

export default function SubProcessorsPage() {
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
          Sub-Processors
        </h1>
        <p className="text-sm text-foreground-variant mb-4">
          Last updated: April 2026
        </p>
        <p className="text-foreground-variant leading-relaxed mb-12">
          IT Square, Inc. uses the following third-party sub-processors to deliver the ITSquare.AI
          service. Each sub-processor has been evaluated for data protection compliance and is
          bound by appropriate data processing agreements. We will update this page at least 30
          days before adding any new sub-processor that processes Customer Data.
        </p>

        <div className="space-y-6">
          {subProcessors.map((sp) => (
            <div
              key={sp.name}
              className="rounded-xl border border-border/50 bg-surface-container p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold text-foreground">{sp.name}</h2>
                <a
                  href={sp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Privacy Policy ↗
                </a>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Purpose
                  </span>
                  <p className="text-sm text-foreground-variant mt-1 leading-relaxed">
                    {sp.purpose}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Data Processed
                  </span>
                  <p className="text-sm text-foreground-variant mt-1 leading-relaxed">
                    {sp.dataTypes}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Data Location
                  </span>
                  <p className="text-sm text-foreground-variant mt-1">{sp.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            To object to the use of a sub-processor or request more information, contact us at{" "}
            <Link href="mailto:brucelee@itsquare.ai" className="text-primary hover:underline">
              brucelee@itsquare.ai
            </Link>
            . For our full privacy practices, see our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
