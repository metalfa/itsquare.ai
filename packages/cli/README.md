# @itsquare/agent

CLI agent for ITSquare.AI — runs on employee machines to collect deep system diagnostics and execute approved remediation commands.

## Why?

The browser scan (zero-install) gives good data — CPU benchmark, speed test, latency. But it can't see:
- Real RAM usage (available GB, not just total)
- Disk space (actual, not browser quota)
- Running processes (what's eating CPU/memory)
- Uptime, firewall status, disk encryption
- OS-level diagnostics (network config, DNS, services)

The CLI agent fills that gap. It runs locally, collects deep data, and sends it to ITSquare for AI-powered diagnosis.

## Install

```bash
npx @itsquare/agent setup
```

## Commands

```bash
# One-time setup — configure server URL + workspace token
npx @itsquare/agent setup

# Scan your machine and upload to ITSquare
npx @itsquare/agent scan

# Listen for diagnostic requests from Slack (long-running)
npx @itsquare/agent listen

# Execute a specific approved request
npx @itsquare/agent exec <request-id>

# Check configuration
npx @itsquare/agent status
```

## How It Works

1. **IT admin installs the bot** in Slack via OAuth
2. **Employee reports an issue** — "my laptop is slow"
3. **ITSquare AI** proposes diagnostic commands in the Slack thread
4. **Employee approves** via Block Kit buttons in Slack
5. **CLI agent executes** the approved commands locally
6. **Results are sent back** to ITSquare for AI interpretation
7. **AI posts diagnosis** with specific fix steps in the Slack thread

## Security

- **4-tier safety model** — commands are classified as read-only, safe modification, manual review, or blocked
- **Server-side + client-side validation** — every command is checked twice (belt AND suspenders)
- **Blocked patterns** — destructive commands (`rm -rf`, `format`, `fdisk`, etc.) are hardcoded blocked
- **30-second timeout** per command
- **100KB output limit** per command
- **Config stored with 600 permissions** — only the user can read it

## Supported Platforms

- macOS
- Windows (PowerShell)
- Linux

## Data Collected by `scan`

| Data | macOS | Windows | Linux |
|------|-------|---------|-------|
| Hostname, OS, version | ✅ | ✅ | ✅ |
| CPU model + cores | ✅ | ✅ | ✅ |
| RAM (total + available) | ✅ | ✅ | ✅ |
| Disk (total + available) | ✅ | ✅ | ✅ |
| Uptime | ✅ | ✅ | ✅ |
| Top 5 processes | ✅ | ✅ | ✅ |
| Firewall status | ✅ | ✅ | ✅ |
| Disk encryption | ✅ (FileVault) | ✅ (BitLocker) | ✅ (LUKS) |
