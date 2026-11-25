"use client"

import { useState, type FormEvent, type ReactNode } from "react"

const contactEmail = "bensassi.faysel@itsquare.ai"

function MailtoForm({
  subject,
  children,
  formName,
}: {
  subject: string
  children: (status: string) => ReactNode
  formName: string
}) {
  const [status, setStatus] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fieldLabels: Record<string, string> = {
      name: "Name",
      company: "Company",
      email: "Email",
      phone: "Phone",
      practice: "Practice",
      needs: "What they need help with",
      message: "How we can help",
    }
    const fields = Array.from(formData.entries()).filter(([key]) => key !== "consent")
    const bodyLines = fields.map(([key, value]) => `${fieldLabels[key] ?? key}: ${String(value)}`)
    if (formData.get("consent") === "on") bodyLines.push("Permission to share these business contact details: Yes")
    const body = bodyLines.join("\n")
    setStatus("Your email app should open with this message. Please review it and send it to complete your request.")
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return <form className="lead-form" onSubmit={handleSubmit} data-analytics={`form-${formName}`}>
    {children(status)}
  </form>
}

function TextField({ label, name, type = "text", required = true }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label className="form-field">
    <span>{label}{required && <span aria-hidden="true"> *</span>}</span>
    <input name={name} type={type} required={required} autoComplete={name === "phone" ? "tel" : name === "email" ? "email" : name === "name" ? "name" : undefined} />
  </label>
}

export function PartnerReferralForm() {
  return <MailtoForm subject="Practice referral" formName="partner-referral">
    {(status) => <>
      <div className="form-grid">
        <TextField label="Your name" name="name" />
        <TextField label="Company" name="company" />
        <TextField label="Your email" name="email" type="email" />
        <TextField label="Your phone" name="phone" type="tel" />
        <TextField label="Practice name" name="practice" />
      </div>
      <label className="form-field">
        <span>What does the practice need help with?</span>
        <textarea name="needs" rows={4} placeholder="Please do not include patient information." />
      </label>
      <p className="form-note">Please don&apos;t include patient information.</p>
      <label className="consent-field">
        <input name="consent" type="checkbox" required />
        <span>I have permission to share these business contact details with IT Square.</span>
      </label>
      <button type="submit" className="button button--primary">Prepare referral email</button>
      <p className="form-note">This form opens your email app. It does not send or store the information on this website.</p>
      {status && <p role="status" className="form-status">{status}</p>}
    </>}
  </MailtoForm>
}

export function ContactForm() {
  return <MailtoForm subject="Website inquiry" formName="contact">
    {(status) => <>
      <div className="form-grid">
        <TextField label="Your name" name="name" />
        <TextField label="Your email" name="email" type="email" />
        <TextField label="Your phone" name="phone" type="tel" required={false} />
        <TextField label="Practice name" name="practice" required={false} />
      </div>
      <label className="form-field">
        <span>How can we help?</span>
        <textarea name="message" rows={5} required placeholder="Please do not include patient information." />
      </label>
      <p className="form-note">Please don&apos;t include patient health information.</p>
      <button type="submit" className="button button--primary">Prepare email</button>
      <p className="form-note">Your email app opens with the message. Nothing is submitted or stored on this website.</p>
      {status && <p role="status" className="form-status">{status}</p>}
    </>}
  </MailtoForm>
}
