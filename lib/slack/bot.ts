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
  
  // Handle help command
  if (text.includes('help')) {
    await thread.post(`*ITSquare.AI Help*

I'm your AI IT assistant. Here's what I can help with:

*Device Health*
• "What's my device status?" - Quick health check
• "Show detailed report" - Full device analysis
• "What issues do I have?" - List security issues

*Slash Commands* (in channels only):
• \`/itsquare status\` - View device health
• \`/itsquare token\` - Generate scan token
• \`/itsquare help\` - Show commands

*In threads or DMs*, just @mention me!`)
    return
  }
  
  // Handle status queries
  if (text.includes('status') || text.includes('health') || text.includes('scan')) {
    await thread.post(`To check your device health, run:

\`\`\`
npx @itsquare/agent scan
\`\`\`

Or use \`/itsquare status\` in a channel to see your latest scan results.`)
    return
  }
  
  // Default response
  await thread.post(`Hi! I'm ITSquare.AI, your IT assistant. 

Try asking:
• "What's my device status?"
• "Help" for all commands
• Or use \`/itsquare\` slash commands`)
})

// Handle messages in subscribed threads
bot.onSubscribedMessage(async (thread, message) => {
  if (message.author.isMe) return
  
  const text = message.text?.toLowerCase() || ''
  
  if (text.match(/^(thanks?|thank you|thx|ty)$/i)) {
    await thread.post("You're welcome! Let me know if you need anything else.")
    return
  }
  
  await thread.post("I'm here to help! Ask me about your device health or say 'help' for options.")
})

// Handle slash command /itsquare
bot.onSlashCommand('/itsquare', async (event) => {
  const args = event.text?.trim().toLowerCase() || ''
  const command = args.split(' ')[0]
  
  // Get workspace
  const teamId = (event as any).teamId || (event as any).team_id || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) {
    await event.respond(`*Setup Required*

I don't recognize this workspace. Please reinstall the ITSquare.AI app.

Visit: https://itsquare.ai/dashboard/integrations`)
    return
  }
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    event.user?.id || '',
    { name: event.user?.fullName }
  )
  
  // /itsquare status
  if (command === 'status' || command === 'health' || command === 'scan') {
    if (!slackUser) {
      await event.respond("I couldn't identify your user account. Please try again.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await event.respond(`*No Device Scan Found*

You haven't scanned your device yet. Run the ITSquare agent:

\`\`\`
npx @itsquare/agent scan
\`\`\`

Use \`/itsquare token\` to generate a scan token first.`)
      return
    }
    
    const healthEmoji = (latestScan.overall_health_score || 0) >= 75 ? '🟢' : 
                        (latestScan.overall_health_score || 0) >= 50 ? '🟡' : '🔴'
    
    await event.respond(`${healthEmoji} *Device Health Report*

*Device:* ${latestScan.hostname || 'Unknown'}
*OS:* ${latestScan.os_type || 'Unknown'} ${latestScan.os_version || ''}
*Health Score:* ${latestScan.overall_health_score || 0}/100
*Security Score:* ${latestScan.security_score || 0}/100

*Security Status:*
• Firewall: ${latestScan.firewall_enabled ? '✅ Enabled' : '❌ Disabled'}
• Disk Encryption: ${latestScan.filevault_enabled || latestScan.bitlocker_enabled ? '✅ Enabled' : '❌ Disabled'}
• Antivirus: ${latestScan.antivirus_installed ? '✅ Installed' : '⚠️ Not detected'}
• OS Updates: ${latestScan.os_up_to_date ? '✅ Up to date' : '⚠️ Updates available'}

*Issues Found:* ${(latestScan.issue_count_critical || 0) + (latestScan.issue_count_high || 0) + (latestScan.issue_count_medium || 0) + (latestScan.issue_count_low || 0)}
• 🔴 Critical: ${latestScan.issue_count_critical || 0}
• 🟠 High: ${latestScan.issue_count_high || 0}
• 🟡 Medium: ${latestScan.issue_count_medium || 0}
• ⚪ Low: ${latestScan.issue_count_low || 0}

_Last scanned: ${new Date(latestScan.created_at).toLocaleString()}_`)
    return
  }
  
  // /itsquare token
  if (command === 'token') {
    if (!slackUser) {
      await event.respond("I couldn't identify your user account.")
      return
    }
    
    try {
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
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
      
      await event.respond(`*Your Scan Token*

Save this token securely - it won't be shown again!

\`\`\`
${token}
\`\`\`

*To scan your device, run:*
\`\`\`
ITSQUARE_TOKEN=${token} npx @itsquare/agent scan
\`\`\``)
    } catch (err) {
      console.error('Token generation error:', err)
      await event.respond("Failed to generate token. Please try again.")
    }
    return
  }
  
  // /itsquare help (default)
  await event.respond(`*ITSquare.AI Commands*

\`/itsquare status\` - View your device health report
\`/itsquare token\` - Generate a scan token
\`/itsquare help\` - Show this message

*Quick Start:*
1. Run \`/itsquare token\` to get a scan token
2. Run \`npx @itsquare/agent scan\` on your device
3. Run \`/itsquare status\` to see results

*Need help?* Just @mention me in any thread!`)
})
