/**
 * Command Safety — client-side validation.
 * 
 * HARDCODED. Not configurable. Not overridable.
 * This is the last line of defense on the user's machine.
 * Mirrors the server-side safety model but runs locally as a double-check.
 */

const BLOCKED_PATTERNS: RegExp[] = [
  /rm\s+(-rf|-fr)\s+[\/~]/,
  /rm\s+-rf\s*$/,
  /format\s/i,
  /fdisk/,
  /diskutil\s+erase/,
  /mkfs/,
  />\s*\/dev\//,
  /\|\s*(curl|wget|bash|sh|nc|python)/,
  /base64\s+-d/,
  /chmod\s+777/,
  /passwd/,
  /ssh-keygen.*-f\s*\//,
  /open\s+vnc:|open\s+ssh:/,
  /security\s+(delete|remove)/,
  /\.ssh\//,
  /\.(bash_history|zsh_history)/,
  /\/Desktop|\/Documents|\/Downloads|\/Photos/i,
  /Cookies|Login\s*Data|History/i,
  /eval\s*\(/,
  /;\s*curl\s/,
  /\$\(.*curl/,
  /`.*curl/,
  /python[23]?\s+-c/,
  /node\s+-e/,
  /perl\s+-e/,
]

export function isCommandSafe(cmd: string): { safe: boolean; reason?: string } {
  const trimmed = cmd.trim()

  if (!trimmed) return { safe: false, reason: 'Empty command' }
  if (trimmed.length > 500) return { safe: false, reason: 'Command too long' }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: `Blocked by safety rule` }
    }
  }

  return { safe: true }
}
