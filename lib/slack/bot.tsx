import { Chat, Card, CardText, Actions, Button, Divider, Fields, Field } from 'chat'
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

// Format device health score as color indicator
function getHealthColor(score: number | null): string {
  if (!score) return 'gray'
  if (score >= 80) return 'good'
  if (score >= 60) return 'warning'
  return 'danger'
}

// Create a device health summary card
function createDeviceHealthCard(scan: DeviceScan) {
  const healthColor = getHealthColor(scan.overall_health_score)
  
  return (
    <Card title={`Device Health: ${scan.hostname || 'Unknown Device'}`}>
      <Fields>
        <Field title="Health Score">
          {scan.overall_health_score ? `${scan.overall_health_score}/100` : 'N/A'}
        </Field>
        <Field title="Security Score">
          {scan.security_score ? `${scan.security_score}/100` : 'N/A'}
        </Field>
        <Field title="OS">
          {scan.os_type ? `${scan.os_type} ${scan.os_version || ''}` : 'Unknown'}
        </Field>
        <Field title="Last Scan">
          {new Date(scan.created_at).toLocaleDateString()}
        </Field>
      </Fields>
      {scan.issue_count_critical > 0 || scan.issue_count_high > 0 ? (
        <>
          <Divider />
          <CardText>
            {scan.issue_count_critical > 0 && `Critical Issues: ${scan.issue_count_critical} `}
            {scan.issue_count_high > 0 && `High Issues: ${scan.issue_count_high}`}
          </CardText>
        </>
      ) : null}
      <Divider />
      <Actions>
        <Button id="view_full_report" style="primary">View Full Report</Button>
        <Button id="run_new_scan">Run New Scan</Button>
      </Actions>
    </Card>
  )
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
  
  // Handle common queries
  if (text.includes('health') || text.includes('status') || text.includes('scan')) {
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
    
    await thread.post(createDeviceHealthCard(latestScan))
    return
  }
  
  if (text.includes('help')) {
    await thread.post(
      <Card title="ITSquare.AI Help">
        <CardText>
          I&apos;m your AI IT assistant. Here&apos;s what I can help with:
        </CardText>
        <Divider />
        <CardText>
          • **Device Health**: Ask about your device status or security score{'\n'}
          • **IT Support**: Ask any IT question and I&apos;ll help troubleshoot{'\n'}
          • **Access Requests**: Request access to apps and tools{'\n'}
          • **Run Scans**: Generate tokens to scan your device
        </CardText>
        <Divider />
        <CardText>
          Try saying: &quot;What&apos;s my device health?&quot; or &quot;I need help with VPN&quot;
        </CardText>
      </Card>
    )
    return
  }
  
  // Default AI response - will be enhanced in Phase 3
  await thread.post(
    <Card title="ITSquare.AI">
      <CardText>
        I received your message! AI-powered responses are coming soon. For now, try:
      </CardText>
      <CardText>
        • &quot;What&apos;s my device health?&quot;{'\n'}
        • &quot;Help&quot; - to see what I can do
      </CardText>
    </Card>
  )
})

// Handle messages in subscribed threads
bot.onSubscribedMessage(async (thread, message) => {
  // Skip bot's own messages
  if (message.author.isMe) return
  
  const text = message.text?.toLowerCase() || ''
  
  // Simple keyword-based responses for now
  // Will be replaced with AI in Phase 3
  if (text.includes('thank')) {
    await thread.post("You're welcome! Let me know if you need anything else.")
    return
  }
  
  await thread.post("I'm here to help! Try asking about your device health or say 'help' for options.")
})

// Handle slash command /itsquare
bot.onSlashCommand('/itsquare', async (event) => {
  const args = event.text?.trim().toLowerCase() || ''
  
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
  
  if (args === 'scan' || args === 'health') {
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
    
    await event.respond(createDeviceHealthCard(latestScan))
    return
  }
  
  if (args === 'token') {
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
        Available commands:{'\n'}
        • `/itsquare scan` - View your latest device health{'\n'}
        • `/itsquare token` - Generate a scan token{'\n'}
        • `/itsquare help` - Show this message
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
          Here is your personal scan token. Save it securely - it cannot be shown again!
        </CardText>
        <Divider />
        <CardText>
          ```{token}```
        </CardText>
        <Divider />
        <CardText>
          To scan your device, run:{'\n'}
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
  await event.thread.post(
    <Card title="Full Report">
      <CardText>
        View your complete device health report in the dashboard:
      </CardText>
      <CardText>
        https://itsquare.ai/dashboard/scans
      </CardText>
    </Card>
  )
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
    </Card>
  )
})

export default bot
