/**
 * Command Safety — validates commands against tiered allowlists.
 *
 * HARDCODED safety rules. Not configurable. Not overridable.
 * This is the last line of defense before a command runs on a user's machine.
 *
 * Tiers:
 *   1 = Read-only diagnostics (single consent)
 *   2 = Safe modifications (per-command consent)
 *   3 = System changes (explanation + typed confirmation)
 *   4 = BLOCKED (never executed)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommandValidation {
  allowed: boolean
  tier: 1 | 2 | 3 | 4
  reason?: string
}

export interface ParsedCommand {
  command: string
  tier: 1 | 2 | 3
  explanation: string
  platform: 'darwin' | 'win32' | 'linux' | 'all'
}

// ---------------------------------------------------------------------------
// TIER 4: BLOCKED — checked first, always wins
// ---------------------------------------------------------------------------

const BLOCKED_PATTERNS: RegExp[] = [
  /rm\s+(-rf|-fr)\s+[\/~]/,              // destructive deletion
  /rm\s+-rf\s*$/,                         // bare rm -rf
  /format\s/i,                            // disk format
  /fdisk/,                                // disk partition
  /diskutil\s+erase/,                     // macOS disk erase
  /mkfs/,                                 // make filesystem
  />\s*\/dev\//,                          // write to device
  /\|\s*(curl|wget|bash|sh|nc|python)/,   // pipe to download/execute
  /base64\s+-d/,                          // encoded commands
  /chmod\s+777/,                          // overly permissive
  /passwd/,                               // password changes
  /ssh-keygen.*-f\s*\//,                  // key gen to arbitrary path
  /open\s+vnc:|open\s+ssh:/,             // remote access URLs
  /security\s+(delete|remove)/,           // keychain modification
  /\.ssh\//,                              // SSH directory access
  /\.(bash_history|zsh_history)/,         // shell history
  /\/Desktop|\/Documents|\/Downloads|\/Photos/i, // personal dirs
  /Cookies|Login\s*Data|History/i,        // browser data
  /eval\s*\(/,                            // eval execution
  /;\s*curl\s/,                           // chained download
  /\$\(.*curl/,                           // subshell download
  /`.*curl/,                              // backtick download
  /python[23]?\s+-c/,                     // inline python execution
  /node\s+-e/,                            // inline node execution
  /perl\s+-e/,                            // inline perl execution
]

// ---------------------------------------------------------------------------
// TIER 1: READ-ONLY — safe to batch-execute with single consent
// ---------------------------------------------------------------------------

const TIER_1_READONLY: RegExp[] = [
  // Network
  /^ping\s/,
  /^traceroute\s/,
  /^tracert\s/i,
  /^nslookup\s/,
  /^dig\s/,
  /^curl\s.*-[osIvw]/,                    // curl for diagnostics only
  /^netstat\s/,
  /^ss\s/,
  /^hostname$/,
  /^whoami$/,
  /^cat\s+\/etc\/(resolv\.conf|hosts)$/,
  /^networksetup\s+-(getinfo|getdnsservers|listallhardwareports)/,
  /^iwconfig/,
  /^nmcli\s+d\s+wifi/,
  /^ifconfig/,
  /^ip\s+(addr|route|link)/,
  /^speedtest-cli\s/,

  // Performance
  /^top\s+-l\s+1/,                        // single snapshot only
  /^ps\s+aux/,
  /^df\s/,
  /^du\s/,
  /^uptime$/,
  /^free\s/,
  /^vm_stat/,
  /^iostat\s/,
  /^sysctl\s+-n\s+hw\./,
  /^ls\s+-la\s+\/tmp/,
  /^wc\s+-l/,

  // System info
  /^sw_vers/,
  /^uname\s/,
  /^lsb_release/,
  /^cat\s+\/etc\/(os-release|lsb-release)/,
  /^defaults\s+read\s/,

  // Security (read-only checks)
  /^fdesetup\s+status$/,
  /^csrutil\s+status$/,
  /^spctl\s+--status$/,
  /^softwareupdate\s+-l$/,
  /^ufw\s+status/,
  /^systemctl\s+status\s/,
  /^lsblk/,
  /^security\s+find-identity/,

  // Windows PowerShell (read-only)
  /^Get-(Process|NetIP|DnsClient|NetFirewall|BitLocker|MpComputer|HotFix|LocalUser)/i,
  /^Test-(Connection|NetConnection)/i,
  /^Resolve-DnsName/i,
  /^ipconfig\s*$/i,
  /^ipconfig\s+\/all/i,
  /^netsh\s+wlan\s+show/i,
  /^Get-CimInstance/i,
  /^Get-PSDrive/i,
  /^Get-Counter/i,
  /^systeminfo/i,
]

// ---------------------------------------------------------------------------
// TIER 2: SAFE MODIFICATIONS — require per-command consent
// ---------------------------------------------------------------------------

const TIER_2_SAFE_MODS: RegExp[] = [
  // DNS cache flush
  /^(sudo\s+)?dscacheutil\s+-flushcache/,
  /^(sudo\s+)?killall\s+-HUP\s+mDNSResponder/,
  /^ipconfig\s+\/flushdns/i,
  /^(sudo\s+)?systemd-resolve\s+--flush/,
  /^(sudo\s+)?resolvectl\s+flush/,

  // Network restart
  /^(sudo\s+)?ifconfig\s+\w+\s+(up|down)$/,
  /^(sudo\s+)?systemctl\s+restart\s+NetworkManager/,
  /^networksetup\s+-setdnsservers/,
  /^Set-DnsClientServerAddress/i,
  /^(Disable|Enable)-NetAdapter/i,

  // Process management
  /^pkill\s+-f\s/,
  /^kill\s+\d+$/,
  /^Stop-Process\s+-Name/i,

  // Temp file cleanup
  /^(sudo\s+)?apt\s+clean$/,
  /^(sudo\s+)?journalctl\s+--vacuum/,
  /^Remove-Item\s+.*\\Temp\\/i,
  /^rm\s+-rf\s+~\/Library\/Caches\/[^\/]+$/,  // specific app cache only

  // Firewall enable
  /^(sudo\s+)?\/usr\/libexec\/ApplicationFirewall\/socketfilterfw\s+--setglobalstate\s+on/,
  /^Set-NetFirewallProfile\s.*-Enabled\s+True/i,
  /^(sudo\s+)?ufw\s+enable/,
]

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a command against the tiered safety model.
 * Returns whether it's allowed, which tier it falls into, and why.
 */
export function validateCommand(cmd: string): CommandValidation {
  const trimmed = cmd.trim()

  // Empty commands are blocked
  if (!trimmed) {
    return { allowed: false, tier: 4, reason: 'Empty command' }
  }

  // Length check — long commands are suspicious
  if (trimmed.length > 500) {
    return { allowed: false, tier: 4, reason: 'Command too long (>500 chars)' }
  }

  // Check blocked patterns first — always wins
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, tier: 4, reason: `Blocked by safety rule` }
    }
  }

  // Check Tier 1 (read-only)
  for (const pattern of TIER_1_READONLY) {
    if (pattern.test(trimmed)) {
      return { allowed: true, tier: 1 }
    }
  }

  // Check Tier 2 (safe modifications)
  for (const pattern of TIER_2_SAFE_MODS) {
    if (pattern.test(trimmed)) {
      return { allowed: true, tier: 2 }
    }
  }

  // Unknown command — Tier 3 (requires manual execution or explicit override)
  return {
    allowed: false,
    tier: 3,
    reason: 'Command not in allowlist. User must run manually.',
  }
}

/**
 * Validate a batch of commands. Returns per-command results.
 */
export function validateCommands(
  commands: string[],
): Array<{ command: string } & CommandValidation> {
  return commands.map((cmd) => ({
    command: cmd,
    ...validateCommand(cmd),
  }))
}

/**
 * Check if all commands in a batch are Tier 1 (safe for batch execution).
 */
export function allReadOnly(commands: string[]): boolean {
  return commands.every((cmd) => {
    const v = validateCommand(cmd)
    return v.allowed && v.tier === 1
  })
}

/**
 * Get the highest tier in a command batch.
 */
export function maxTier(commands: string[]): number {
  return Math.max(...commands.map((cmd) => validateCommand(cmd).tier))
}
