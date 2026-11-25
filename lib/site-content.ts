export const controls = [
  {
    short: "MFA",
    title: "Multi-factor sign-in",
    term: "Multi-factor sign-in (MFA) adds a second check, like a phone prompt, to a password.",
    why: "It makes a stolen password harder to use to access email, records, and other business systems.",
    how: "We configure it for staff and administrator accounts, then document where it is enabled.",
    proof: "A current account and system checklist showing sign-in requirements.",
  },
  {
    short: "EDR",
    title: "Monitored security software",
    term: "Endpoint detection and response (EDR) is security software that looks for suspicious activity on computers.",
    why: "Insurers may ask how computers are protected and whether alerts are watched.",
    how: "We install and manage security software with 24/7 monitoring, as part of the monthly plan.",
    proof: "An inventory of covered devices and a record of monitoring status.",
  },
  {
    short: "BACKUPS",
    title: "Tested backups",
    term: "A backup is a separate copy of information that can be restored after deletion, damage, or an attack.",
    why: "A backup only helps if it includes the right systems and can be restored when needed.",
    how: "We review coverage, monitor backups, and test restores on a schedule.",
    proof: "A backup scope and dated restore-test record.",
  },
  {
    short: "RESPONSE",
    title: "Incident response plan",
    term: "An incident response plan records who to contact and what to do when a security problem occurs.",
    why: "A written plan helps a busy team make decisions without guessing during a disruption.",
    how: "We document roles, contacts, and first steps with your practice.",
    proof: "A practice-specific plan with owners and contact steps.",
  },
  {
    short: "HIPAA",
    title: "HIPAA risk analysis",
    term: "A HIPAA risk analysis is a written assessment of risks and vulnerabilities to protected health information.",
    why: "The HIPAA Security Rule requires covered entities and business associates to conduct an accurate and thorough risk analysis.",
    how: "We review systems and safeguards, rank gaps, and refresh the analysis yearly in the monthly plan.",
    proof: "A written analysis and prioritized list of findings for your records.",
  },
]

export const homeFaqs = [
  { question: "Do you work onsite?", answer: "Yes. IT Square is based in Chicago and can provide onsite or remote support for practices in Chicago and nearby suburbs. The right mix depends on the work and your service scope." },
  { question: "What does the risk assessment include?", answer: "A written HIPAA risk analysis, a ranked list of security gaps, answers you can use for your cyber insurance questionnaire, and a fixed-price plan to address the gaps." },
  { question: "Do I have to switch all my IT to you?", answer: "No. We can start with the assessment and define what support makes sense next. Any ongoing responsibilities are agreed in writing before work begins." },
  { question: "Will you work with our EHR or practice software vendor?", answer: "We can coordinate with your software vendors on IT-related issues. Your practice software vendor remains responsible for its own product and support." },
  { question: "How is pricing set?", answer: "The HIPAA Risk Assessment starts at $1,500: $1,500 for practices with fewer than 10 staff and up to $3,000 for larger practices. Protected Practice pricing is shared after the assessment." },
  { question: "What happens if we get attacked?", answer: "Your incident response plan documents first steps and who to contact. We help with IT-side containment and recovery within the agreed service scope. We do not promise that an incident or downtime can always be prevented." },
]

export const healthcareFaqs = [
  homeFaqs[0],
  homeFaqs[1],
  { question: "Does this guarantee cyber insurance approval?", answer: "No. IT Square can help put controls in place and document them, but insurers decide whether to offer coverage and on what terms." },
  { question: "What is included in Protected Practice?", answer: "The per-user monthly plan covers multi-factor sign-in, 24/7 monitored security software, tested backups, an incident response plan, a yearly HIPAA risk analysis refresh, help desk, and updates. Pricing is shared after your assessment." },
  { question: "How long does onboarding take?", answer: "The working outline is an assessment in week one, controls put in place during weeks two to four, then monthly reviews. Timing depends on your systems, vendors, and decisions." },
  homeFaqs[5],
]

export const assessmentFaqs = [
  { question: "What does the assessment cost?", answer: "It starts at $1,500: $1,500 for practices with fewer than 10 staff and up to $3,000 for larger practices." },
  { question: "Is the assessment fee credited toward ongoing service?", answer: "Yes. If you continue with IT Square within 30 days, the assessment fee is credited toward onboarding." },
  { question: "Does the report guarantee insurance approval?", answer: "No. The report documents your current risks and a plan to address them. Your insurer makes all coverage decisions." },
]

export const businessSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "IT Square",
  url: "https://itsquare.ai",
  email: "bensassi.faysel@itsquare.ai",
  telephone: "+1-773-837-3043",
  areaServed: "Chicago, IL",
  founder: { "@type": "Person", name: "Faycal Ben Sassi" },
}
