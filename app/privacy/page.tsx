import type { Metadata } from "next"
import { BreadcrumbJsonLd } from "@/components/site-elements"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "A plain-English explanation of how the IT Square website and contact options handle information.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return <main className="page-shell">
    <BreadcrumbJsonLd items={[{ label: "Home", href: "/" }, { label: "Privacy Policy", href: "/privacy" }]} />
    <section className="section"><article className="container--narrow">
      <p className="eyebrow">Plain-English notice</p>
      <h1 className="display-title">Privacy Policy</h1>
      <p className="body-copy mt-5">Last updated: November 25, 2026</p>
      <div className="article mt-10">
        <h2>Information you choose to send</h2>
        <p>When you use a contact or referral form, the website opens your email app with the details you entered. The site does not send or store those form details. You decide whether to send the email to IT Square.</p>
        <p>Please do not include patient names, health information, or other patient data in website forms or email inquiries.</p>
        <h2>Booking a call</h2>
        <p>Call booking is provided by Calendly, including the booking calendar embedded on this website. If you book a time, Calendly may collect information under its own privacy terms. Please review Calendly’s privacy notice before submitting booking details.</p>
        <h2>Website operation</h2>
        <p>The website is hosted online. The hosting platform may process routine technical information needed to deliver and secure the site. IT Square does not add advertising pixels or third-party analytics trackers to this website.</p>
        <h2>How to contact us</h2>
        <p>For questions about this notice or a request about information you have sent us, email <a className="font-semibold text-primary underline" href="mailto:bensassi.faysel@itsquare.ai">bensassi.faysel@itsquare.ai</a> or call <a className="font-semibold text-primary underline" href="tel:+17738373043">(773) 837-3043</a>.</p>
      </div>
    </article></section>
  </main>
}
