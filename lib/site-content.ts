export const controls = [
  {
    short: "MFA",
    title: "Multi-factor sign-in",
    term: "A second sign-in check, such as a phone prompt, in addition to a password.",
    why: "It makes a stolen password harder to use to reach email and other practice systems.",
    how: "We review staff and administrator accounts, configure the agreed sign-in requirements, and document the result.",
    proof: "A dated account and system checklist showing where the requirement is enabled.",
  },
  {
    short: "EDR",
    title: "Monitored security software",
    term: "Endpoint detection and response (EDR) is software that looks for suspicious activity on computers and sends alerts for review.",
    why: "Insurer applications may ask how computers are protected and whether security alerts are watched.",
    how: "We use monitored security software as part of the monthly plan. A person reviews issues that could affect patients or data.",
    proof: "A list of covered devices and a record of monitoring status.",
  },
  {
    short: "BACKUPS",
    title: "Tested backups",
    term: "A backup is a separate copy of information that can be restored after deletion, damage, or an attack.",
    why: "A backup only helps if it covers the right systems and can be restored when needed.",
    how: "We review coverage, monitor backups, and test restores on an agreed schedule.",
    proof: "The backup scope and a dated record of a restore test.",
  },
  {
    short: "RESPONSE",
    title: "Incident response plan",
    term: "A written plan that says who to contact and what to do when a security problem occurs.",
    why: "A clear first step helps a busy team act without guessing during a disruption.",
    how: "We document contacts, roles, and first actions with your practice.",
    proof: "A practice-specific plan with named owners and contact steps.",
  },
  {
    short: "HIPAA",
    title: "HIPAA risk analysis",
    term: "A written review of risks and weaknesses affecting electronic protected health information.",
    why: "The HIPAA Security Rule requires a written risk analysis. See 45 CFR 164.308(a)(1)(ii)(A).",
    how: "We review relevant systems and safeguards, rank gaps, and refresh the analysis yearly in the monthly plan.",
    proof: "A written analysis and a prioritized list of findings for your records.",
  },
]

export const homeFaqs = [
  { question: "Do you work onsite?", answer: "Onsite work is available in Chicagoland. Remote services are available nationwide." },
  { question: "Can we keep our current IT person?", answer: "Yes. We can agree on a defined scope and coordinate with your current IT person where the practice approves it." },
  { question: "Is ChatGPT allowed in a medical office?", answer: "It depends on the tool and what you enter. Free and personal chatbot versions do not come with a Business Associate Agreement, so patient information should not go into them. We help set up approved tools and staff rules." },
  { question: "What does the assessment include?", answer: "A written HIPAA risk analysis, ranked security gaps, help with your insurance questionnaire, your practice’s AI rules, and a fixed-price plan." },
  { question: "Do you work with our EHR or dental software?", answer: "We review the IT environment around your practice software and can coordinate IT-related questions with its vendor. Your software provider remains responsible for its own product." },
  { question: "How is pricing set?", answer: "The assessment is $1,500 for practices with fewer than 10 staff and up to $3,000 for larger practices. Protected Practice is priced per user after your assessment." },
  { question: "What if we are attacked?", answer: "Your incident response plan records first steps and contacts. We help with IT-side response within the written service scope. No plan can promise that every incident or interruption will be prevented." },
  { question: "Do you work outside Chicago?", answer: "Yes. Remote services are available nationwide. Onsite services are in Chicagoland." },
]

export const healthcareFaqs = [
  homeFaqs[0],
  homeFaqs[1],
  { question: "Does this guarantee cyber insurance approval?", answer: "No. We help put safeguards in place and document the work. Insurers decide whether to offer coverage and on what terms." },
  { question: "What is included in Protected Practice?", answer: "Multi-factor sign-in, 24/7 monitored security software, tested backups, an incident response plan, safe-AI setup and staff rules, a help desk, updates, and a yearly risk analysis refresh. Pricing is per user and shared after your assessment." },
  { question: "How long does onboarding take?", answer: "We agree the scope and sequence in writing after the assessment. The schedule depends on your systems, vendors, and decisions." },
  homeFaqs[6],
]

export const assessmentFaqs = [
  { question: "What does the assessment cost?", answer: "It is $1,500 for practices with fewer than 10 staff and up to $3,000 for larger practices. We confirm the fee and scope before work begins." },
  { question: "Is the assessment fee credited toward ongoing service?", answer: "Yes. If you continue with ITSquare.ai within 30 days, the assessment fee is credited toward onboarding." },
  { question: "Does the report guarantee insurance approval?", answer: "No. The report documents risks and a plan to address them. Your insurer makes all coverage decisions." },
]

export const assessmentRiskReversal = "If the assessment doesn’t give you a clear, prioritized plan you can act on, you don’t pay for it."
export const foundingPracticeSpotsRemaining = 5
export const assessmentTimeline = {
  reviewHours: "2–3 hours",
  reportTurnaround: "10 business days",
}

export const businessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ITSquare.ai",
  url: "https://itsquare.ai",
  email: "bensassi.faysel@itsquare.ai",
  telephone: "+1-773-837-3043",
  areaServed: [
    { "@type": "City", name: "Chicago, IL" },
    { "@type": "Country", name: "United States" },
  ],
  address: { "@type": "PostalAddress", addressLocality: "Chicago", addressRegion: "IL", addressCountry: "US" },
  founder: {
    "@type": "Person",
    name: "Faycal Ben Sassi",
    jobTitle: "Founder",
    worksFor: { "@type": "Organization", name: "ITSquare.ai" },
  },
}
