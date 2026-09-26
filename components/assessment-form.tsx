'use client'

import { FormEvent, useState } from 'react'

const initialForm = {
  practiceName: '',
  name: '',
  role: '',
  email: '',
  phone: '',
  software: '',
  people: '',
  concern: '',
}

export function AssessmentForm() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    const required = ['practiceName', 'name', 'role', 'email', 'phone', 'software', 'people']
    required.forEach((field) => {
      if (!form[field as keyof typeof form]) nextErrors[field] = 'Please fill out this field.'
    })
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="border border-[var(--hairline)] bg-[var(--surface)] p-8 sm:p-10" role="status">
        <p className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Request received</p>
        <h3 className="mt-4 font-sans text-2xl font-bold tracking-[-0.03em] text-[var(--ink)]">I&apos;ll be in touch within one business day.</h3>
        <p className="mt-4 max-w-[42rem] text-lg leading-relaxed text-[var(--muted)]">I&apos;ll email you to find a time. No automated sequences, no sales calls, no one else contacting you.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Practice name" name="practiceName" value={form.practiceName} error={errors.practiceName} update={update} />
        <FormField label="Your name" name="name" value={form.name} error={errors.name} update={update} />
        <SelectField label="Role" name="role" value={form.role} error={errors.role} update={update} options={['Dentist', 'Office manager', 'Other']} />
        <FormField label="Email" name="email" type="email" value={form.email} error={errors.email} update={update} />
        <FormField label="Phone" name="phone" type="tel" value={form.phone} error={errors.phone} update={update} />
        <SelectField label="Practice management software" name="software" value={form.software} error={errors.software} update={update} options={['Open Dental', 'Dentrix', 'Eaglesoft', 'Other', 'Not sure']} />
        <SelectField label="Roughly how many people work there" name="people" value={form.people} error={errors.people} update={update} options={['1–5', '6–10', '11–20', '21+']} />
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--ink)] sm:col-span-2">Anything specific you&apos;re worried about? <textarea value={form.concern} onChange={(event) => update('concern', event.target.value)} rows={5} className="border border-[var(--hairline)] bg-transparent px-4 py-3 font-serif text-lg font-normal outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></label>
      <button type="submit" className="w-full bg-[var(--accent)] px-6 py-4 text-center font-sans text-sm font-bold text-white transition hover:bg-[#0a4743] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 sm:w-fit">Request the assessment</button>
    </form>
  )
}

function FormField({ label, name, type = 'text', value, error, update }: { label: string; name: string; type?: string; value: string; error?: string; update: (name: string, value: string) => void }) {
  return <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--ink)]">{label}<input required type={type} value={value} onChange={(event) => update(name, event.target.value)} aria-invalid={Boolean(error)} className="border border-[var(--hairline)] bg-transparent px-4 py-3 font-serif text-lg font-normal outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />{error && <span className="font-sans text-xs font-normal text-[var(--attention)]">{error}</span>}</label>
}

function SelectField({ label, name, value, error, update, options }: { label: string; name: string; value: string; error?: string; update: (name: string, value: string) => void; options: string[] }) {
  return <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--ink)]">{label}<select required value={value} onChange={(event) => update(name, event.target.value)} aria-invalid={Boolean(error)} className="border border-[var(--hairline)] bg-[var(--background)] px-4 py-3 font-serif text-lg font-normal outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"><option value="">Select one</option>{options.map((option) => <option key={option}>{option}</option>)}</select>{error && <span className="font-sans text-xs font-normal text-[var(--attention)]">{error}</span>}</label>
}
