import Link from "next/link"
import { ArrowLeft, Mail, MapPin, Calendar } from "lucide-react"

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
          Ready to automate your IT infrastructure? Get in touch with our team.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="ghost-border bg-surface-container p-8">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Email</h3>
            </div>
            <Link 
              href="mailto:brucelee@itsquare.ai"
              className="text-foreground-variant hover:text-primary transition-colors"
            >
              brucelee@itsquare.ai
            </Link>
          </div>

          <div className="ghost-border bg-surface-container p-8">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Location</h3>
            </div>
            <p className="text-foreground-variant">
              Chicago, IL<br />
              United States
            </p>
          </div>
        </div>

        <div className="mt-12 p-8 bg-surface-container-high ghost-border border-l-4 border-l-primary-container">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Schedule a Call</h3>
          </div>
          <p className="text-foreground-variant mb-6">
            The fastest way to get started. Book a 15-minute discovery call with our team.
          </p>
          <Link
            href="https://calendly.com/bensassi-faysel/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary-container text-white px-6 py-3 text-sm font-bold hover:scale-[0.98] transition-transform"
          >
            Book Discovery Call
          </Link>
        </div>
      </div>
    </div>
  )
}
