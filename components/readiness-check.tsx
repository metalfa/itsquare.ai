"use client"

import { useState, type FormEvent } from "react"
import { ArrowRight, Check, RotateCcw } from "lucide-react"
import { BookCallLink } from "@/components/site-elements"

const questionGroups = [
  {
    title: "Insurance & security",
    questions: [
      { id: "mfa", question: "Does every staff email account require a second sign-in step?", fix: "Require a second sign-in step for every staff email account." },
      { id: "monitoring", question: "Is security software monitored around the clock on practice computers?", fix: "Confirm which practice computers have monitored security software." },
      { id: "backup-restore", question: "Has someone restored a file from your backups in the last 90 days?", fix: "Restore a test file and record what worked and how long it took." },
      { id: "response-plan", question: "Do you have a written incident response plan with current contacts?", fix: "Write down who to contact and the first steps for an IT incident." },
    ],
  },
  {
    title: "HIPAA",
    questions: [
      { id: "risk-analysis", question: "Do you have a written HIPAA risk analysis from the last 12 months?", fix: "Complete or refresh a written HIPAA risk analysis." },
      { id: "staff-training", question: "Have staff received privacy and security guidance for their current roles?", fix: "Give staff role-based privacy and security guidance and record completion." },
      { id: "policies", question: "Are written security policies available to the people who need them?", fix: "Review written security policies and make them easy for staff to find." },
      { id: "access-review", question: "Does someone review who can access practice systems?", fix: "Review account access and remove access that is no longer needed." },
    ],
  },
  {
    title: "AI use",
    questions: [
      { id: "ai-inventory", question: "Do you know which AI tools your staff use for work?", fix: "Make a simple list of the AI tools staff use for work." },
      { id: "ai-rules", question: "Do you have written rules about what can go into AI tools?", fix: "Write down what staff may and may not enter into AI tools." },
      { id: "ai-approval", question: "Are AI tools reviewed and approved before staff use them with practice work?", fix: "Choose approved tools and document who can use them and for what." },
      { id: "baa", question: "For patient-related AI tasks, have you checked for a Business Associate Agreement?", fix: "Before any patient-related AI use, check the tool, its settings, and whether a Business Associate Agreement is in place." },
    ],
  },
] as const

type Answer = "yes" | "no" | "unsure"
type Answers = Record<string, Answer>

type Question = (typeof questionGroups)[number]["questions"][number]

const questions: readonly Question[] = questionGroups.flatMap<Question>((group) => group.questions)

function getBand(score: number) {
  if (score >= 10) return { label: "Ready", tone: "ready", description: "Your answers show several useful safeguards are in place. Keep the documentation current and review changes." }
  if (score >= 6) return { label: "Gaps to address", tone: "gaps", description: "You have some safeguards in place. Start with the highest-priority gaps below." }
  return { label: "At risk", tone: "risk", description: "Several important safeguards need attention. Begin with the practical steps below." }
}

export function ReadinessCheck() {
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState<Answers>({})
  const [emailStatus, setEmailStatus] = useState("")
  const [emailFormOpen, setEmailFormOpen] = useState(false)
  const answeredCount = Object.keys(answers).length
  const complete = answeredCount === questions.length
  const score = questions.reduce((total, question) => total + (answers[question.id] === "yes" ? 1 : 0), 0)
  const band = getBand(score)
  const fixes = questions.filter((question) => answers[question.id] !== "yes").slice(0, 3).map(({ fix }) => fix)

  function handleAnswer(questionId: string, answer: Answer) {
    setAnswers((current) => ({ ...current, [questionId]: answer }))
  }

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "")
    const email = String(formData.get("email") ?? "")
    const practice = String(formData.get("practice") ?? "")
    const answerSummary = questions.map(({ question, id }) => `${question}\nAnswer: ${answers[id] ?? "Not answered"}`).join("\n\n")
    const body = `Name: ${name}\nEmail: ${email}\nPractice: ${practice}\nReadiness score: ${score}/12 (${band.label})\n\n${answerSummary}\n\nPlease do not include patient information.`
    setEmailStatus("Your email app should open with your checklist. Review it and send it to complete the request.")
    window.location.href = `mailto:bensassi.faysel@itsquare.ai?subject=${encodeURIComponent("Practice Readiness Check")}&body=${encodeURIComponent(body)}`
  }

  function resetQuiz() {
    setAnswers({})
    setStarted(false)
    setEmailStatus("")
    setEmailFormOpen(false)
  }

  return <div className="readiness-check">
    {!started ? <section className="quiz-intro" aria-labelledby="quiz-start-heading"><div><p className="eyebrow">12 questions · about 5 minutes</p><h2 id="quiz-start-heading">A quick, private starting point.</h2><p>Your answers stay in this browser session. You can see your score without sharing your name or email. Do not enter patient information.</p></div><button className="button button--primary" type="button" data-analytics="readiness-start" onClick={() => setStarted(true)}>Start the check <ArrowRight aria-hidden="true" /></button></section> : <>
      <div className="quiz-progress" aria-live="polite"><span>{answeredCount} of 12 answered</span><div className="quiz-progress__track" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={12} aria-valuenow={answeredCount}><span style={{ width: `${(answeredCount / 12) * 100}%` }} /></div></div>
      <form className="quiz-form" data-analytics="readiness-quiz">
        {questionGroups.map((group, groupIndex) => <fieldset className="quiz-group" key={group.title}><legend><span>0{groupIndex + 1}</span>{group.title}</legend><div className="quiz-group__questions">{group.questions.map(({ id, question }, questionIndex) => <div className="quiz-question" key={id}><h3><span>{String(groupIndex * 4 + questionIndex + 1).padStart(2, "0")}</span>{question}</h3><div className="quiz-options" role="group" aria-label={`Answer: ${question}`}>{(["yes", "no", "unsure"] as Answer[]).map((answer) => <label className={`quiz-option${answers[id] === answer ? " is-selected" : ""}`} key={answer}><input type="radio" name={id} value={answer} checked={answers[id] === answer} onChange={() => handleAnswer(id, answer)} data-analytics={answeredCount === 0 ? "readiness-start" : "readiness-answer"} /><span>{answer === "yes" ? "Yes" : answer === "no" ? "No" : "Not sure"}</span></label>)}</div></div>)}</div></fieldset>)}
      </form>
      {complete && <section className="quiz-result" aria-live="polite" data-analytics="readiness-finish"><div className="quiz-result__top"><div><p className="eyebrow">Your result</p><h2>{score} <span>/ 12</span></h2></div><span className={`quiz-band quiz-band--${band.tone}`}>{band.label}</span></div><p className="quiz-result__description">{band.description}</p><h3>Your three next steps</h3><ol>{(fixes.length ? fixes : ["Keep your safeguards documented and review changes to systems and staff.", "Recheck your backup recovery process and retain the test result.", "Review staff AI rules when tools or work practices change."]).map((fix, index) => <li key={fix}><span>0{index + 1}</span>{fix}</li>)}</ol><p className="quiz-disclaimer">This self-check is educational. It is not a HIPAA compliance determination, legal advice, or an insurance decision.</p><div className="quiz-result__actions"><BookCallLink /><button type="button" className="button button--secondary" data-analytics="readiness-email-open" onClick={() => setEmailFormOpen((open) => !open)}>{emailFormOpen ? "Close email option" : "Email me my checklist"}</button><button type="button" className="quiz-reset" onClick={resetQuiz}><RotateCcw aria-hidden="true" />Start over</button></div>
        {emailFormOpen && <form className="lead-form quiz-email-form" onSubmit={handleEmailSubmit} data-analytics="readiness-email-submit"><div className="form-grid"><label className="form-field"><span>Your name *</span><input name="name" autoComplete="name" required /></label><label className="form-field"><span>Email *</span><input name="email" type="email" autoComplete="email" required /></label><label className="form-field"><span>Practice name *</span><input name="practice" autoComplete="organization" required /></label></div><label className="consent-field"><input type="checkbox" name="consent" required /><span>I agree to open an email draft with my checklist and contact details.</span></label><p className="form-note">Please don’t include patient information. This opens your email app; the website does not send or store these details.</p><button className="button button--primary" type="submit">Prepare checklist email</button>{emailStatus && <p className="form-status" role="status">{emailStatus}</p>}</form>}
      </section>}
    </>}
  </div>
}