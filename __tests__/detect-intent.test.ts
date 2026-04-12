/**
 * Tests for detectDeeperIntent and detectTroubleshootingIntent
 * from app/api/slack/events/route.ts
 *
 * Since these are private functions inside a route file, we extract
 * the logic here for testing. Keep these in sync with the source.
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Copy of the functions (keep in sync with events/route.ts)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= a.length; i++) matrix[i] = [i]
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }
  return matrix[a.length][b.length]
}

function detectDeeperIntent(message: string): boolean {
  const lower = message.toLowerCase().trim()
  const exactTriggers = [
    'go deeper', 'deeper', 'scan my', 'diagnose my', 'check my',
    'run diagnostics', 'run a scan', 'run scan', 'full scan',
    'do a scan', 'scan please', 'scan again',
    'health check', 'system check',
    'analyze my', 'deeper analysis', 'deeper look',
    'please check', 'can you check', 'please scan',
  ]
  if (exactTriggers.some((t) => lower.includes(t))) return true
  const words = lower.split(/\s+/)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + ' ' + words[i + 1]
    if (levenshtein(bigram, 'go deeper') <= 3) return true
    if (levenshtein(bigram, 'run scan') <= 2) return true
    if (levenshtein(bigram, 'check machine') <= 3) return true
    if (levenshtein(bigram, 'diagnose machine') <= 3) return true
  }
  for (const word of words) {
    if (levenshtein(word, 'deeper') <= 2) return true
    if (levenshtein(word, 'diagnose') <= 2) return true
    if (levenshtein(word, 'diagnostic') <= 2) return true
    if (levenshtein(word, 'diagnostics') <= 2) return true
  }
  return false
}

function detectTroubleshootingIntent(message: string): boolean {
  const lower = message.toLowerCase()
  const simplePatterns = [
    'password', 'how do i', 'how to', 'what is', "what's the",
    'where is', 'where do', 'can i', 'set up', 'setup',
    'install', 'download', 'link', 'url', 'login', 'log in',
    'sign in', 'account', 'access', 'permission', 'reset my',
    'forgot', 'update my', 'change my', 'enable', 'disable',
    'turn on', 'turn off', 'schedule', 'meeting', 'calendar',
    'email', 'teams', 'zoom', 'print', 'printer',
    'thank', 'thanks', 'ok', 'okay', 'got it', 'never mind',
  ]
  if (simplePatterns.some((p) => lower.includes(p))) return false
  const troublePatterns = [
    'slow', 'fast', 'speed', 'laggy', 'lag', 'frozen', 'freeze',
    'crash', 'crashing', 'not working', 'not responding', 'stuck',
    "doesnt work", "doesn't work", "dont work", "don't work",
    'stopped working', "won't work", 'wont work', 'not functioning',
    "won't load", "won't open", "won't start", "won't connect",
    "can't connect", 'cant connect', 'no internet', 'disconnecting', 'dropping',
    'blue screen', 'error', 'failed', 'failing', 'broken',
    'battery', 'overheating', 'hot', 'noisy', 'fan',
    'out of space', 'disk full', 'storage', 'memory',
    'wifi', 'wi-fi', 'network', 'internet', 'vpn',
    'taking forever', 'takes long', 'performance',
  ]
  if (troublePatterns.some((p) => lower.includes(p))) return true
  return false
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('detectDeeperIntent', () => {
  it('matches exact scan triggers', () => {
    expect(detectDeeperIntent('go deeper')).toBe(true)
    expect(detectDeeperIntent('run a scan')).toBe(true)
    expect(detectDeeperIntent('full scan please')).toBe(true)
    expect(detectDeeperIntent('scan please')).toBe(true)
    expect(detectDeeperIntent('do a scan')).toBe(true)
    expect(detectDeeperIntent('scan again')).toBe(true)
    expect(detectDeeperIntent('please scan')).toBe(true)
    expect(detectDeeperIntent('run scan')).toBe(true)
    expect(detectDeeperIntent('health check')).toBe(true)
    expect(detectDeeperIntent('check my machine')).toBe(true)
    expect(detectDeeperIntent('diagnose my laptop')).toBe(true)
  })

  it('handles typos via fuzzy matching', () => {
    expect(detectDeeperIntent('goo peeper')).toBe(true)   // go deeper
    expect(detectDeeperIntent('go deper')).toBe(true)      // go deeper
    expect(detectDeeperIntent('go depper')).toBe(true)     // go deeper
    expect(detectDeeperIntent('diganose')).toBe(true)      // diagnose
    expect(detectDeeperIntent('depper')).toBe(true)        // deeper
  })

  it('rejects unrelated messages', () => {
    expect(detectDeeperIntent('my wifi is slow')).toBe(false)
    expect(detectDeeperIntent('thanks')).toBe(false)
    expect(detectDeeperIntent('hello')).toBe(false)
    expect(detectDeeperIntent("what's the wifi password?")).toBe(false)
  })
})

describe('detectTroubleshootingIntent', () => {
  it('identifies troubleshooting issues', () => {
    expect(detectTroubleshootingIntent('my wifi is slow')).toBe(true)
    expect(detectTroubleshootingIntent('laptop is frozen')).toBe(true)
    expect(detectTroubleshootingIntent('app keeps crashing')).toBe(true)
    expect(detectTroubleshootingIntent('my mouse doesnt work')).toBe(true)
    expect(detectTroubleshootingIntent("keyboard doesn't work")).toBe(true)
    expect(detectTroubleshootingIntent('no internet connection')).toBe(true)
    expect(detectTroubleshootingIntent("can't connect to vpn")).toBe(true)
    expect(detectTroubleshootingIntent('blue screen of death')).toBe(true)
    expect(detectTroubleshootingIntent('laptop overheating')).toBe(true)
    expect(detectTroubleshootingIntent('disk full')).toBe(true)
    expect(detectTroubleshootingIntent('out of space')).toBe(true)
    expect(detectTroubleshootingIntent('wifi keeps dropping')).toBe(true)
    expect(detectTroubleshootingIntent('stopped working')).toBe(true)
  })

  it('identifies simple questions (no scan needed)', () => {
    expect(detectTroubleshootingIntent("what's the wifi password?")).toBe(false)
    expect(detectTroubleshootingIntent('how do i reset my password')).toBe(false)
    expect(detectTroubleshootingIntent('how to install zoom')).toBe(false)
    expect(detectTroubleshootingIntent('where is the printer')).toBe(false)
    expect(detectTroubleshootingIntent('can i access the VPN from home')).toBe(false)
    expect(detectTroubleshootingIntent('thanks for the help!')).toBe(false)
    expect(detectTroubleshootingIntent('ok got it')).toBe(false)
    expect(detectTroubleshootingIntent('schedule a meeting')).toBe(false)
    expect(detectTroubleshootingIntent('set up my email')).toBe(false)
  })

  it('returns false for ambiguous messages', () => {
    expect(detectTroubleshootingIntent('hello')).toBe(false)
    expect(detectTroubleshootingIntent('help')).toBe(false)
    expect(detectTroubleshootingIntent('please do')).toBe(false)
  })
})

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('hello', 'hello')).toBe(0)
  })

  it('returns correct distance for simple edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('deeper', 'depper')).toBe(1)
    expect(levenshtein('deeper', 'peeper')).toBe(1)
  })

  it('handles empty strings', () => {
    expect(levenshtein('', 'hello')).toBe(5)
    expect(levenshtein('hello', '')).toBe(5)
    expect(levenshtein('', '')).toBe(0)
  })
})
