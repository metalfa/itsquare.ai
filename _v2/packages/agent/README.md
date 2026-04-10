# @itsquare/agent

Device health scanner CLI for ITSquare.AI.

## Installation

```bash
npm install -g @itsquare/agent
# or use directly with npx
npx @itsquare/agent scan
```

## Usage

### Get a Token

First, get a scan token from Slack:

```
/itsquare token
```

### Scan Your Device

```bash
# Using environment variable
export ITSQUARE_TOKEN=itsq_xxx
npx @itsquare/agent scan

# Or pass token directly
npx @itsquare/agent scan --token itsq_xxx
```

### View Device Info (Without Submitting)

```bash
npx @itsquare/agent info
```

### Options

```
scan [options]    Scan this device and submit health report
  -t, --token     API token (or set ITSQUARE_TOKEN env var)
  --api-url       API URL (default: https://itsquare.ai)
  --json          Output results as JSON
  --dry-run       Collect data but do not submit

info              Show device information without submitting
```

## What It Checks

### All Platforms
- Hostname and OS version
- CPU and RAM
- Disk space
- Internet connectivity
- Network latency (ping)
- VPN status
- Wi-Fi security

### macOS
- Firewall status
- FileVault encryption
- Gatekeeper
- System Integrity Protection (SIP)
- Software updates
- Antivirus (Malwarebytes, Norton, etc.)

### Windows
- Windows Firewall
- BitLocker encryption
- Secure Boot
- Windows Defender status
- Windows Update
- Third-party antivirus

### Linux
- UFW/firewalld status
- LUKS encryption
- Package updates (apt/dnf/yum)
- ClamAV or other AV

## Privacy

The agent only collects system health and security information. It does NOT collect:
- Personal files or documents
- Browser history or passwords
- Email or messages
- Application data

All data is transmitted securely to your organization's ITSquare instance.
