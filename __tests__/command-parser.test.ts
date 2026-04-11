import { describe, it, expect } from 'vitest'
import { parseCommandResponse, detectPlatform } from '../lib/services/command-parser'

describe('parseCommandResponse', () => {
  it('returns null commands when no [COMMANDS] block exists', () => {
    const result = parseCommandResponse('Just a normal response about wifi settings.')
    expect(result.commands).toBeNull()
    expect(result.cleanText).toBe('Just a normal response about wifi settings.')
    expect(result.hasBlockedCommands).toBe(false)
  })

  it('parses a [COMMANDS] block with pipe-separated explanations', () => {
    const aiResponse = `Let me check your network configuration.

[COMMANDS]
ping -c 5 8.8.8.8 | Check internet connectivity
nslookup google.com | Check DNS resolution
cat /etc/resolv.conf | Check DNS configuration
[/COMMANDS]

I'll analyze the results and get back to you.`

    const result = parseCommandResponse(aiResponse)
    expect(result.commands).toHaveLength(3)
    expect(result.commands![0].command).toBe('ping -c 5 8.8.8.8')
    expect(result.commands![0].explanation).toBe('Check internet connectivity')
    expect(result.commands![0].tier).toBe(1)
    expect(result.cleanText).toContain('Let me check your network')
    expect(result.cleanText).toContain('analyze the results')
    expect(result.cleanText).not.toContain('[COMMANDS]')
  })

  it('filters out blocked commands', () => {
    const aiResponse = `[COMMANDS]
ping -c 5 8.8.8.8 | Check connectivity
rm -rf / | Delete everything
uptime | Check uptime
[/COMMANDS]`

    const result = parseCommandResponse(aiResponse)
    expect(result.commands).toHaveLength(2) // rm -rf blocked
    expect(result.hasBlockedCommands).toBe(true)
    expect(result.blockedCommands).toHaveLength(1)
    expect(result.blockedCommands[0].command).toBe('rm -rf /')
  })

  it('handles mixed tier commands', () => {
    const aiResponse = `[COMMANDS]
ping -c 5 8.8.8.8 | Check connectivity
sudo dscacheutil -flushcache | Flush DNS cache
[/COMMANDS]`

    const result = parseCommandResponse(aiResponse)
    expect(result.commands).toHaveLength(2)
    expect(result.commands![0].tier).toBe(1)
    expect(result.commands![1].tier).toBe(2)
  })

  it('handles commands without explanations', () => {
    const aiResponse = `[COMMANDS]
uptime
df -h /
[/COMMANDS]`

    const result = parseCommandResponse(aiResponse)
    expect(result.commands).toHaveLength(2)
    expect(result.commands![0].command).toBe('uptime')
    expect(result.commands![0].explanation).toBe('Run diagnostic command')
  })
})

describe('detectPlatform', () => {
  it('detects macOS', () => {
    expect(detectPlatform('macOS')).toBe('darwin')
    expect(detectPlatform('Mac OS X')).toBe('darwin')
    expect(detectPlatform('Darwin')).toBe('darwin')
  })

  it('detects Windows', () => {
    expect(detectPlatform('Windows 11')).toBe('win32')
    expect(detectPlatform('Windows 10 Pro')).toBe('win32')
    expect(detectPlatform('Win32')).toBe('win32')
  })

  it('detects Linux', () => {
    expect(detectPlatform('Ubuntu 22.04')).toBe('linux')
    expect(detectPlatform('Linux')).toBe('linux')
    expect(detectPlatform('Debian 12')).toBe('linux')
  })

  it('defaults to darwin when null', () => {
    expect(detectPlatform(null)).toBe('darwin')
    expect(detectPlatform(undefined)).toBe('darwin')
  })
})
