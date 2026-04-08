import { Chat } from 'chat'
import { createSlackAdapter } from '@chat-adapter/slack'
import { createRedisState } from '@chat-adapter/state-redis'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAgentToken } from './encryption'
import type { SlackWorkspace, SlackUser, DeviceScan } from './types'

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

// Helper to respond to slash commands using Slack's response_url
// This is the most reliable way - no auth token needed
async function respondToSlashCommand(responseUrl: string, text: string, isEphemeral = true) {
  const response = await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text,
      response_type: isEphemeral ? 'ephemeral' : 'in_channel',
    }),
  })
  if (!response.ok) {
    console.error('[v0] Slash response failed:', response.status, await response.text())
  }
  return response.ok
}

// Helper to get or create a Slack user in our database
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
  
  const { data: newUser, error } = await supabase
    .from('slack_users')
    .insert({
      workspace_id: workspaceId,
      slack_user_id: slackUserId,
      slack_username: userInfo?.name,
      email: userInfo?.email,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating Slack user:', error)
    return null
  }
  
  return newUser as SlackUser
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

// Helper to get latest device scan for a user
async function getLatestDeviceScan(slackUserId: string): Promise<DeviceScan | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('device_scans')
    .select('*')
    .eq('slack_user_id', slackUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  return data as DeviceScan | null
}

// Handle new @mentions to the bot
bot.onNewMention(async (thread) => {
  await thread.subscribe()
  
  const message = thread.lastMessage
  const text = message?.text?.toLowerCase() || ''
  
  if (text.includes('help')) {
    await thread.post(`*ITSquare.AI - Your AI IT Assistant*

*Quick Start:*
1. Type \`/itsquare scan\` in any channel
2. Copy-paste the command in your Terminal
3. Done! Results appear in Slack.

*Commands:*
• \`/itsquare scan\` - Scan your device
• \`/itsquare status\` - View health report
• \`/itsquare help\` - Show commands

Just ask me if you need IT help!`)
    return
  }
  
  if (text.includes('status') || text.includes('health') || text.includes('scan')) {
    await thread.post(`To scan your device:

1. Type \`/itsquare scan\` in a channel
2. Copy the command that appears
3. Paste it in Terminal (Mac/Linux) or PowerShell (Windows)

Results will appear here automatically!`)
    return
  }
  
  await thread.post(`Hi! I'm ITSquare, your AI IT assistant.

Type \`/itsquare scan\` to check your device health, or ask me any IT question!`)
})

// Handle messages in subscribed threads
bot.onSubscribedMessage(async (thread, message) => {
  if (message.author.isMe) return
  
  const text = message.text?.toLowerCase() || ''
  
  if (text.match(/^(thanks?|thank you|thx|ty)$/i)) {
    await thread.post("You're welcome!")
    return
  }
  
  await thread.post("Say 'help' for options, or use \`/itsquare\` commands.")
})

// Handle slash command /itsquare
bot.onSlashCommand('/itsquare', async (event) => {
  const args = event.text?.trim().toLowerCase() || ''
  const command = args.split(' ')[0]
  
  // Extract from event.raw (original Slack payload)
  const raw = (event as any).raw || {}
  const userId = raw.user_id || event.user?.id || ''
  const teamId = raw.team_id || ''
  const responseUrl = raw.response_url || ''
  
  if (!responseUrl) {
    console.error('[v0] No response_url in slash command payload')
    return
  }
  
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) {
    await respondToSlashCommand(responseUrl, `*Setup Required*

I don't recognize this workspace. Please reinstall the ITSquare.AI app.

Visit: https://itsquare.ai/dashboard/integrations`)
    return
  }
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    userId,
    { name: event.user?.fullName }
  )
  
  // /itsquare scan - Generate one-liner command to scan device
  if (command === 'scan') {
    if (!slackUser) {
      await respondToSlashCommand(responseUrl, "I couldn't identify your user account. Please try again.")
      return
    }
    
    try {
      // Generate a new token for this scan
      const { token, prefix, hash } = await generateAgentToken()
      
      const supabase = createAdminClient()
      await supabase
        .from('agent_tokens')
        .insert({
          token_hash: hash,
          token_prefix: prefix,
          workspace_id: workspace.id,
          slack_user_id: slackUser.id,
          name: `${event.user?.fullName || 'User'}'s Device`,
          scopes: ['device:scan'],
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiry
        })
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itsquare.ai'
      
      await respondToSlashCommand(responseUrl, `*Scan Your Device*

Copy and paste this command in your Terminal (Mac/Linux) or PowerShell (Windows):

\`\`\`
curl -sL ${appUrl}/api/scan/${token} | bash
\`\`\`

The scan takes about 10 seconds. Results will appear here automatically.

_This command expires in 24 hours._`)
    } catch (err) {
      console.error('Scan token generation error:', err)
      await respondToSlashCommand(responseUrl, "Failed to generate scan command. Please try again.")
    }
    return
  }
  
  // /itsquare status - View latest scan results
  if (command === 'status' || command === 'health') {
    if (!slackUser) {
      await respondToSlashCommand(responseUrl, "I couldn't identify your user account. Please try again.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await respondToSlashCommand(responseUrl, `*No Device Scan Found*

You haven't scanned your device yet. Run \`/itsquare scan\` to get started.`)
      return
    }
    
    const healthEmoji = (latestScan.overall_health_score || 0) >= 75 ? '🟢' : 
                        (latestScan.overall_health_score || 0) >= 50 ? '🟡' : '🔴'
    
    await respondToSlashCommand(responseUrl, `${healthEmoji} *Device Health Report*

*Device:* ${latestScan.hostname || 'Unknown'}
*OS:* ${latestScan.os_type || 'Unknown'} ${latestScan.os_version || ''}
*Health Score:* ${latestScan.overall_health_score || 0}/100
*Security Score:* ${latestScan.security_score || 0}/100

*Security Status:*
• Firewall: ${latestScan.firewall_enabled ? 'Enabled' : 'Disabled'}
• Disk Encryption: ${latestScan.filevault_enabled || latestScan.bitlocker_enabled ? 'Enabled' : 'Disabled'}
• Antivirus: ${latestScan.antivirus_installed ? 'Installed' : 'Not detected'}
• OS Updates: ${latestScan.os_up_to_date ? 'Up to date' : 'Updates available'}

*Issues:* ${(latestScan.issue_count_critical || 0) + (latestScan.issue_count_high || 0) + (latestScan.issue_count_medium || 0) + (latestScan.issue_count_low || 0)} total
_Last scanned: ${new Date(latestScan.created_at).toLocaleString()}_`)
    return
  }
  
  // /itsquare help (default)
  await respondToSlashCommand(responseUrl, `*ITSquare.AI - Your AI IT Assistant*

*Commands:*
• \`/itsquare scan\` - Scan your device (just copy-paste one command!)
• \`/itsquare status\` - View your latest health report
• \`/itsquare help\` - Show this message

*How it works:*
1. Type \`/itsquare scan\`
2. Copy the command that appears
3. Paste it in your Terminal (Mac/Linux) or PowerShell (Windows)
4. Done! Results appear here automatically.

_Scans check: firewall, disk encryption, antivirus, OS updates, and more._`)
})
