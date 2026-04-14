/**
 * Slack Web API wrapper.
 * All outbound Slack calls go through here.
 */

const SLACK_API = 'https://slack.com/api'

interface SlackApiResponse {
  ok: boolean
  error?: string
  [key: string]: unknown
}

/**
 * Post a message to a Slack channel/DM, optionally in a thread.
 */
export async function postMessage(
  botToken: string,
  channel: string,
  text: string,
  threadTs?: string,
): Promise<SlackApiResponse> {
  const body: Record<string, string> = { channel, text }
  if (threadTs) body.thread_ts = threadTs

  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data: SlackApiResponse = await res.json()

  if (!data.ok) {
    console.error('[ITSquare] Slack postMessage error:', data.error)
  }

  return data
}

/**
 * Send a delayed response to a slash command via response_url.
 */
export async function respondToCommand(
  responseUrl: string,
  text: string,
  ephemeral = true,
): Promise<boolean> {
  const res = await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_type: ephemeral ? 'ephemeral' : 'in_channel',
      text,
    }),
  })

  return res.ok
}

/**
 * Add a reaction to a message (e.g., "eyes" while processing).
 */
export async function addReaction(
  botToken: string,
  channel: string,
  timestamp: string,
  emoji: string,
): Promise<void> {
  await fetch(`${SLACK_API}/reactions.add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, timestamp, name: emoji }),
  })
}

/**
 * Remove a reaction from a message.
 */
export async function removeReaction(
  botToken: string,
  channel: string,
  timestamp: string,
  emoji: string,
): Promise<void> {
  await fetch(`${SLACK_API}/reactions.remove`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, timestamp, name: emoji }),
  })
}

/**
 * Publish (or update) the App Home tab for a user.
 */
export async function publishAppHome(
  botToken: string,
  slackUserId: string,
  view: Record<string, unknown>,
): Promise<SlackApiResponse> {
  const res = await fetch(`${SLACK_API}/views.publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: slackUserId, view }),
  })

  const data: SlackApiResponse = await res.json()

  if (!data.ok) {
    console.error('[ITSquare] Slack publishAppHome error:', data.error)
  }

  return data
}

/**
 * Open a DM channel with a user and return the channel ID.
 */
export async function openDirectMessage(
  botToken: string,
  slackUserId: string,
): Promise<string | null> {
  const res = await fetch(`${SLACK_API}/conversations.open`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ users: slackUserId }),
  })

  const data: SlackApiResponse = await res.json()

  if (!data.ok) {
    console.error('[ITSquare] Slack openDirectMessage error:', data.error)
    return null
  }

  const channel = data.channel as { id?: string } | undefined
  return channel?.id ?? null
}
