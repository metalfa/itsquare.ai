/**
 * Command Executor — runs approved commands with safety checks.
 *
 * Double-validates every command against the local safety model
 * even though the server already validated. Belt AND suspenders.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'
import { isCommandSafe } from './safety.js'
import type { CommandResult, Platform } from './types.js'

const execAsync = promisify(exec)

/**
 * Execute a list of approved commands sequentially.
 * Each command is safety-checked locally before execution.
 */
export async function executeCommands(
  commands: Array<{ command: string; tier: number; explanation: string }>,
): Promise<CommandResult[]> {
  const platform = os.platform() as Platform
  const shell = platform === 'win32' ? 'powershell.exe' : '/bin/bash'
  const results: CommandResult[] = []

  for (const cmd of commands) {
    // Local safety check — belt AND suspenders
    const safetyCheck = isCommandSafe(cmd.command)
    if (!safetyCheck.safe) {
      results.push({
        command: cmd.command,
        stdout: '',
        stderr: `BLOCKED locally: ${safetyCheck.reason}`,
        exitCode: -1,
        tier: cmd.tier,
        executedAt: new Date().toISOString(),
      })
      continue
    }

    try {
      const { stdout, stderr } = await execAsync(cmd.command, {
        timeout: 30000,           // 30 seconds max per command
        maxBuffer: 1024 * 100,    // 100KB max output
        shell,
      })

      results.push({
        command: cmd.command,
        stdout: stdout.substring(0, 5000).trim(),
        stderr: stderr.substring(0, 2000).trim(),
        exitCode: 0,
        tier: cmd.tier,
        executedAt: new Date().toISOString(),
      })
    } catch (error: any) {
      results.push({
        command: cmd.command,
        stdout: (error.stdout || '').substring(0, 5000).trim(),
        stderr: (error.stderr || error.message || '').substring(0, 2000).trim(),
        exitCode: error.code || 1,
        tier: cmd.tier,
        executedAt: new Date().toISOString(),
      })
    }
  }

  return results
}
