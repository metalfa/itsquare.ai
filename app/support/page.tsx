import Link from "next/link"
import { ArrowLeft, Mail, MessageSquare, BookOpen, Zap, Clock, ChevronRight } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Support | ITSquare.AI",
  description: "Get help with ITSquare.AI — documentation, FAQs, and direct support from our team.",
}

const faqs = [
  {
    q: "How do I start using ITSquare.AI in Slack?",
    a: "After installing the app, simply send a direct message to the ITSquare.AI bot in Slack, or @mention it in any channel it has been added to. Describe your IT issue in plain English and the bot will start diagnosing immediately.",
  },
  {
    q: "How do I run a device diagnostic?",
    a: "Ask the bot about a device issue (e.g. 'my laptop is slow') and it will send you a one-click diagnostic link. Open the link in your browser — no installs required. The scan takes about 10 seconds and results appear directly in your Slack thread.",
  },
  {
    q: "How do I add company knowledge to the bot?",
    a: "Go to your dashboard at itsquare.ai/dashboard/knowledge. You can upload documents, paste text, or add URLs. The bot will use this knowledge to give company-specific answers to your team.",
  },
  {
    q: "What's included in the Free plan?",
    a: "The Free plan includes 50 AI conversations per month for your entire workspace. It includes full access to AI troubleshooting, device diagnostics, and knowledge base search. No credit card required.",
  },
  {
    q: "How do I upgrade to Pro?",
    a: "Go to itsquare.ai/dashboard/billing and click 'Upgrade to Pro'. Pro unlocks unlimited conversations at $8/user/month, billed monthly. You can cancel anytime from the same page.",
  },
  {
    q: "How do I cancel my Pro subscription?",
    a: "Go to itsquare.ai/dashboard/billing and click 'Cancel Subscription'. You keep Pro access until the end of your current billing period — no immediate downgrade. You can reactivate anytime.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All Slack tokens are encrypted with AES-256-GCM. Data is isolated per workspace — no workspace can access another's data. All traffic is encrypted in transit. See our Privacy Policy for full details.",
  },
  {
    q: "Does ITSquare.AI read all my Slack messages?",
    a: "No. The bot only reads direct messages sent to it and messages where it is explicitly @mentioned. It does not have access to channels it hasn't been invited to, and it never reads messages that don't involve it.",
  },
  {
    q: "How do I remove ITSquare.AI from my workspace?",
    a: "Go to your Slack workspace settings → Manage Apps → ITSquare.AI → Remove App. This immediately revokes all access. Contact us at brucelee@itsquare.ai to request full data deletion.",
  },
  {
    q: "The bot isn't responding. What do I check?",
    a: "First, make sure the bot has been added to the channel (use /invite @ITSquare). Check that your workspace is on an active plan and hasn't hit the Free plan message limit. If the issue persists, contact support below.",
  },
]

export default function SupportPage() {
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

        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-black tracking-tighter mb-4">
            Support
          </h1>
          <p className="text-lg text-foreground-variant leading-relaxed">
            Need help with ITSquare.AI? You&apos;re in the right place. Browse the FAQ
            or reach out to us directly — we typically respond within one business day.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          <a
            href="mailto:brucelee@itsquare.ai"
            className="group flex flex-col gap-3 p-5 rounded-xl border border-border/50 bg-surface-container hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="p-2 w-fit rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Email Support</p>
              <p className="text-xs text-muted-foreground mt-0.5">brucelee@itsquare.ai</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-auto" />
          </a>

          <Link
            href="/dashboard"
            className="group flex flex-col gap-3 p-5 rounded-xl border border-border/50 bg-surface-container hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="p-2 w-fit rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Your Dashboard</p>
              <p className="text-xs text-muted-foreground mt-0.5">Billing, KB, settings</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-auto" />
          </Link>

          <Link
            href="/docs"
            className="group flex flex-col gap-3 p-5 rounded-xl border border-border/50 bg-surface-container hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="p-2 w-fit rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Documentation</p>
              <p className="text-xs text-muted-foreground mt-0.5">Guides &amp; setup</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors mt-auto" />
          </Link>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight mb-8 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border/50 bg-surface-container overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-primary/5 transition-colors">
                  <span className="font-medium text-foreground text-sm leading-relaxed">
                    {faq.q}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">
                    {faq.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-2">
                Still need help?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Send us an email and we&apos;ll get back to you within one business day.
                Include your Slack workspace name and a description of the issue
                so we can help you faster.
              </p>
              <a
                href="mailto:brucelee@itsquare.ai?subject=ITSquare.AI Support Request"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-border/30 flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
          <a href="mailto:brucelee@itsquare.ai" className="hover:text-foreground transition-colors">brucelee@itsquare.ai</a>
        </div>
      </div>
    </div>
  )
}
