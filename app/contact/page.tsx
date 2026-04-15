import Link from "next/link"
import { ArrowLeft, Mail, MapPin, Calendar, LifeBuoy } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | ITSquare.AI",
  description: "Get in touch with the ITSquare.AI team.",
}

export default function ContactPage() {
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
          Contact Us
        </h1>
        <p className="text-lg text-foreground-variant mb-16 max-w-2xl">
          Questions about ITSquare.AI? Want to see it in action for your team?
          We&apos;re happy to help.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a
            href="mailto:brucelee@itsquare.ai"
            className="ghost-border bg-surface-container p-8 hover:border-primary/40 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold">Email</h3>
            </div>
            <p className="text-foreground-variant text-sm hover:text-primary transition-colors">
              brucelee@itsquare.ai
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Typically responds within one business day
            </p>
          </a>

          <div className="ghost-border bg-surface-container p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold">Location</h3>
            </div>
            <p className="text-foreground-variant text-sm">
              Chicago, Illinois<br />
              United States
            </p>
          </div>
        </div>

        {/* Book a call */}
        <div className="p-8 bg-surface-container ghost-border border-l-4 border-l-primary rounded-xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold">Book a Demo</h3>
          </div>
          <p className="text-foreground-variant text-sm mb-6 leading-relaxed">
            See ITSquare.AI live in a 15-minute call. We&apos;ll walk you through the setup,
            show you how the bot handles real IT requests, and answer any questions.
          </p>
          <a
            href="https://calendly.com/bensassi-faysel/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book a 15-min Demo
          </a>
        </div>

        {/* Support link */}
        <div className="flex items-center gap-4 p-6 rounded-xl border border-border/50 bg-surface-container/50">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Looking for technical support?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              FAQs, troubleshooting guides, and direct support
            </p>
          </div>
          <Link
            href="/support"
            className="text-sm font-semibold text-primary hover:underline shrink-0"
          >
            Visit Support →
          </Link>
        </div>
      </div>
    </div>
  )
}
