/**
 * Application constants — single source of truth.
 */

/** Maximum conversation history messages to include in AI context */
export const MAX_CONTEXT_MESSAGES = 10

/** Maximum AI output tokens per response */
export const MAX_OUTPUT_TOKENS = 500

/** AI model identifier */
export const AI_MODEL = 'gpt-4o-mini'

/** Slack signature verification: max age in seconds */
export const SLACK_SIGNATURE_MAX_AGE_SECONDS = 300

/** Free tier message limit per workspace per month */
export const FREE_TIER_MESSAGE_LIMIT = 50
