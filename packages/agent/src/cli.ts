#!/usr/bin/env node
import { program } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { collectAllInfo, detectOS } from './collectors/index.js'
import { submitScan } from './api.js'

const VERSION = '0.1.0'

program
  .name('itsquare')
  .description('ITSquare.AI device health scanner')
  .version(VERSION)

program
  .command('scan')
  .description('Scan this device and submit health report')
  .option('-t, --token <token>', 'API token (or set ITSQUARE_TOKEN env var)')
  .option('--api-url <url>', 'API URL (default: https://itsquare.ai)')
  .option('--json', 'Output results as JSON')
  .option('--dry-run', 'Collect data but do not submit')
  .action(async (options) => {
    const token = options.token || process.env.ITSQUARE_TOKEN
    
    if (!token && !options.dryRun) {
      console.error(chalk.red('Error: No API token provided'))
      console.error(chalk.gray('Set ITSQUARE_TOKEN environment variable or use --token'))
      console.error(chalk.gray('Get a token by running /itsquare token in Slack'))
      process.exit(1)
    }
    
    const spinner = ora('Scanning device...').start()
    
    try {
      // Collect device info
      spinner.text = 'Collecting system information...'
      const scanData = await collectAllInfo()
      
      if (options.dryRun) {
        spinner.stop()
        console.log(chalk.cyan('\n--- Dry Run: Scan Data ---\n'))
        console.log(JSON.stringify(scanData, null, 2))
        return
      }
      
      if (options.json) {
        spinner.stop()
      } else {
        spinner.text = 'Submitting scan results...'
      }
      
      // Submit to API
      const result = await submitScan(scanData, token!, options.apiUrl)
      
      spinner.stop()
      
      if (options.json) {
        console.log(JSON.stringify({ scanData, result }, null, 2))
        return
      }
      
      if (result.success) {
        console.log(chalk.green('\n✓ Scan complete!\n'))
        
        // Display results
        const healthColor = (result.overall_health_score || 0) >= 75 
          ? chalk.green 
          : (result.overall_health_score || 0) >= 50 
            ? chalk.yellow 
            : chalk.red
        
        console.log(chalk.bold('Device Health Report'))
        console.log(chalk.gray('─'.repeat(40)))
        console.log(`  Device:     ${chalk.white(scanData.hostname || 'Unknown')}`)
        console.log(`  OS:         ${chalk.white(`${scanData.os_type} ${scanData.os_version || ''}`)}`)
        console.log(`  Health:     ${healthColor(`${result.overall_health_score}/100`)}`)
        console.log(`  Security:   ${healthColor(`${result.security_score}/100`)}`)
        console.log()
        
        if (result.issues_count && result.issues_count > 0) {
          console.log(chalk.bold('Issues Found'))
          console.log(chalk.gray('─'.repeat(40)))
          if (result.issues_by_severity?.critical) {
            console.log(chalk.red(`  Critical: ${result.issues_by_severity.critical}`))
          }
          if (result.issues_by_severity?.high) {
            console.log(chalk.hex('#FFA500')(`  High:     ${result.issues_by_severity.high}`))
          }
          if (result.issues_by_severity?.medium) {
            console.log(chalk.yellow(`  Medium:   ${result.issues_by_severity.medium}`))
          }
          if (result.issues_by_severity?.low) {
            console.log(chalk.gray(`  Low:      ${result.issues_by_severity.low}`))
          }
          console.log()
        } else {
          console.log(chalk.green('No security issues found!'))
          console.log()
        }
        
        console.log(chalk.gray('Check Slack for detailed results and recommendations.'))
      } else {
        console.error(chalk.red(`\n✗ Scan failed: ${result.error}\n`))
        process.exit(1)
      }
    } catch (error) {
      spinner.stop()
      console.error(chalk.red(`\n✗ Error: ${(error as Error).message}\n`))
      process.exit(1)
    }
  })

program
  .command('info')
  .description('Show device information without submitting')
  .action(async () => {
    const spinner = ora('Collecting device info...').start()
    
    try {
      const scanData = await collectAllInfo()
      spinner.stop()
      
      console.log(chalk.bold('\nDevice Information'))
      console.log(chalk.gray('─'.repeat(40)))
      console.log(`  Hostname:       ${scanData.hostname || 'Unknown'}`)
      console.log(`  OS:             ${scanData.os_type} ${scanData.os_version || ''}`)
      console.log(`  CPU:            ${scanData.cpu_model || 'Unknown'}`)
      console.log(`  CPU Cores:      ${scanData.cpu_cores || 'Unknown'}`)
      console.log(`  RAM:            ${scanData.ram_total_gb || 'Unknown'} GB`)
      console.log(`  Disk Total:     ${scanData.disk_total_gb || 'Unknown'} GB`)
      console.log(`  Disk Free:      ${scanData.disk_free_gb || 'Unknown'} GB`)
      console.log()
      
      console.log(chalk.bold('Security Status'))
      console.log(chalk.gray('─'.repeat(40)))
      console.log(`  Firewall:       ${formatStatus(scanData.firewall_enabled)}`)
      
      if (scanData.os_type === 'macos') {
        console.log(`  FileVault:      ${formatStatus(scanData.filevault_enabled)}`)
        console.log(`  Gatekeeper:     ${formatStatus(scanData.gatekeeper_enabled)}`)
        console.log(`  SIP:            ${formatStatus(scanData.sip_enabled)}`)
      } else if (scanData.os_type === 'windows') {
        console.log(`  BitLocker:      ${formatStatus(scanData.bitlocker_enabled)}`)
        console.log(`  Secure Boot:    ${formatStatus(scanData.secure_boot_enabled)}`)
      }
      
      console.log(`  Antivirus:      ${scanData.antivirus_installed ? chalk.green(scanData.antivirus_name || 'Installed') : chalk.red('Not detected')}`)
      console.log(`  OS Up to Date:  ${formatStatus(scanData.os_up_to_date)}`)
      if (scanData.pending_updates !== undefined) {
        console.log(`  Pending Updates: ${scanData.pending_updates}`)
      }
      console.log()
      
      console.log(chalk.bold('Network'))
      console.log(chalk.gray('─'.repeat(40)))
      console.log(`  Internet:       ${formatStatus(scanData.internet_connected)}`)
      console.log(`  VPN:            ${formatStatus(scanData.vpn_connected)}`)
      if (scanData.wifi_security_type) {
        console.log(`  Wi-Fi Security: ${scanData.wifi_security_type}`)
      }
      if (scanData.ping_google_ms) {
        console.log(`  Ping (Google):  ${scanData.ping_google_ms}ms`)
      }
      if (scanData.ping_cloudflare_ms) {
        console.log(`  Ping (CF):      ${scanData.ping_cloudflare_ms}ms`)
      }
      console.log()
      
      console.log(chalk.gray(`Scan completed in ${scanData.scan_duration_ms}ms`))
    } catch (error) {
      spinner.stop()
      console.error(chalk.red(`Error: ${(error as Error).message}`))
      process.exit(1)
    }
  })

function formatStatus(value: boolean | undefined): string {
  if (value === undefined) return chalk.gray('Unknown')
  return value ? chalk.green('Enabled') : chalk.red('Disabled')
}

program.parse()
