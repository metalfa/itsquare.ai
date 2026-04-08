import { Chat } from 'chat'
import { createSlackAdapter } from '@chat-adapter/slack'
import { createRedisState } from '@chat-adapter/state-redis'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import type { SlackWorkspace, SlackUser } from './types'

// Create the Chat SDK bot instance
export const bot = new Chat({
  userName: 'itsquare',
  adapters: {
    slack: createSlackAdapter({
      botToken: process.env.SLACK_BOT_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    }),
  },
  state: createRedisState({ url: process.env.REDIS_URL || '' }),
})

// IT Knowledge Base - common issues and solutions
const IT_KNOWLEDGE_BASE = `
You are ITSquare, an expert IT support assistant. You help employees solve technical problems quickly and friendly.

COMMON ISSUES AND SOLUTIONS:

## WiFi/Network Problems
- "WiFi keeps disconnecting": 1) Forget the network and reconnect. 2) Restart your router. 3) Check if other devices have the same issue. 4) Move closer to the router.
- "Slow internet": 1) Run a speed test at speedtest.net. 2) Close bandwidth-heavy apps. 3) Restart router. 4) Check if others on the network are streaming.
- "Can't connect to VPN": 1) Check internet connection first. 2) Restart VPN client. 3) Try a different VPN server. 4) Check if credentials are correct.

## Computer Running Slow
- "Computer is slow": 1) Restart your computer. 2) Close unnecessary apps/tabs. 3) Check disk space (need at least 10% free). 4) Check for software updates.
- "Apps freezing": 1) Force quit the app (Cmd+Q on Mac, Alt+F4 on Windows). 2) Restart computer. 3) Check if app needs update. 4) Reinstall the app.

## Email/Calendar Issues
- "Email not syncing": 1) Check internet connection. 2) Close and reopen email app. 3) Check account settings. 4) Remove and re-add account.
- "Calendar not showing meetings": 1) Refresh calendar. 2) Check you're viewing the right calendar. 3) Sign out and back in.

## Printer Problems
- "Printer not working": 1) Check if printer is on and has paper. 2) Check USB/WiFi connection. 3) Restart printer. 4) Remove and re-add printer in settings.
- "Print jobs stuck": 1) Cancel all print jobs. 2) Restart print spooler. 3) Restart printer.

## Password/Login Issues
- "Forgot password": Direct them to the company's password reset page or IT admin.
- "Account locked": Usually unlocks after 15-30 minutes. Otherwise contact IT admin.
- "Two-factor not working": Check time settings on phone. Try backup codes. Contact IT admin.

## Software Installation
- "Need to install software": Ask what software they need. For approved software, guide them. For others, they may need IT approval.
- "App won't install": 1) Check disk space. 2) Check if admin rights needed. 3) Try downloading again.

## Mac-Specific
- "Mac running slow": 1) Close apps. 2) Check Activity Monitor for CPU hogs. 3) Restart. 4) Check for macOS updates.
- "Mac won't turn on": 1) Check power cable. 2) Try SMC reset. 3) Try NVRAM reset.

## Windows-Specific
- "Windows update stuck": 1) Restart computer. 2) Run Windows Update troubleshooter. 3) Check disk space.
- "Blue screen error": 1) Note the error code. 2) Restart. 3) If repeats, may need IT escalation.

## Security
- "Suspicious email received": DO NOT click links. Report to IT/security team. Delete the email.
- "Think I have a virus": 1) Disconnect from network. 2) Run antivirus scan. 3) Contact IT immediately.

RESPONSE STYLE:
- Be friendly, patient, and non-technical
- Use simple step-by-step instructions
- Ask clarifying questions if needed
- If you can't solve it, offer to connect them with IT team
- Always reassure the user - tech problems are frustrating but solvable
- Keep responses concise but helpful

ESCALATION:
If the problem requires hands-on help, admin access, or is beyond troubleshooting:
- Offer to create a ticket
- Ask if they want to be connected with IT team member
- Get their availability for a quick call
`

// Helper to respond to slash commands
async function respondToSlashCommand(responseUrl: string, text: string, isEphemeral = true) {
  const response = await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text,
      response_type: isEphemeral ? 'ephemeral' : 'in_channel',
    }),
  })
  return response.ok
}

// Helper to get workspace by team ID
async function getWorkspaceByTeamId(teamId: string): Promise<SlackWorkspace | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('slack_workspaces')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', 'active')
    .single()
  return data as SlackWorkspace | null
}

// Helper to get or create Slack user
async function getOrCreateSlackUser(
  workspaceId: string,
  slackUserId: string,
  userInfo?: { name?: string; email?: string }
): Promise<SlackUser | null> {
  const supabase = createAdminClient()
  
  const { data: existingUser } = await supabase
    .from('slack_users')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)
    .single()
  
  if (existingUser) {
    await supabase
      .from('slack_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', existingUser.id)
    return existingUser as SlackUser
  }
  
  const { data: newUser } = await supabase
    .from('slack_users')
    .insert({
      workspace_id: workspaceId,
      slack_user_id: slackUserId,
      slack_username: userInfo?.name,
      email: userInfo?.email,
    })
    .select()
    .single()
  
  return newUser as SlackUser
}

// Store conversation history for context
async function getConversationHistory(channelId: string, threadTs: string): Promise<Array<{role: string, content: string}>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('it_conversations')
    .select('messages')
    .eq('slack_channel_id', channelId)
    .eq('slack_thread_ts', threadTs)
    .single()
  
  return data?.messages || []
}

async function saveConversationHistory(
  channelId: string,
  threadTs: string,
  workspaceId: string,
  slackUserId: string,
  messages: Array<{role: string, content: string}>
) {
  const supabase = createAdminClient()
  
  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('it_conversations')
    .select('id')
    .eq('slack_channel_id', channelId)
    .eq('slack_thread_ts', threadTs)
    .single()
  
  if (existing) {
    await supabase
      .from('it_conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('it_conversations')
      .insert({
        slack_channel_id: channelId,
        slack_thread_ts: threadTs,
        workspace_id: workspaceId,
        slack_user_id: slackUserId,
        messages,
        status: 'active',
      })
  }
}

// AI-powered response generation
async function generateITResponse(
  userMessage: string, 
  conversationHistory: Array<{role: string, content: string}>
): Promise<string> {
  try {
    const messages = [
      { role: 'system' as const, content: IT_KNOWLEDGE_BASE },
      ...conversationHistory.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: userMessage }
    ]

    const { text } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      messages,
      maxTokens: 500,
    })

    return text
  } catch (error) {
    console.error('AI generation error:', error)
    return "I'm having trouble processing that right now. Could you try rephrasing your question, or type 'help' for common solutions?"
  }
}

// Handle @mentions - Main AI conversation entry point
bot.onNewMention(async (thread) => {
  await thread.subscribe()
  
  const message = thread.lastMessage
  const userMessage = message?.text || ''
  
  // Get workspace info from thread context
  const raw = (message as any)?.raw || (thread as any).raw || {}
  const teamId = raw.team || raw.team_id || ''
  const userId = message?.author?.id || raw.user || ''
  const channelId = raw.channel || ''
  const threadTs = raw.thread_ts || raw.ts || `${Date.now()}`
  
  const workspace = await getWorkspaceByTeamId(teamId)
  const slackUser = workspace ? await getOrCreateSlackUser(workspace.id, userId) : null
  
  // Get conversation history
  const history = await getConversationHistory(channelId, threadTs)
  
  // Generate AI response
  const response = await generateITResponse(userMessage, history)
  
  // Save updated history
  if (workspace && slackUser) {
    const newHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response }
    ]
    await saveConversationHistory(channelId, threadTs, workspace.id, slackUser.id, newHistory)
  }
  
  await thread.post(response)
})

// Handle follow-up messages in threads
bot.onSubscribedMessage(async (thread, message) => {
  if (message.author.isMe) return
  
  const userMessage = message.text || ''
  
  // Get workspace info
  const raw = (message as any)?.raw || (thread as any).raw || {}
  const teamId = raw.team || raw.team_id || ''
  const userId = message.author?.id || raw.user || ''
  const channelId = raw.channel || ''
  const threadTs = raw.thread_ts || raw.ts || `${Date.now()}`
  
  const workspace = await getWorkspaceByTeamId(teamId)
  const slackUser = workspace ? await getOrCreateSlackUser(workspace.id, userId) : null
  
  // Get conversation history
  const history = await getConversationHistory(channelId, threadTs)
  
  // Generate AI response
  const response = await generateITResponse(userMessage, history)
  
  // Save updated history
  if (workspace && slackUser) {
    const newHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response }
    ]
    await saveConversationHistory(channelId, threadTs, workspace.id, slackUser.id, newHistory)
  }
  
  await thread.post(response)
})

// Handle /itsquare slash commands
bot.onSlashCommand('/itsquare', async (event) => {
  const userMessage = event.text?.trim() || 'help'
  const raw = (event as any).raw || {}
  const responseUrl = raw.response_url || ''
  const teamId = raw.team_id || ''
  const userId = raw.user_id || ''
  
  if (!responseUrl) return
  
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) {
    await respondToSlashCommand(responseUrl, `*Setup Required*
    
Please install ITSquare.AI first: https://itsquare.ai/dashboard/integrations`)
    return
  }

  // Quick commands
  if (userMessage === 'help' || userMessage === '') {
    await respondToSlashCommand(responseUrl, `*ITSquare.AI - Your AI IT Assistant*

Just describe your problem and I'll help solve it!

*Examples:*
• \`/itsquare my wifi keeps disconnecting\`
• \`/itsquare computer is running slow\`
• \`/itsquare can't connect to VPN\`
• \`/itsquare printer not working\`

Or @mention me in any channel to start a conversation.

_I can troubleshoot issues, provide step-by-step solutions, and connect you with IT team members if needed._`)
    return
  }

  // AI-powered response for any IT issue
  const slackUser = await getOrCreateSlackUser(workspace.id, userId)
  const response = await generateITResponse(userMessage, [])
  
  await respondToSlashCommand(responseUrl, response)
})
