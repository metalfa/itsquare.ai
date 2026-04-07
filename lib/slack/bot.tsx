/** @jsxImportSource chat */
import { Chat, Card, CardText, Actions, Button, Divider, Fields, Field } from 'chat'
import { createSlackAdapter } from '@chat-adapter/slack'
import { createRedisState } from '@chat-adapter/state-redis'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAgentToken } from './encryption'
import { 
  QuickHealthCard, 
  DetailedHealthCard, 
  IssuesCard, 
  ScanComparisonCard,
  FleetOverviewCard
} from './health-reports'
import { 
  generateScanSummary, 
  generateFixRecommendations,
  generateITSupportResponse,
  analyzeScanTrends
} from './ai-analysis'
import type { SlackWorkspace, SlackUser, DeviceScan } from './types'

// Create the Chat SDK bot instance
export const bot = new Chat({
  userName: 'itsquare',
  adapters: {
    slack: createSlackAdapter({
      botToken: process.env.SLACK_BOT_TOKEN!,
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
    }),
  },
  state: createRedisState({ url: process.env.REDIS_URL! }),
})

// Helper to get or create a Slack user in our database
async function getOrCreateSlackUser(
  workspaceId: string,
  slackUserId: string,
  userInfo?: { name?: string; email?: string }
): Promise<SlackUser | null> {
  const supabase = createAdminClient()
  
  // Try to find existing user
  const { data: existingUser } = await supabase
    .from('slack_users')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('slack_user_id', slackUserId)
    .single()
  
  if (existingUser) {
    // Update last interaction
    await supabase
      .from('slack_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', existingUser.id)
    return existingUser as SlackUser
  }
  
  // Create new user
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

// Helper to get scan history for a user
async function getScanHistory(slackUserId: string, limit = 10): Promise<DeviceScan[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('device_scans')
    .select('*')
    .eq('slack_user_id', slackUserId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return (data || []) as DeviceScan[]
}

// Helper to get fleet stats for a workspace
async function getFleetStats(workspaceId: string) {
  const supabase = createAdminClient()
  
  // Get latest scan for each unique device in the workspace
  const { data: scans } = await supabase
    .from('device_scans')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  
  if (!scans || scans.length === 0) {
    return null
  }
  
  // Dedupe by slack_user_id to get latest scan per user
  const latestScans = new Map<string, DeviceScan>()
  for (const scan of scans) {
    if (scan.slack_user_id && !latestScans.has(scan.slack_user_id)) {
      latestScans.set(scan.slack_user_id, scan as DeviceScan)
    }
  }
  
  const devices = Array.from(latestScans.values())
  const totalDevices = devices.length
  const healthyDevices = devices.filter(d => (d.overall_health_score || 0) >= 75).length
  const atRiskDevices = devices.filter(d => {
    const score = d.overall_health_score || 0
    return score >= 50 && score < 75
  }).length
  const criticalDevices = devices.filter(d => (d.overall_health_score || 0) < 50).length
  
  const avgHealthScore = totalDevices > 0
    ? Math.round(devices.reduce((sum, d) => sum + (d.overall_health_score || 0), 0) / totalDevices)
    : 0
  
  const totalCriticalIssues = devices.reduce((sum, d) => sum + (d.issue_count_critical || 0), 0)
  
  return {
    totalDevices,
    healthyDevices,
    atRiskDevices,
    criticalDevices,
    avgHealthScore,
    totalCriticalIssues,
  }
}

// Handle new @mentions to the bot
bot.onNewMention(async (thread) => {
  await thread.subscribe()
  
  const message = thread.lastMessage
  const text = message?.text?.toLowerCase() || ''
  
  // Get workspace info
  const teamId = (thread as any).adapter?.teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) {
    await thread.post(
      <Card title="Setup Required">
        <CardText>
          I don&apos;t recognize this workspace. Please reinstall the ITSquare.AI app from your admin dashboard.
        </CardText>
      </Card>
    )
    return
  }
  
  // Get or create user
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    message?.author?.id || '',
    { name: message?.author?.fullName }
  )
  
  // Handle device status/health queries
  if (text.includes('status') || text.includes('health') || text.includes('scan')) {
    if (!slackUser) {
      await thread.post("I couldn't identify your user account. Please try again.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await thread.post(
        <Card title="No Device Scan Found">
          <CardText>
            You haven&apos;t scanned your device yet. Run the ITSquare agent to check your device health:
          </CardText>
          <CardText>
            ```npx @itsquare/agent scan```
          </CardText>
          <Divider />
          <Actions>
            <Button id="generate_token" style="primary">Generate Scan Token</Button>
          </Actions>
        </Card>
      )
      return
    }
    
    // Generate AI summary
    const aiSummary = await generateScanSummary(latestScan)
    
    // Check if they want detailed report
    if (text.includes('detail') || text.includes('full') || text.includes('report')) {
      await thread.post(<DetailedHealthCard scan={latestScan} aiSummary={aiSummary} />)
    } else {
      await thread.post(<QuickHealthCard scan={latestScan} />)
      if (aiSummary) {
        await thread.post(`💡 *AI Analysis:* ${aiSummary}`)
      }
    }
    return
  }
  
  // Handle issues query
  if (text.includes('issue') || text.includes('problem') || text.includes('fix')) {
    if (!slackUser) {
      await thread.post("I couldn't identify your user account.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await thread.post("No device scan found. Run `/itsquare scan` first.")
      return
    }
    
    await thread.post(<IssuesCard scan={latestScan} />)
    return
  }
  
  // Handle history/trends query
  if (text.includes('history') || text.includes('trend') || text.includes('progress')) {
    if (!slackUser) {
      await thread.post("I couldn't identify your user account.")
      return
    }
    
    const scanHistory = await getScanHistory(slackUser.id, 5)
    
    if (scanHistory.length < 2) {
      await thread.post("Not enough scan history yet. Run a few more scans to see trends!")
      return
    }
    
    const trendAnalysis = await analyzeScanTrends(scanHistory)
    await thread.post(<ScanComparisonCard currentScan={scanHistory[0]} previousScan={scanHistory[1]} />)
    await thread.post(`📊 *Trend Analysis:* ${trendAnalysis}`)
    return
  }
  
  // Handle fleet overview (admin only conceptually)
  if (text.includes('fleet') || text.includes('team') || text.includes('all device')) {
    const stats = await getFleetStats(workspace.id)
    
    if (!stats) {
      await thread.post("No fleet data available yet. Have your team members scan their devices!")
      return
    }
    
    await thread.post(<FleetOverviewCard stats={stats} />)
    return
  }
  
  // Handle help command
  if (text.includes('help')) {
    await thread.post(
      <Card title="ITSquare.AI Help">
        <CardText>
          I&apos;m your AI IT assistant. Here&apos;s what I can help with:
        </CardText>
        <Divider />
        <CardText>
          *Device Health*{'\n'}
          • &quot;What&apos;s my device status?&quot; - Quick health check{'\n'}
          • &quot;Show detailed report&quot; - Full device analysis{'\n'}
          • &quot;What issues do I have?&quot; - List security issues{'\n'}
          • &quot;Show my scan history&quot; - View trends over time
        </CardText>
        <Divider />
        <CardText>
          *IT Support*{'\n'}
          • Ask any IT question and I&apos;ll help!{'\n'}
          • &quot;How do I enable FileVault?&quot;{'\n'}
          • &quot;My VPN isn&apos;t working&quot;
        </CardText>
        <Divider />
        <CardText>
          *Slash Commands* (in channels, not threads):{'\n'}
          • `/itsquare status` - View device health{'\n'}
          • `/itsquare token` - Generate scan token{'\n'}
          • `/itsquare fleet` - Team overview
        </CardText>
        <Divider />
        <CardText>
          *In threads or DMs*, just @mention me:{'\n'}
          • &quot;@ITSquare status&quot;{'\n'}
          • &quot;@ITSquare help&quot;
        </CardText>
      </Card>
    )
    return
  }
  
  // Default: AI-powered IT support response
  if (slackUser) {
    const latestScan = await getLatestDeviceScan(slackUser.id)
    const response = await generateITSupportResponse(
      message?.text || '',
      latestScan
    )
    await thread.post(response)
  } else {
    await thread.post(
      <Card title="ITSquare.AI">
        <CardText>
          I received your message! Try asking about your device health or say &quot;help&quot; for options.
        </CardText>
      </Card>
    )
  }
})

// Handle messages in subscribed threads
bot.onSubscribedMessage(async (thread, message) => {
  // Skip bot's own messages
  if (message.author.isMe) return
  
  const text = message.text?.toLowerCase() || ''
  
  // Get context for AI response
  const teamId = (thread as any).adapter?.teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) return
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    message.author.id,
    { name: message.author.fullName }
  )
  
  if (!slackUser) {
    await thread.post("I'm having trouble identifying your account. Please try again.")
    return
  }
  
  // Handle simple acknowledgments
  if (text.match(/^(thanks?|thank you|thx|ty)$/i)) {
    await thread.post("You're welcome! Let me know if you need anything else. 👍")
    return
  }
  
  // For other messages, provide AI-powered response with device context
  const latestScan = await getLatestDeviceScan(slackUser.id)
  const response = await generateITSupportResponse(
    message.text || '',
    latestScan
  )
  await thread.post(response)
})

// Handle slash command /itsquare
bot.onSlashCommand('/itsquare', async (event) => {
  const args = event.text?.trim().toLowerCase() || ''
  const command = args.split(' ')[0]
  
  // Get workspace
  const teamId = (event as any).teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) {
    await event.respond(
      <Card title="Setup Required">
        <CardText>Please reinstall the ITSquare.AI app from the admin dashboard.</CardText>
      </Card>
    )
    return
  }
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    event.user.id,
    { name: event.user.fullName }
  )
  
  // /itsquare status or /itsquare health
  if (command === 'status' || command === 'health' || command === 'scan') {
    if (!slackUser) {
      await event.respond("I couldn't identify your user account.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await event.respond(
        <Card title="No Device Scan Found">
          <CardText>
            Run `npx @itsquare/agent scan` to check your device health.
          </CardText>
          <Actions>
            <Button id="generate_token" style="primary">Generate Scan Token</Button>
          </Actions>
        </Card>
      )
      return
    }
    
    // Generate AI summary
    const aiSummary = await generateScanSummary(latestScan)
    await event.respond(<DetailedHealthCard scan={latestScan} aiSummary={aiSummary} />)
    return
  }
  
  // /itsquare issues
  if (command === 'issues') {
    if (!slackUser) {
      await event.respond("I couldn't identify your user account.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await event.respond("No device scan found. Run `/itsquare status` first.")
      return
    }
    
    await event.respond(<IssuesCard scan={latestScan} />)
    return
  }
  
  // /itsquare fix
  if (command === 'fix') {
    if (!slackUser) {
      await event.respond("I couldn't identify your user account.")
      return
    }
    
    const latestScan = await getLatestDeviceScan(slackUser.id)
    
    if (!latestScan) {
      await event.respond("No device scan found. Run `/itsquare status` first.")
      return
    }
    
    const recommendations = await generateFixRecommendations(latestScan)
    await event.respond(
      <Card title="Fix Guide">
        <CardText>{recommendations}</CardText>
        <Divider />
        <Actions>
          <Button id="view_dashboard" style="primary">Open Dashboard</Button>
        </Actions>
      </Card>
    )
    return
  }
  
  // /itsquare history
  if (command === 'history' || command === 'trends') {
    if (!slackUser) {
      await event.respond("I couldn't identify your user account.")
      return
    }
    
    const scanHistory = await getScanHistory(slackUser.id, 5)
    
    if (scanHistory.length < 2) {
      await event.respond("Not enough scan history. Run a few more scans to see trends!")
      return
    }
    
    const trendAnalysis = await analyzeScanTrends(scanHistory)
    await event.respond(<ScanComparisonCard currentScan={scanHistory[0]} previousScan={scanHistory[1]} />)
    return
  }
  
  // /itsquare fleet (admin overview)
  if (command === 'fleet' || command === 'team' || command === 'overview') {
    const stats = await getFleetStats(workspace.id)
    
    if (!stats) {
      await event.respond("No fleet data available. Have team members scan their devices first!")
      return
    }
    
    await event.respond(<FleetOverviewCard stats={stats} />)
    return
  }
  
  // /itsquare token
  if (command === 'token') {
    await event.respond(
      <Card title="Generate Scan Token">
        <CardText>
          Click below to generate a new token for scanning your device.
        </CardText>
        <Actions>
          <Button id="generate_token" style="primary">Generate Token</Button>
        </Actions>
      </Card>
    )
    return
  }
  
  // Default help response
  await event.respond(
    <Card title="ITSquare.AI Commands">
      <CardText>
        *Slash commands* (in channels only):{'\n'}
        • `/itsquare status` - View your device health report{'\n'}
        • `/itsquare issues` - List security issues{'\n'}
        • `/itsquare fix` - Get AI-powered fix recommendations{'\n'}
        • `/itsquare history` - View scan trends{'\n'}
        • `/itsquare fleet` - Team device overview{'\n'}
        • `/itsquare token` - Generate a scan token
      </CardText>
      <Divider />
      <CardText>
        *In threads*, @mention me instead:{'\n'}
        • @ITSquare status{'\n'}
        • @ITSquare issues{'\n'}
        • @ITSquare help
      </CardText>
    </Card>
  )
})

// Handle button actions
bot.onAction('generate_token', async (event) => {
  const teamId = (event as any).teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) {
    await event.thread.post(
      <Card title="Error">
        <CardText>Could not find your workspace. Please reinstall the app.</CardText>
      </Card>
    )
    return
  }
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    event.user.id,
    { name: event.user.fullName }
  )
  
  if (!slackUser) {
    await event.thread.post(
      <Card title="Error">
        <CardText>Could not identify your user account.</CardText>
      </Card>
    )
    return
  }
  
  try {
    // Generate new token
    const { token, prefix, hash } = await generateAgentToken()
    
    const supabase = createAdminClient()
    
    // Store the token
    await supabase
      .from('agent_tokens')
      .insert({
        token_hash: hash,
        token_prefix: prefix,
        workspace_id: workspace.id,
        slack_user_id: slackUser.id,
        name: `${event.user.fullName || 'User'}'s Device`,
        scopes: ['device:scan'],
        is_active: true,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
    
    await event.thread.post(
      <Card title="Your Scan Token">
        <CardText>
          Here is your personal scan token. Save it securely - it won&apos;t be shown again!
        </CardText>
        <Divider />
        <CardText>
          ```{token}```
        </CardText>
        <Divider />
        <CardText>
          *To scan your device, run:*{'\n'}
          ```ITSQUARE_TOKEN={token} npx @itsquare/agent scan```
        </CardText>
      </Card>
    )
  } catch (err) {
    console.error('Token generation error:', err)
    await event.thread.post(
      <Card title="Error">
        <CardText>Failed to generate token. Please try again.</CardText>
      </Card>
    )
  }
})

bot.onAction('view_full_report', async (event) => {
  const teamId = (event as any).teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) return
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    event.user.id,
    { name: event.user.fullName }
  )
  
  if (!slackUser) return
  
  const latestScan = await getLatestDeviceScan(slackUser.id)
  
  if (latestScan) {
    const aiSummary = await generateScanSummary(latestScan)
    await event.thread.post(<DetailedHealthCard scan={latestScan} aiSummary={aiSummary} />)
  } else {
    await event.thread.post("No scan found. Run a device scan first!")
  }
})

bot.onAction('view_issues', async (event) => {
  const teamId = (event as any).teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) return
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    event.user.id,
    { name: event.user.fullName }
  )
  
  if (!slackUser) return
  
  const latestScan = await getLatestDeviceScan(slackUser.id)
  
  if (latestScan) {
    await event.thread.post(<IssuesCard scan={latestScan} />)
  }
})

bot.onAction('get_fix_guide', async (event) => {
  const teamId = (event as any).teamId || ''
  const workspace = await getWorkspaceByTeamId(teamId)
  
  if (!workspace) return
  
  const slackUser = await getOrCreateSlackUser(
    workspace.id,
    event.user.id,
    { name: event.user.fullName }
  )
  
  if (!slackUser) return
  
  const latestScan = await getLatestDeviceScan(slackUser.id)
  
  if (latestScan) {
    const recommendations = await generateFixRecommendations(latestScan)
    await event.thread.post(
      <Card title="Fix Guide">
        <CardText>{recommendations}</CardText>
      </Card>
    )
  }
})

bot.onAction('run_new_scan', async (event) => {
  await event.thread.post(
    <Card title="Run New Scan">
      <CardText>
        To run a new scan, execute this command on your device:
      </CardText>
      <CardText>
        ```npx @itsquare/agent scan```
      </CardText>
      <CardText>
        _Make sure your ITSQUARE_TOKEN is set!_
      </CardText>
    </Card>
  )
})

bot.onAction('view_dashboard', async () => {
  // This action just acknowledges - the link is in the card
})

bot.onAction('view_fleet_dashboard', async () => {
  // This action just acknowledges - users will click the dashboard link
})

bot.onAction('export_report', async (event) => {
  await event.thread.post(
    <Card title="Export Report">
      <CardText>
        Visit the dashboard to export your fleet report:{'\n'}
        https://itsquare.ai/dashboard/reports
      </CardText>
    </Card>
  )
})

bot.onAction('dismiss_issues', async (event) => {
  await event.thread.post("Issues acknowledged. We recommend addressing critical and high-priority items soon.")
})

export default bot
