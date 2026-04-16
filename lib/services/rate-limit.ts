/**
 * In-memory sliding window rate limiter.
 *
 * Tracks request timestamps per key (IP, team_id, or token).
 * Each Vercel serverless instance gets its own counter — this is intentional:
 * it protects against rapid bursts without needing Redis.
 *
 * For a distributed rate limiter, swap this for Upstash Redis later.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetMs: number
}

/**
 * Check and consume one request for the given key.
 *
 * @param key      Unique identifier (e.g. team_id, IP, token)
 * @param limit    Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + windowMs - now,
    }
  }

  // Allow and record
  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetMs: windowMs,
  }
}

/**
 * Pre-configured rate limits for different endpoint types.
 */
export const RATE_LIMITS = {
  // Slack endpoints: 30 requests per minute per workspace
  // Slack itself limits to ~1 event/sec but bursts can happen
  slackEvents: { limit: 30, windowMs: 60_000 },

  // Slash commands: 20 per minute per workspace
  slackCommands: { limit: 20, windowMs: 60_000 },

  // Interactions (button clicks): 30 per minute per workspace
  slackInteractions: { limit: 30, windowMs: 60_000 },

  // Diagnostic page loads: 10 per minute per token
  diagnosticCheck: { limit: 10, windowMs: 60_000 },

  // Dashboard API: 30 per minute per user
  dashboardApi: { limit: 30, windowMs: 60_000 },

  // Auth/OAuth: 10 per minute per IP (prevent brute force)
  auth: { limit: 10, windowMs: 60_000 },

  // Knowledge base API: 20 per minute per user
  knowledgeApi: { limit: 20, windowMs: 60_000 },
} as const
