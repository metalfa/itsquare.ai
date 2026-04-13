/**
 * Diagnostic Flow Engine — guided troubleshooting through Slack buttons.
 *
 * Instead of CLI commands, the bot asks smart questions through interactive
 * Slack messages. Each answer narrows the diagnosis. Users click buttons
 * instead of running terminal commands.
 *
 * Flow:
 *   1. AI generates diagnostic questions (yes/no, multiple choice)
 *   2. Questions become Slack Block Kit messages with buttons
 *   3. User clicks an answer → stored → AI gets the answer as context
 *   4. AI narrows diagnosis, proposes fix or asks next question
 *   5. Fix is presented as a guided walkthrough with [✅ Fixed] [😞 Still broken]
 *
 * Format the AI outputs:
 *   [DIAGNOSTIC]
 *   Can you open google.com in your browser? | yes_no
 *   Which WiFi network are you connected to? | choice:Home WiFi,Office WiFi,Not sure
 *   [/DIAGNOSTIC]
 *
 *   [FIX]
 *   Disconnect and reconnect to WiFi | Go to WiFi icon in menu bar → click your network → Disconnect, then reconnect
 *   Restart your router | Unplug your router, wait 30 seconds, plug it back in
 *   [/FIX]
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiagnosticQuestion {
  question: string
  type: 'yes_no' | 'choice'
  options?: string[]  // for choice type
}

export interface FixStep {
  title: string
  instructions: string
}

export interface DiagnosticParseResult {
  cleanText: string
  questions: DiagnosticQuestion[] | null
  fixSteps: FixStep[] | null
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const DIAGNOSTIC_BLOCK_REGEX = /\[DIAGNOSTIC\]\n([\s\S]*?)\n\[\/DIAGNOSTIC\]/
const FIX_BLOCK_REGEX = /\[FIX\]\n([\s\S]*?)\n\[\/FIX\]/

/**
 * Parse an AI response for diagnostic questions and fix steps.
 */
export function parseDiagnosticResponse(aiResponse: string): DiagnosticParseResult {
  let cleanText = aiResponse
  let questions: DiagnosticQuestion[] | null = null
  let fixSteps: FixStep[] | null = null

  // Parse [DIAGNOSTIC] block
  const diagMatch = DIAGNOSTIC_BLOCK_REGEX.exec(cleanText)
  if (diagMatch) {
    cleanText = cleanText.replace(DIAGNOSTIC_BLOCK_REGEX, '').trim()
    const lines = diagMatch[1].split('\n').map((l) => l.trim()).filter(Boolean)

    questions = []
    for (const line of lines) {
      const parts = line.split(' | ')
      const question = parts[0]?.trim()
      const typeStr = parts[1]?.trim() || 'yes_no'

      if (!question) continue

      if (typeStr.startsWith('choice:')) {
        const options = typeStr.substring(7).split(',').map((o) => o.trim())
        questions.push({ question, type: 'choice', options })
      } else {
        questions.push({ question, type: 'yes_no' })
      }
    }

    if (questions.length === 0) questions = null
  }

  // Parse [FIX] block
  const fixMatch = FIX_BLOCK_REGEX.exec(cleanText)
  if (fixMatch) {
    cleanText = cleanText.replace(FIX_BLOCK_REGEX, '').trim()
    const lines = fixMatch[1].split('\n').map((l) => l.trim()).filter(Boolean)

    fixSteps = []
    for (const line of lines) {
      const pipeIndex = line.indexOf(' | ')
      if (pipeIndex > 0) {
        fixSteps.push({
          title: line.substring(0, pipeIndex).trim(),
          instructions: line.substring(pipeIndex + 3).trim(),
        })
      } else {
        fixSteps.push({ title: line.trim(), instructions: '' })
      }
    }

    if (fixSteps.length === 0) fixSteps = null
  }

  return { cleanText, questions, fixSteps }
}

// ---------------------------------------------------------------------------
// Slack Block Kit Builders
// ---------------------------------------------------------------------------

/**
 * Build interactive diagnostic question blocks.
 * Shows one question at a time with clickable answer buttons.
 */
export function buildDiagnosticBlocks(
  threadTs: string,
  questionIndex: number,
  question: DiagnosticQuestion,
  totalQuestions: number,
): any[] {
  const blocks: any[] = []

  // Question text
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `🔍 *Question ${questionIndex + 1}${totalQuestions > 1 ? ` of ${totalQuestions}` : ''}:*\n${question.question}`,
    },
  })

  if (question.type === 'yes_no') {
    blocks.push({
      type: 'actions',
      block_id: `diag_${threadTs}_${questionIndex}`,
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ Yes', emoji: true },
          style: 'primary',
          action_id: 'diag_answer',
          value: JSON.stringify({
            threadTs,
            questionIndex,
            answer: 'yes',
            question: question.question,
          }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ No', emoji: true },
          style: 'danger',
          action_id: 'diag_answer',
          value: JSON.stringify({
            threadTs,
            questionIndex,
            answer: 'no',
            question: question.question,
          }),
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '🤷 Not sure', emoji: true },
          action_id: 'diag_answer',
          value: JSON.stringify({
            threadTs,
            questionIndex,
            answer: 'not sure',
            question: question.question,
          }),
        },
      ],
    })
  } else if (question.type === 'choice' && question.options) {
    const buttons = question.options.map((option) => ({
      type: 'button',
      text: { type: 'plain_text', text: option, emoji: true },
      action_id: 'diag_answer',
      value: JSON.stringify({
        threadTs,
        questionIndex,
        answer: option,
        question: question.question,
      }),
    }))

    blocks.push({
      type: 'actions',
      block_id: `diag_${threadTs}_${questionIndex}`,
      elements: buttons.slice(0, 5), // Slack max 5 buttons per action block
    })
  }

  return blocks
}

/**
 * Build fix step blocks with confirmation buttons.
 */
export function buildFixBlocks(
  threadTs: string,
  fixSteps: FixStep[],
): any[] {
  const blocks: any[] = []

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '🔧 *Here\'s what to try:*',
    },
  })

  for (let i = 0; i < fixSteps.length; i++) {
    const step = fixSteps[i]
    let text = `*${i + 1}. ${step.title}*`
    if (step.instructions) {
      text += `\n${step.instructions}`
    }

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text },
    })
  }

  blocks.push({ type: 'divider' })

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '_Try the steps above, then let me know:_',
    },
  })

  blocks.push({
    type: 'actions',
    block_id: `fix_confirm_${threadTs}`,
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '✅ That fixed it!', emoji: true },
        style: 'primary',
        action_id: 'fix_resolved',
        value: threadTs,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: '😞 Still broken', emoji: true },
        style: 'danger',
        action_id: 'fix_still_broken',
        value: threadTs,
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: '🆘 Connect me with IT', emoji: true },
        action_id: 'fix_escalate',
        value: threadTs,
      },
    ],
  })

  return blocks
}

/**
 * Build a "what happened" summary after the user clicks a resolution button.
 */
export function buildResolutionConfirmBlock(
  status: 'resolved' | 'still_broken' | 'escalated',
): any[] {
  const messages = {
    resolved: '✅ *Great, glad that\'s fixed!* I\'ll remember this solution for next time.',
    still_broken: '😞 *Sorry that didn\'t work.* Let me try a different approach...',
    escalated: '🆘 *Got it — I\'ll connect you with the IT team.* I\'m including everything we\'ve tried so far so they have full context.',
  }

  return [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: messages[status] },
    },
  ]
}
